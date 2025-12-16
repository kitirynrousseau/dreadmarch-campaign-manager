/**
 * Integration tests for dm4-dataset-core.js
 * Testing Worker fallback, real-world scenarios, and edge cases
 */

describe('DM4 Dataset Core - Integration Tests', () => {
  let DM4;

  beforeAll(() => {
    // Setup DM4 global namespace
    global.window = global;
    global.DM4 = {
      config: { debug: false },
      dataset: {}
    };
    DM4 = global.DM4;

    // Load the Logger module first (required dependency)
    require('../core/dm4-logger.js');
    
    // Load the module - it executes immediately
    require('../core/dm4-dataset-core.js');
  });

  afterAll(() => {
    // Cleanup
    delete global.window;
    delete global.DM4;
  });

  beforeEach(() => {
    // Clear cache before each test
    DM4.dataset.clearCache();
  });

  describe('Worker Fallback', () => {
    test('should fall back to sync when Worker is unavailable', async () => {
      // Worker is not available in Jest/jsdom environment
      // This test verifies fallback behavior
      const rawDataset = {
        systems: {
          'sol': { name: 'Sol' }
        },
        system_pixels: {
          'sol': [100, 200]
        }
      };

      const result = await DM4.dataset.normalize(rawDataset, { async: true });
      
      expect(result).toBeDefined();
      expect(result.systems['sol'].coords).toEqual([100, 200]);
    });

    test('should cache results even with fallback', async () => {
      const rawDataset = {
        systems: { 'sol': { name: 'Sol' } },
        system_pixels: { 'sol': [100, 200] }
      };

      const result1 = await DM4.dataset.normalize(rawDataset, { async: true });
      const result2 = await DM4.dataset.normalize(rawDataset, { async: true });
      
      // Should use cache
      expect(result1).toBe(result2);
    });
  });

  describe('Real-World Scenarios', () => {
    test('should handle realistic campaign dataset with all properties', () => {
      const rawDataset = {
        systems: {
          'Darkknell': {
            name: 'Darkknell',
            description: 'Capital of the Grumani sector',
            faction: 'Sith Empire'
          },
          'Sanrafsix': {
            name: 'Sanrafsix',
            description: 'Strategic trade hub'
          },
          'Arbra': {
            name: 'Arbra',
            description: 'Hidden rebel base',
            faction: 'Rebel Alliance'
          }
        },
        system_pixels: {
          'Darkknell': [2752, 2414],
          'Sanrafsix': [3224, 2214],
          'Arbra': [4152, 2550]
        },
        system_grid: {
          'Darkknell': { col: 'M', row: 17, grid: 'M-17' },
          'Sanrafsix': { col: 'N', row: 17, grid: 'N-17' },
          'Arbra': { col: 'N', row: 17, grid: 'N-17' }
        },
        sectors: {
          'Grumani': ['Darkknell', 'Sanrafsix'],
          "Bon'nyuw-Luq": ['Arbra']
        },
        hyperlanes: {
          'Duros Space Run': [
            ['Darkknell', 'Sanrafsix'],
            ['Sanrafsix', 'Arbra']
          ]
        },
        route_metadata: {
          'Duros Space Run': { route_class: 'medium' }
        },
        dataset_metadata: {
          name: 'Campaign Dataset',
          version: '1.0',
          description: 'Test campaign map'
        }
      };

      const result = DM4.dataset.normalize(rawDataset);
      
      // Check system normalization
      expect(result.systems['Darkknell'].coords).toEqual([2752, 2414]);
      expect(result.systems['Darkknell'].grid).toEqual({ col: 'M', row: 17, grid: 'M-17' });
      expect(result.systems['Darkknell'].sector).toBe('Grumani');
      expect(result.systems['Darkknell'].faction).toBe('Sith Empire');
      
      expect(result.systems['Arbra'].sector).toBe("Bon'nyuw-Luq");
      
      // Check preserved metadata
      expect(result.hyperlanes).toBeDefined();
      expect(result.route_metadata).toBeDefined();
      expect(result.dataset_metadata.name).toBe('Campaign Dataset');
    });

    test('should handle partial data gracefully', () => {
      const rawDataset = {
        systems: {
          'system-1': { name: 'System 1' },
          'system-2': { name: 'System 2', coords: [100, 200] },
          'system-3': { name: 'System 3' }
        },
        system_pixels: {
          'system-1': [50, 100]
          // system-2 has inline coords
          // system-3 has no coords at all
        },
        system_grid: {
          'system-1': { row: 5, col: 10 }
          // system-2 and system-3 have no grid
        },
        sectors: {
          'sector-a': ['system-1']
          // system-2 and system-3 have no sector
        }
      };

      const result = DM4.dataset.normalize(rawDataset);
      
      // system-1: Has everything from lookup tables
      expect(result.systems['system-1'].coords).toEqual([50, 100]);
      expect(result.systems['system-1'].grid).toEqual({ row: 5, col: 10 });
      expect(result.systems['system-1'].sector).toBe('sector-a');
      
      // system-2: Has inline coords, no grid/sector
      expect(result.systems['system-2'].coords).toEqual([100, 200]);
      expect(result.systems['system-2'].grid).toBeUndefined();
      expect(result.systems['system-2'].sector).toBeUndefined();
      
      // system-3: Has nothing
      expect(result.systems['system-3'].coords).toBeUndefined();
      expect(result.systems['system-3'].grid).toBeUndefined();
      expect(result.systems['system-3'].sector).toBeUndefined();
    });

    test('should produce consistent results across multiple normalizations', () => {
      const rawDataset = {
        systems: {
          'sol': { name: 'Sol', value: Math.random() }  // Random value for uniqueness
        },
        system_pixels: {
          'sol': [100, 200]
        }
      };

      // Clear cache to ensure fresh normalization
      DM4.dataset.clearCache();
      
      const result1 = DM4.dataset.normalize(rawDataset);
      
      // Clear cache again
      DM4.dataset.clearCache();
      
      const result2 = DM4.dataset.normalize(rawDataset);
      
      // Results should be structurally identical (same coords, etc.)
      expect(result1.systems['sol'].coords).toEqual(result2.systems['sol'].coords);
      expect(result1.systems['sol'].name).toBe(result2.systems['sol'].name);
    });
  });

  describe('Sync/Async Consistency', () => {
    test('should produce identical results in sync and async modes', async () => {
      const rawDataset = {
        systems: {
          'sol': { name: 'Sol' },
          'alpha': { name: 'Alpha' },
          'beta': { name: 'Beta' }
        },
        system_pixels: {
          'sol': [100, 200],
          'alpha': [150, 250],
          'beta': [200, 300]
        },
        system_grid: {
          'sol': { row: 5, col: 10 },
          'alpha': { row: 6, col: 11 }
        },
        sectors: {
          'core': ['sol', 'alpha'],
          'outer': ['beta']
        }
      };

      // Clear cache to ensure fresh normalization
      DM4.dataset.clearCache();
      
      const syncResult = DM4.dataset.normalize(rawDataset);
      
      // Clear cache again
      DM4.dataset.clearCache();
      
      const asyncResult = await DM4.dataset.normalize(rawDataset, { async: true });
      
      // Compare results (excluding reference equality)
      expect(JSON.stringify(syncResult)).toBe(JSON.stringify(asyncResult));
      expect(syncResult.systems['sol'].coords).toEqual(asyncResult.systems['sol'].coords);
      expect(syncResult.systems['alpha'].sector).toBe(asyncResult.systems['alpha'].sector);
    });
  });

  describe('Edge Cases', () => {
    test('should handle empty systems with metadata', () => {
      const rawDataset = {
        systems: {},
        dataset_metadata: {
          name: 'Empty Dataset',
          version: '1.0'
        },
        custom_field: 'preserved'
      };

      const result = DM4.dataset.normalize(rawDataset);
      
      expect(result.systems).toEqual({});
      expect(result.dataset_metadata.name).toBe('Empty Dataset');
      expect(result.custom_field).toBe('preserved');
    });

    test('should handle very large sector definitions (500 systems)', () => {
      const rawDataset = {
        systems: {},
        system_pixels: {},
        sectors: {
          'mega-sector': []
        }
      };

      // Create 500 systems all in one sector
      for (let i = 0; i < 500; i++) {
        const id = 'system-' + i;
        rawDataset.systems[id] = { name: 'System ' + i };
        rawDataset.system_pixels[id] = [i, i];
        rawDataset.sectors['mega-sector'].push(id);
      }

      const result = DM4.dataset.normalize(rawDataset);
      
      expect(Object.keys(result.systems).length).toBe(500);
      
      // Check all systems have the sector assigned
      Object.keys(result.systems).forEach(function(id) {
        expect(result.systems[id].sector).toBe('mega-sector');
      });
    });

    test('should protect against circular references in systems', () => {
      const system1 = { name: 'System 1' };
      const system2 = { name: 'System 2' };
      
      // Create circular reference (though Object.assign should handle this)
      system1.neighbor = system2;
      system2.neighbor = system1;
      
      const rawDataset = {
        systems: {
          's1': system1,
          's2': system2
        },
        system_pixels: {
          's1': [100, 200],
          's2': [150, 250]
        }
      };

      // This should not throw or hang
      const result = DM4.dataset.normalize(rawDataset);
      
      expect(result.systems['s1']).toBeDefined();
      expect(result.systems['s2']).toBeDefined();
      expect(result.systems['s1'].coords).toEqual([100, 200]);
      expect(result.systems['s2'].coords).toEqual([150, 250]);
    });
  });

  describe('Cache Key Generation', () => {
    test('should use fingerprint for large datasets (100+ systems)', () => {
      const smallDataset = {
        systems: {},
        system_pixels: {}
      };

      const largeDataset = {
        systems: {},
        system_pixels: {}
      };

      // Create 50 systems (small)
      for (let i = 0; i < 50; i++) {
        const id = 'system-' + i;
        smallDataset.systems[id] = { name: 'System ' + i };
        smallDataset.system_pixels[id] = [i, i];
      }

      // Create 150 systems (large)
      for (let i = 0; i < 150; i++) {
        const id = 'system-' + i;
        largeDataset.systems[id] = { name: 'System ' + i };
        largeDataset.system_pixels[id] = [i, i];
      }

      // Both should normalize and cache successfully
      const smallResult = DM4.dataset.normalize(smallDataset);
      const largeResult = DM4.dataset.normalize(largeDataset);

      expect(Object.keys(smallResult.systems).length).toBe(50);
      expect(Object.keys(largeResult.systems).length).toBe(150);

      const stats = DM4.dataset.getCacheStats();
      expect(stats.size).toBe(2);
    });

    test('should handle datasets with endpoint_pixels instead of system_pixels', () => {
      const rawDataset = {
        systems: {
          'sol': { name: 'Sol' }
        },
        endpoint_pixels: {
          'sol': [100, 200]
        }
      };

      const result = DM4.dataset.normalize(rawDataset);
      
      expect(result.systems['sol'].coords).toEqual([100, 200]);
      
      // Should be cached
      const result2 = DM4.dataset.normalize(rawDataset);
      expect(result).toBe(result2);
    });
  });
});
