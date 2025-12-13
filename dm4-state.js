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

    // DM4_HELPER_FUNCTION: notifySubscribers

    function notifySubscribers() {
      const snapshot = state;
      subscribers.forEach(function (fn) {
        fn(snapshot);
      });
    }

    // DM4_HELPER_FUNCTION: subscribe

    function subscribe(fn) {
      subscribers.push(fn);
      fn(state);
      return function () {
        subscribers = subscribers.filter(function (s) {
          return s !== fn;
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
        notifySubscribers();
      },

      setMode: function (mode) {
        if (!isKnownMode(mode)) {
          if (DM4_DEBUG) {
            DM4.Logger.warn("[STATE] Attempt to set unknown mode:", mode);
          }
          return;
        }
        state = Object.assign({}, state, { mode: mode });
        notifySubscribers();
      },

      setDataset: function (newDataset) {
        state = Object.assign({}, state, {
          dataset: newDataset || { systems: {} }
        });
        notifySubscribers();
      },

      setCampaign: function (newCampaign) {
        state = Object.assign({}, state, {
          campaign: newCampaign || state.campaign
        });
        notifySubscribers();
      },

      setAccess: function (partial) {
        state = Object.assign({}, state, {
          access: Object.assign({}, state.access, partial)
        });
        notifySubscribers();
      },

      setEditorEnabled: function (enabled) {
        const current = state.editor || { enabled: false, jobs: [] };
        state = Object.assign({}, state, {
          editor: Object.assign({}, current, { enabled: !!enabled })
        });
        notifySubscribers();
      },

      addEditorJob: function (job) {
        const current = state.editor || { enabled: false, jobs: [] };
        const jobs = (current.jobs || []).concat(job || {});
        state = Object.assign({}, state, {
          editor: Object.assign({}, current, { jobs: jobs })
        });
        notifySubscribers();
      },

      clearEditorJobs: function () {
        const current = state.editor || { enabled: false, jobs: [] };
        state = Object.assign({}, state, {
          editor: Object.assign({}, current, { jobs: [] })
        });
        notifySubscribers();
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
