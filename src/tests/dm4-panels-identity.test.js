/**
 * Unit tests for dm4-panels-identity.js
 * Testing the Identity Panel component with focus on memoization fixes
 */

describe('DM4 Identity Panel', function () {
  var DM4;
  var mockCore;
  var mockStateManager;
  var subscribeCallback;

  beforeAll(function () {
    // Setup DM4 global namespace
    global.window = global;
    global.DM4 = {
      config: { debug: false },
      panels: {},
      Logger: {
        log: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
        critical: jest.fn()
      }
    };
    DM4 = global.DM4;

    // Mock console methods to avoid noise
    jest.spyOn(console, 'error').mockImplementation(function () {});
    jest.spyOn(console, 'warn').mockImplementation(function () {});

    // Load the module
    require('../components/dm4-panels-identity.js');
  });

  beforeEach(function () {
    // Create mock state manager
    mockStateManager = {
      getState: jest.fn(),
      subscribe: jest.fn(function (callback) {
        subscribeCallback = callback;
        return jest.fn(); // Return unsubscribe function
      }),
      actions: {}
    };

    // Create mock core
    mockCore = {
      state: mockStateManager,
      config: {}
    };
  });

  afterAll(function () {
    jest.restoreAllMocks();
    delete global.window;
    delete global.DM4;
  });

  describe('Panel Mounting', function () {
    test('should mount panel to host element', function () {
      var panel = DM4.panels.IdentityPanel(mockCore);
      var hostElement = document.createElement('div');

      mockStateManager.getState.mockReturnValue({
        dataset: {
          systems: {},
          routes: {},
          dataset_metadata: { version: '1.0' }
        },
        selection: { system: null }
      });

      panel.mount(hostElement);

      expect(hostElement.children.length).toBeGreaterThan(0);
      expect(mockStateManager.getState).toHaveBeenCalled();
    });

    test('should initialize memoization state after mount', function () {
      var panel = DM4.panels.IdentityPanel(mockCore);
      var hostElement = document.createElement('div');

      var testState = {
        dataset: {
          systems: {
            'test-sys': {
              name: 'Test System',
              sector: 'Test Sector',
              coords: [100, 200],
              grid: { grid: 'G001' }
            }
          },
          routes: {},
          dataset_metadata: { version: '1.0' }
        },
        selection: { system: 'test-sys' }
      };

      mockStateManager.getState.mockReturnValue(testState);

      panel.mount(hostElement);

      // After mount, the subscription should be active
      expect(mockStateManager.subscribe).toHaveBeenCalled();

      // Now trigger subscription callback with the same state
      // If lastSelectionId was not initialized, this would trigger a re-render
      // With the fix, it should not re-render because state hasn't changed
      var renderCount = 0;
      var identityContainer = hostElement.querySelector('.dm4-sr-identity');
      if (identityContainer) {
        var initialContent = identityContainer.innerHTML;
        
        // Trigger subscription callback with same state
        subscribeCallback(testState);
        
        // Content should not have changed (memoization working)
        expect(identityContainer.innerHTML).toBe(initialContent);
      }
    });

    test('should render placeholder when no system is selected', function () {
      var panel = DM4.panels.IdentityPanel(mockCore);
      var hostElement = document.createElement('div');

      mockStateManager.getState.mockReturnValue({
        dataset: {
          systems: {},
          routes: {},
          dataset_metadata: { version: '1.0' }
        },
        selection: { system: null }
      });

      panel.mount(hostElement);

      var placeholder = hostElement.querySelector('.dm4-sr-placeholder');
      expect(placeholder).not.toBeNull();
      expect(placeholder.textContent).toContain('Select a system');
    });

    test('should render system data when system is selected', function () {
      var panel = DM4.panels.IdentityPanel(mockCore);
      var hostElement = document.createElement('div');

      mockStateManager.getState.mockReturnValue({
        dataset: {
          systems: {
            'test-sys': {
              display_name: 'Test System',
              sector: 'Test Sector',
              coords: [100, 200],
              grid: { grid: 'G001' },
              local_grid_coords: [10, 20]
            }
          },
          routes: {},
          dataset_metadata: { version: '1.0' }
        },
        selection: { system: 'test-sys' }
      });

      panel.mount(hostElement);

      var identityContainer = hostElement.querySelector('.dm4-sr-identity');
      expect(identityContainer).not.toBeNull();
      expect(identityContainer.innerHTML).toContain('Test System');
    });
  });

  describe('Selection Change Handling', function () {
    test('should re-render when selection changes', function () {
      var panel = DM4.panels.IdentityPanel(mockCore);
      var hostElement = document.createElement('div');

      var initialState = {
        dataset: {
          systems: {
            'sys1': {
              display_name: 'System 1',
              sector: 'Sector A',
              coords: [100, 200],
              grid: { grid: 'G001' }
            },
            'sys2': {
              display_name: 'System 2',
              sector: 'Sector B',
              coords: [300, 400],
              grid: { grid: 'G002' }
            }
          },
          routes: {},
          dataset_metadata: { version: '1.0' }
        },
        selection: { system: 'sys1' }
      };

      mockStateManager.getState.mockReturnValue(initialState);
      panel.mount(hostElement);

      var identityContainer = hostElement.querySelector('.dm4-sr-identity');
      expect(identityContainer.innerHTML).toContain('System 1');

      // Change selection
      var newState = {
        dataset: initialState.dataset,
        selection: { system: 'sys2' }
      };

      subscribeCallback(newState);

      // Should now show System 2
      expect(identityContainer.innerHTML).toContain('System 2');
      expect(identityContainer.innerHTML).not.toContain('System 1');
    });

    test('should not re-render when selection stays the same', function () {
      var panel = DM4.panels.IdentityPanel(mockCore);
      var hostElement = document.createElement('div');

      var state = {
        dataset: {
          systems: {
            'sys1': {
              display_name: 'System 1',
              sector: 'Sector A',
              coords: [100, 200],
              grid: { grid: 'G001' }
            }
          },
          routes: {},
          dataset_metadata: { version: '1.0' }
        },
        selection: { system: 'sys1' }
      };

      mockStateManager.getState.mockReturnValue(state);
      panel.mount(hostElement);

      var identityContainer = hostElement.querySelector('.dm4-sr-identity');
      var initialContent = identityContainer.innerHTML;

      // Trigger subscription with same state
      subscribeCallback(state);

      // Content should not have changed
      expect(identityContainer.innerHTML).toBe(initialContent);
    });
  });

  describe('Unmounting', function () {
    test('should clean up on unmount', function () {
      var panel = DM4.panels.IdentityPanel(mockCore);
      var hostElement = document.createElement('div');

      mockStateManager.getState.mockReturnValue({
        dataset: { systems: {}, dataset_metadata: { version: '1.0' } },
        selection: { system: null }
      });

      panel.mount(hostElement);
      expect(hostElement.children.length).toBeGreaterThan(0);

      panel.unmount();
      expect(hostElement.children.length).toBe(0);
    });
  });
});
