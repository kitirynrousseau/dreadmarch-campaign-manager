;(function () {
  // DM4 STATE MANAGER MODULE
  if (!window.DM4 || !window.DM4.config) {
    console.error("[DREADMARCH][STATE] DM4 runtime not initialized.");
    return;
  }
  var DM4 = window.DM4;
  const DM4_DEBUG = !!(DM4.config && DM4.config.debug);
  DM4.state = DM4.state || {};


/***********************
   * 3) STATE MANAGER
   ***********************/
  
  // DM4_HELPER_FUNCTION: isKnownMode
  const DM4_MODES = ["navcom", "strategic"];
  
  function isKnownMode(mode) {
    return DM4_MODES.includes(mode);
  }

  // DM4_CORE_FUNCTION: createStateManager
  function createStateManager(config, dataset, campaign) {
    let subscribers = [];

    let state = {
      config: config || {},
      dataset: dataset || { systems: {} },
      campaign: campaign || {
        factions: [],
        systemControl: [],
        actors: [],
        assetRequests: [],
        budgets: { players: {} },
        actorTypes: [],
        assetCatalog: []
      },
      access: {
        tier: "viewer",
        playerId: null,
        factions: [],
        capabilities: {
          canEditOwnActors: false,
          canEditFactionActors: false,
          canEditSystemControl: false,
          canSeeGmOnly: false
        }
      },
      selection: {
        system: null
      },
      mode: "navcom",
      editor: {
        enabled: false,
        jobs: []
      }
    };

    // DM4_HELPER_FUNCTION: getState

    function getState() {
      return state;
    }

    // DM4_HELPER_FUNCTION: scopeApplies
    // Checks if a subscriber's scope matches the changed scope
    function scopeApplies(subscribedScope, changedScope) {
      // Empty subscribedScope means subscribe to all changes
      if (subscribedScope.length === 0) {
        return true;
      }
      // Check if the changedScope starts with the subscribedScope
      return subscribedScope.every(function (s, i) {
        return s === changedScope[i];
      });
    }

    // DM4_HELPER_FUNCTION: notifySubscribers
    // Now accepts a changedScopePath to filter subscribers
    function notifySubscribers(changedScopePath) {
      changedScopePath = changedScopePath || [];
      const snapshot = state;
      subscribers.forEach(function (subscriber) {
        if (scopeApplies(subscriber.scopePath, changedScopePath)) {
          subscriber.fn(snapshot);
        }
      });
    }

    // Batching mechanism for notifications
    let batchedChanges = new Set();
    let notifyTimeout = null;

    // DM4_HELPER_FUNCTION: batchNotify
    // Queues a scope change and delays notification to batch multiple updates
    function batchNotify(changeScope) {
      changeScope = changeScope || [];
      // Use simpler string key for better performance
      // Use special marker for empty scope to avoid empty string issues
      const scopeKey = changeScope.length > 0 ? changeScope.join('.') : '__root__';
      batchedChanges.add(scopeKey);
      
      if (!notifyTimeout) {
        notifyTimeout = setTimeout(function () {
          // Process all batched changes
          const scopes = Array.from(batchedChanges).map(function (key) {
            return key === '__root__' ? [] : key.split('.');
          });
          batchedChanges.clear();
          notifyTimeout = null;
          
          // Collect all subscribers that need notification (deduped by function reference)
          const subscribersToNotify = new Set();
          scopes.forEach(function (scope) {
            subscribers.forEach(function (subscriber) {
              if (scopeApplies(subscriber.scopePath, scope)) {
                subscribersToNotify.add(subscriber);
              }
            });
          });
          
          // Notify each subscriber only once with current state
          const snapshot = state;
          subscribersToNotify.forEach(function (subscriber) {
            subscriber.fn(snapshot);
          });
        }, 10); // 10ms delay for batching
      }
    }

    // DM4_HELPER_FUNCTION: subscribe
    // Now accepts an optional scopePath parameter
    function subscribe(fn, scopePath) {
      scopePath = scopePath || [];
      subscribers.push({ fn: fn, scopePath: scopePath });
      fn(state); // Immediate snapshot on subscribe
      return function () {
        subscribers = subscribers.filter(function (s) {
          return s.fn !== fn;
        });
      };
    }

    const actions = {
      selectSystem: function (systemId) {
        state = Object.assign({}, state, {
          selection: Object.assign({}, state.selection, {
            system: systemId
          })
        });
        batchNotify(['selection']);
      },

      setMode: function (mode) {
        if (!isKnownMode(mode)) {
          if (DM4_DEBUG) {
            DM4.Logger.warn("[STATE] Attempt to set unknown mode:", mode);
          }
          return;
        }
        state = Object.assign({}, state, { mode: mode });
        batchNotify(['mode']);
      },

      setDataset: function (newDataset) {
        state = Object.assign({}, state, {
          dataset: newDataset || { systems: {} }
        });
        batchNotify(['dataset']);
      },

      setCampaign: function (newCampaign) {
        state = Object.assign({}, state, {
          campaign: newCampaign || state.campaign
        });
        batchNotify(['campaign']);
      },

      setAccess: function (partial) {
        state = Object.assign({}, state, {
          access: Object.assign({}, state.access, partial)
        });
        batchNotify(['access']);
      },

      setEditorEnabled: function (enabled) {
        const current = state.editor || { enabled: false, jobs: [] };
        state = Object.assign({}, state, {
          editor: Object.assign({}, current, { enabled: !!enabled })
        });
        batchNotify(['editor']);
      },

      addEditorJob: function (job) {
        const current = state.editor || { enabled: false, jobs: [] };
        const jobs = (current.jobs || []).concat(job || {});
        state = Object.assign({}, state, {
          editor: Object.assign({}, current, { jobs: jobs })
        });
        batchNotify(['editor']);
      },

      clearEditorJobs: function () {
        const current = state.editor || { enabled: false, jobs: [] };
        state = Object.assign({}, state, {
          editor: Object.assign({}, current, { jobs: [] })
        });
        batchNotify(['editor']);
      }
    };

    return { getState: getState, subscribe: subscribe, actions: actions };
  }

  // Expose state manager factory on DM4 namespace
  if (typeof createStateManager === "function") {
    DM4.state.createStateManager = createStateManager;
    // Optional compatibility alias
    DM4.createStateManager = createStateManager;
  } else {
    DM4.Logger.error("[STATE] createStateManager is not defined in dm4-state.js.");
  }
})(); 
