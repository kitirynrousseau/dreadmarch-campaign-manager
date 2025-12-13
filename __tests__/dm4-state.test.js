/**
 * Unit tests for dm4-state.js
 * Testing the state manager behavior
 */

describe('DM4 State Manager', () => {
  let DM4;

  beforeAll(() => {
    // Setup DM4 global namespace with config
    global.window = global;
    global.DM4 = {
      config: { debug: false },
      state: {}
    };
    DM4 = global.DM4;

    // Mock console.error to avoid noise in tests
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});

    // We need to define isKnownMode in global scope for dm4-state.js
    // since it's referenced but not defined in that module
    global.isKnownMode = (mode) => {
      const knownModes = ['navcom', 'tactical', 'strategic', 'editor'];
      return knownModes.includes(mode);
    };

    // Load the module - it executes immediately
    require('../dm4-state.js');
  });

  afterAll(() => {
    // Cleanup
    jest.restoreAllMocks();
    delete global.window;
    delete global.DM4;
    delete global.isKnownMode;
  });

  describe('State Manager Creation', () => {
    test('should create state manager with default values', () => {
      const stateManager = DM4.state.createStateManager();

      expect(stateManager).toBeDefined();
      expect(stateManager.getState).toBeDefined();
      expect(stateManager.subscribe).toBeDefined();
      expect(stateManager.actions).toBeDefined();
    });

    test('should initialize state with provided config', () => {
      const config = { debug: true, mode: 'test' };
      const stateManager = DM4.state.createStateManager(config);
      const state = stateManager.getState();

      expect(state.config).toEqual(config);
    });

    test('should initialize state with provided dataset', () => {
      const dataset = {
        systems: {
          'sol': { name: 'Sol System' }
        }
      };
      const stateManager = DM4.state.createStateManager(null, dataset);
      const state = stateManager.getState();

      expect(state.dataset).toEqual(dataset);
    });

    test('should initialize state with provided campaign', () => {
      const campaign = {
        factions: ['faction-a', 'faction-b'],
        systemControl: [],
        actors: [],
        assetRequests: [],
        budgets: { players: {} },
        actorTypes: [],
        assetCatalog: []
      };
      const stateManager = DM4.state.createStateManager(null, null, campaign);
      const state = stateManager.getState();

      expect(state.campaign).toEqual(campaign);
    });

    test('should have default state structure', () => {
      const stateManager = DM4.state.createStateManager();
      const state = stateManager.getState();

      expect(state).toMatchObject({
        config: {},
        dataset: { systems: {} },
        campaign: expect.objectContaining({
          factions: [],
          systemControl: [],
          actors: []
        }),
        access: expect.objectContaining({
          tier: 'viewer',
          playerId: null,
          factions: []
        }),
        selection: { system: null },
        mode: 'navcom',
        editor: expect.objectContaining({
          enabled: false,
          jobs: []
        })
      });
    });
  });

  describe('Subscribe and Notify', () => {
    test('should call subscriber immediately on subscribe', () => {
      const stateManager = DM4.state.createStateManager();
      const mockSubscriber = jest.fn();

      stateManager.subscribe(mockSubscriber);

      expect(mockSubscriber).toHaveBeenCalledTimes(1);
      expect(mockSubscriber).toHaveBeenCalledWith(stateManager.getState());
    });

    test('should notify subscribers when state changes', (done) => {
      const stateManager = DM4.state.createStateManager();
      const mockSubscriber = jest.fn();

      stateManager.subscribe(mockSubscriber);
      mockSubscriber.mockClear(); // Clear the initial call

      stateManager.actions.selectSystem('sol');

      // Wait for batched notification (10ms delay)
      setTimeout(() => {
        expect(mockSubscriber).toHaveBeenCalledTimes(1);
        expect(mockSubscriber.mock.calls[0][0].selection.system).toBe('sol');
        done();
      }, 20);
    });

    test('should notify multiple subscribers', (done) => {
      const stateManager = DM4.state.createStateManager();
      const subscriber1 = jest.fn();
      const subscriber2 = jest.fn();

      stateManager.subscribe(subscriber1);
      stateManager.subscribe(subscriber2);
      subscriber1.mockClear();
      subscriber2.mockClear();

      stateManager.actions.selectSystem('alpha');

      // Wait for batched notification (10ms delay)
      setTimeout(() => {
        expect(subscriber1).toHaveBeenCalledTimes(1);
        expect(subscriber2).toHaveBeenCalledTimes(1);
        done();
      }, 20);
    });

    test('should unsubscribe correctly', () => {
      const stateManager = DM4.state.createStateManager();
      const mockSubscriber = jest.fn();

      const unsubscribe = stateManager.subscribe(mockSubscriber);
      mockSubscriber.mockClear();

      unsubscribe();
      stateManager.actions.selectSystem('sol');

      expect(mockSubscriber).not.toHaveBeenCalled();
    });

    test('should handle multiple unsubscribes without error', (done) => {
      const stateManager = DM4.state.createStateManager();
      const subscriber1 = jest.fn();
      const subscriber2 = jest.fn();

      const unsubscribe1 = stateManager.subscribe(subscriber1);
      const unsubscribe2 = stateManager.subscribe(subscriber2);
      
      subscriber1.mockClear();
      subscriber2.mockClear();

      unsubscribe1();
      stateManager.actions.selectSystem('sol');

      // Wait for batched notification (10ms delay)
      setTimeout(() => {
        expect(subscriber1).not.toHaveBeenCalled();
        expect(subscriber2).toHaveBeenCalledTimes(1);
        done();
      }, 20);
    });
  });

  describe('Actions - selectSystem', () => {
    test('should update selected system', () => {
      const stateManager = DM4.state.createStateManager();

      stateManager.actions.selectSystem('sol');

      const state = stateManager.getState();
      expect(state.selection.system).toBe('sol');
    });

    test('should notify subscribers when system is selected', (done) => {
      const stateManager = DM4.state.createStateManager();
      const mockSubscriber = jest.fn();

      stateManager.subscribe(mockSubscriber);
      mockSubscriber.mockClear();

      stateManager.actions.selectSystem('alpha-centauri');

      // Wait for batched notification (10ms delay)
      setTimeout(() => {
        expect(mockSubscriber).toHaveBeenCalledTimes(1);
        expect(mockSubscriber.mock.calls[0][0].selection.system).toBe('alpha-centauri');
        done();
      }, 20);
    });

    test('should handle null system selection', () => {
      const stateManager = DM4.state.createStateManager();

      stateManager.actions.selectSystem('sol');
      stateManager.actions.selectSystem(null);

      const state = stateManager.getState();
      expect(state.selection.system).toBeNull();
    });
  });

  describe('Actions - setMode', () => {
    test('should update mode when valid', () => {
      const stateManager = DM4.state.createStateManager();

      stateManager.actions.setMode('strategic');

      const state = stateManager.getState();
      expect(state.mode).toBe('strategic');
    });

    test('should not update mode when invalid', () => {
      const stateManager = DM4.state.createStateManager();
      const initialState = stateManager.getState();

      stateManager.actions.setMode('invalid-mode');

      const state = stateManager.getState();
      expect(state.mode).toBe(initialState.mode);
    });

    test('should notify subscribers when mode changes', (done) => {
      const stateManager = DM4.state.createStateManager();
      const mockSubscriber = jest.fn();

      stateManager.subscribe(mockSubscriber);
      mockSubscriber.mockClear();

      stateManager.actions.setMode('strategic');

      // Wait for batched notification (10ms delay)
      setTimeout(() => {
        expect(mockSubscriber).toHaveBeenCalledTimes(1);
        expect(mockSubscriber.mock.calls[0][0].mode).toBe('strategic');
        done();
      }, 20);
    });
  });

  describe('Actions - setDataset', () => {
    test('should update dataset', () => {
      const stateManager = DM4.state.createStateManager();
      const newDataset = {
        systems: {
          'sol': { name: 'Sol' },
          'alpha': { name: 'Alpha Centauri' }
        }
      };

      stateManager.actions.setDataset(newDataset);

      const state = stateManager.getState();
      expect(state.dataset).toEqual(newDataset);
    });

    test('should use default dataset when null is provided', () => {
      const stateManager = DM4.state.createStateManager();

      stateManager.actions.setDataset(null);

      const state = stateManager.getState();
      expect(state.dataset).toEqual({ systems: {} });
    });
  });

  describe('Actions - setCampaign', () => {
    test('should update campaign', () => {
      const stateManager = DM4.state.createStateManager();
      const newCampaign = {
        factions: ['faction-a'],
        systemControl: [{ system: 'sol', faction: 'faction-a' }],
        actors: [],
        assetRequests: [],
        budgets: { players: {} },
        actorTypes: [],
        assetCatalog: []
      };

      stateManager.actions.setCampaign(newCampaign);

      const state = stateManager.getState();
      expect(state.campaign).toEqual(newCampaign);
    });

    test('should preserve existing campaign when null is provided', () => {
      const stateManager = DM4.state.createStateManager();
      const initialCampaign = stateManager.getState().campaign;

      stateManager.actions.setCampaign(null);

      const state = stateManager.getState();
      expect(state.campaign).toEqual(initialCampaign);
    });
  });

  describe('Actions - setAccess', () => {
    test('should partially update access properties', () => {
      const stateManager = DM4.state.createStateManager();

      stateManager.actions.setAccess({
        tier: 'player',
        playerId: 'player-123'
      });

      const state = stateManager.getState();
      expect(state.access.tier).toBe('player');
      expect(state.access.playerId).toBe('player-123');
      expect(state.access.factions).toEqual([]); // Should preserve other properties
    });

    test('should update capabilities within access', () => {
      const stateManager = DM4.state.createStateManager();

      stateManager.actions.setAccess({
        capabilities: {
          canEditOwnActors: true,
          canEditFactionActors: false,
          canEditSystemControl: false,
          canSeeGmOnly: false
        }
      });

      const state = stateManager.getState();
      expect(state.access.capabilities.canEditOwnActors).toBe(true);
    });
  });

  describe('Actions - Editor State', () => {
    test('should enable editor', () => {
      const stateManager = DM4.state.createStateManager();

      stateManager.actions.setEditorEnabled(true);

      const state = stateManager.getState();
      expect(state.editor.enabled).toBe(true);
    });

    test('should disable editor', () => {
      const stateManager = DM4.state.createStateManager();

      stateManager.actions.setEditorEnabled(true);
      stateManager.actions.setEditorEnabled(false);

      const state = stateManager.getState();
      expect(state.editor.enabled).toBe(false);
    });

    test('should add editor job', () => {
      const stateManager = DM4.state.createStateManager();
      const job = { type: 'create-system', data: { name: 'New System' } };

      stateManager.actions.addEditorJob(job);

      const state = stateManager.getState();
      expect(state.editor.jobs).toHaveLength(1);
      expect(state.editor.jobs[0]).toEqual(job);
    });

    test('should add multiple editor jobs', () => {
      const stateManager = DM4.state.createStateManager();
      const job1 = { type: 'create-system', data: { name: 'System 1' } };
      const job2 = { type: 'create-system', data: { name: 'System 2' } };

      stateManager.actions.addEditorJob(job1);
      stateManager.actions.addEditorJob(job2);

      const state = stateManager.getState();
      expect(state.editor.jobs).toHaveLength(2);
      expect(state.editor.jobs[0]).toEqual(job1);
      expect(state.editor.jobs[1]).toEqual(job2);
    });

    test('should clear editor jobs', () => {
      const stateManager = DM4.state.createStateManager();
      const job = { type: 'create-system', data: { name: 'New System' } };

      stateManager.actions.addEditorJob(job);
      stateManager.actions.clearEditorJobs();

      const state = stateManager.getState();
      expect(state.editor.jobs).toEqual([]);
    });

    test('should preserve editor enabled state when clearing jobs', () => {
      const stateManager = DM4.state.createStateManager();

      stateManager.actions.setEditorEnabled(true);
      stateManager.actions.addEditorJob({ type: 'test' });
      stateManager.actions.clearEditorJobs();

      const state = stateManager.getState();
      expect(state.editor.enabled).toBe(true);
      expect(state.editor.jobs).toEqual([]);
    });
  });

  describe('State Immutability', () => {
    test('should not mutate original state object on updates', () => {
      const stateManager = DM4.state.createStateManager();
      const originalState = stateManager.getState();
      const originalMode = originalState.mode;

      stateManager.actions.setMode('strategic');

      expect(originalMode).toBe('navcom');
      expect(stateManager.getState().mode).toBe('strategic');
    });

    test('should create new state references on updates', () => {
      const stateManager = DM4.state.createStateManager();
      const state1 = stateManager.getState();

      stateManager.actions.selectSystem('sol');
      const state2 = stateManager.getState();

      expect(state1).not.toBe(state2);
      expect(state1.selection.system).toBeNull();
      expect(state2.selection.system).toBe('sol');
    });
  });
});
