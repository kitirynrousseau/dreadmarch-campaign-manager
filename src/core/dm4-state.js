;(function () {
  /**
   * DM4 STATE MANAGER MODULE
   * 
   * This module provides centralized state management for the Dreadmarch Campaign Manager.
   * It implements a subscription-based pattern where components can subscribe to state changes
   * and receive notifications when relevant parts of the state are updated.
   * 
   * Key features:
   * - Immutable state updates (creates new state objects rather than mutating)
   * - Scoped subscriptions (components can subscribe to specific parts of state)
   * - Batch notifications (multiple state changes are batched to reduce update frequency)
   * - Action-based mutations (all state changes go through predefined actions)
   * 
   * State structure:
   * - config: Application configuration
   * - dataset: Galactic system data (systems, routes, sectors, etc.)
   * - campaign: Campaign-specific data (factions, actors, budgets, etc.)
   * - access: User access control and permissions
   * - selection: Currently selected system
   * - mode: Current application mode (navcom or strategic)
   * - editor: Editor state (enabled flag and pending jobs)
   */
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
  
  /**
   * DM4_HELPER_FUNCTION: isKnownMode
   * 
   * Validates whether a given mode string is a recognized application mode.
   * 
   * @param {string} mode - The mode to validate
   * @returns {boolean} True if the mode is recognized, false otherwise
   */
  const DM4_MODES = ["navcom", "strategic"];
  
  function isKnownMode(mode) {
    return DM4_MODES.includes(mode);
  }

  /**
   * DM4_CORE_FUNCTION: createStateManager
   * 
   * Factory function that creates a state manager instance. This is the primary entry point
   * for initializing state management in the application.
   * 
   * The state manager maintains application state and notifies subscribers when state changes.
   * All state modifications are immutable - new state objects are created rather than mutating
   * existing state. This ensures predictable behavior and makes debugging easier.
   * 
   * @param {Object} config - Application configuration object
   * @param {Object} dataset - Initial dataset containing systems, routes, sectors, etc.
   * @param {Object} campaign - Initial campaign data (factions, actors, budgets, etc.)
   * @returns {Object} State manager API with getState, subscribe, and actions
   */
  function createStateManager(config, dataset, campaign) {
    // Array of subscriber objects, each containing a callback function and scope path
    let subscribers = [];

    // Central state object - all application state lives here
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
        jobs: [],
        mode: null,
        pendingData: null,
        selectedRoute: null
      }
    };

    /**
     * DM4_HELPER_FUNCTION: getState
     * 
     * Returns the current state snapshot. This is a reference to the actual state object,
     * so subscribers should not mutate it directly. Use actions to modify state.
     * 
     * @returns {Object} Current state object
     */
    function getState() {
      return state;
    }

    /**
     * DM4_HELPER_FUNCTION: scopeApplies
     * 
     * Determines whether a subscriber should be notified based on scope matching.
     * This implements the scoped subscription logic that allows components to
     * subscribe to specific parts of the state tree.
     * 
     * Scoping rules:
     * - Empty subscribedScope [] means "subscribe to all changes"
     * - Otherwise, changedScope must start with subscribedScope
     *   Example: subscribedScope ['selection'] matches changedScope ['selection']
     *   Example: subscribedScope ['editor'] matches changedScope ['editor', 'jobs']
     * 
     * @param {Array<string>} subscribedScope - The scope path the subscriber registered for
     * @param {Array<string>} changedScope - The scope path that was modified
     * @returns {boolean} True if the subscriber should be notified
     */
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

    /**
     * DM4_HELPER_FUNCTION: notifySubscribers
     * 
     * Notifies all subscribers whose scope matches the changed scope path.
     * This is the immediate notification mechanism (contrast with batchNotify).
     * 
     * Each matching subscriber receives a snapshot of the current state.
     * Note: In practice, batchNotify is used instead to aggregate multiple changes.
     * 
     * @param {Array<string>} changedScopePath - Path indicating what part of state changed
     */
    function notifySubscribers(changedScopePath) {
      changedScopePath = changedScopePath || [];
      const snapshot = state;
      subscribers.forEach(function (subscriber) {
        if (scopeApplies(subscriber.scopePath, changedScopePath)) {
          subscriber.fn(snapshot);
        }
      });
    }

    /**
     * BATCHING MECHANISM FOR NOTIFICATIONS
     * 
     * To improve performance, state changes are batched rather than immediately notifying
     * subscribers. When multiple actions occur in quick succession (e.g., during initialization
     * or rapid user interactions), we collect all the scope changes and notify subscribers
     * once after a short delay (10ms).
     * 
     * This prevents redundant updates and improves UI responsiveness.
     */
    let batchedChanges = new Set();  // Set of scope keys that have changed
    let notifyTimeout = null;         // Timer handle for the batch notification

    /**
     * DM4_HELPER_FUNCTION: batchNotify
     * 
     * Queues a scope change for batched notification. Multiple calls within 10ms will be
     * aggregated into a single notification cycle.
     * 
     * This is the preferred way to trigger notifications from actions. It ensures that:
     * 1. Multiple rapid changes don't cause redundant subscriber calls
     * 2. Subscribers are called at most once per batch with the latest state
     * 3. UI updates are smoother and more efficient
     * 
     * Implementation notes:
     * - Uses a Set to deduplicate scope paths
     * - Converts scope arrays to dot-separated strings for Set storage
     * - Uses '__root__' as a marker for empty scope (all changes)
     * 
     * @param {Array<string>} changeScope - Path indicating what part of state changed
     */
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

    /**
     * DM4_HELPER_FUNCTION: subscribe
     * 
     * Registers a callback function to be notified when state changes.
     * 
     * Scoped subscriptions:
     * - Pass an empty array [] or omit scopePath to receive all state changes
     * - Pass a scope path like ['selection'] to only receive changes to that part of state
     * - Pass a nested path like ['editor', 'jobs'] for even more targeted updates
     * 
     * The callback receives the entire state object on each notification, but is only
     * called when the specified scope (or a child scope) changes.
     * 
     * Immediate notification:
     * When you subscribe, your callback is immediately invoked with the current state.
     * This ensures components can initialize their display without waiting for changes.
     * 
     * Unsubscribing:
     * The function returns an unsubscribe function. Call it to stop receiving notifications:
     *   const unsubscribe = subscribe(myCallback, ['selection']);
     *   // Later...
     *   unsubscribe();
     * 
     * @param {Function} fn - Callback function to invoke on state changes. Receives state as parameter.
     * @param {Array<string>} scopePath - Optional scope path to filter notifications
     * @returns {Function} Unsubscribe function
     */
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

    /**
     * STATE ACTIONS
     * 
     * Actions are the only way to modify state. Each action:
     * 1. Creates a new state object (immutability)
     * 2. Updates the relevant part of state
     * 3. Calls batchNotify with the appropriate scope path
     * 
     * This pattern ensures:
     * - All state changes are trackable and predictable
     * - Components are notified only when relevant data changes
     * - Debugging is easier (you can trace all state changes through actions)
     */
    const actions = {
      /**
       * selectSystem - Updates the currently selected system
       * 
       * When a user clicks on a system marker or selects a system through search,
       * this action updates the selection state. Components subscribed to ['selection']
       * will be notified and can update their display.
       * 
       * @param {string} systemId - ID of the system to select (or null to deselect)
       */
      selectSystem: function (systemId) {
        state = Object.assign({}, state, {
          selection: Object.assign({}, state.selection, {
            system: systemId
          })
        });
        batchNotify(['selection']);
      },

      /**
       * setMode - Changes the application mode
       * 
       * Modes control which UI panels are active and how the map is displayed.
       * Valid modes: 'navcom' (navigation/command view) and 'strategic' (strategic overview)
       * 
       * @param {string} mode - Mode to switch to ('navcom' or 'strategic')
       */
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

      /**
       * setDataset - Replaces the entire dataset
       * 
       * Called when switching between datasets or loading a new dataset.
       * The dataset contains all galactic system data (coordinates, sectors, routes, etc.)
       * 
       * @param {Object} newDataset - New dataset object (must include systems property)
       */
      setDataset: function (newDataset) {
        state = Object.assign({}, state, {
          dataset: newDataset || { systems: {} }
        });
        batchNotify(['dataset']);
      },

      /**
       * setCampaign - Replaces campaign data
       * 
       * Campaign data includes factions, actors, budgets, and asset requests.
       * This is typically called when loading a saved campaign or starting a new one.
       * 
       * @param {Object} newCampaign - New campaign object
       */
      setCampaign: function (newCampaign) {
        state = Object.assign({}, state, {
          campaign: newCampaign || state.campaign
        });
        batchNotify(['campaign']);
      },

      /**
       * setAccess - Updates user access control settings
       * 
       * Access control determines what the current user can see and do.
       * This is a partial update - only specified properties are changed.
       * 
       * Access properties:
       * - tier: User's access level ('viewer', 'player', 'gm')
       * - playerId: ID of the player if tier is 'player'
       * - factions: Array of faction IDs the user has access to
       * - capabilities: Object with permission flags (canEditOwnActors, etc.)
       * 
       * @param {Object} partial - Partial access object with properties to update
       */
      setAccess: function (partial) {
        state = Object.assign({}, state, {
          access: Object.assign({}, state.access, partial)
        });
        batchNotify(['access']);
      },

      /**
       * setEditorEnabled - Toggles editor mode on/off
       * 
       * When editor mode is enabled, users can modify system data and create edit jobs.
       * Editor panel activates automatically when clicking systems in editor mode.
       * 
       * @param {boolean} enabled - True to enable editor, false to disable
       */
      setEditorEnabled: function (enabled) {
        const current = state.editor || { enabled: false, jobs: [] };
        state = Object.assign({}, state, {
          editor: Object.assign({}, current, { enabled: !!enabled })
        });
        batchNotify(['editor']);
      },

      /**
       * addEditorJob - Adds a pending edit job to the queue
       * 
       * Editor jobs represent pending changes to the dataset. Jobs are accumulated
       * and can be applied as a batch or exported for review.
       * 
       * @param {Object} job - Edit job object describing the change to make
       */
      addEditorJob: function (job) {
        const current = state.editor || { enabled: false, jobs: [] };
        const jobs = (current.jobs || []).concat(job || {});
        state = Object.assign({}, state, {
          editor: Object.assign({}, current, { jobs: jobs })
        });
        batchNotify(['editor']);
      },

      /**
       * clearEditorJobs - Removes all pending edit jobs
       * 
       * Called after jobs are applied or when the user cancels pending edits.
       */
      clearEditorJobs: function () {
        const current = state.editor || { enabled: false, jobs: [] };
        state = Object.assign({}, state, {
          editor: Object.assign({}, current, { jobs: [] })
        });
        batchNotify(['editor']);
      },

      /**
       * setEditorMode - Sets the current editor interaction mode
       * 
       * Editor modes control how map interactions behave (e.g., clicking to add systems,
       * moving systems, adding route segments). When a mode is active, map clicks
       * are intercepted to perform the mode-specific action.
       * 
       * Valid modes: 'add_system', 'move_system', 'add_segment', null
       * 
       * @param {string|null} mode - The editor mode to activate, or null to clear
       * @param {Object} data - Optional data associated with the mode (e.g., selected route for add_segment)
       */
      setEditorMode: function (mode, data) {
        const current = state.editor || { enabled: false, jobs: [], mode: null, pendingData: null };
        state = Object.assign({}, state, {
          editor: Object.assign({}, current, { mode: mode, pendingData: data || null })
        });
        batchNotify(['editor']);
      },

      /**
       * clearEditorMode - Clears the current editor interaction mode
       * 
       * Resets editor mode back to null and clears any pending mode data.
       */
      clearEditorMode: function () {
        const current = state.editor || { enabled: false, jobs: [], mode: null, pendingData: null };
        state = Object.assign({}, state, {
          editor: Object.assign({}, current, { mode: null, pendingData: null })
        });
        batchNotify(['editor']);
      },

      /**
       * setSelectedRoute - Sets the currently selected route in the editor
       * 
       * Used by the routes tab to preserve route selection across re-renders.
       * 
       * @param {string|null} routeName - Name of the route to select, or null to deselect
       */
      setSelectedRoute: function (routeName) {
        const current = state.editor || { enabled: false, jobs: [], mode: null, pendingData: null, selectedRoute: null };
        state = Object.assign({}, state, {
          editor: Object.assign({}, current, { selectedRoute: routeName })
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
