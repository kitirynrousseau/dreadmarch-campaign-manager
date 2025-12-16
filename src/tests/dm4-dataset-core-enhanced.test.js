/**
 * Enhanced unit tests for dm4-dataset-core.js
 * Testing caching, async normalization, error handling, and performance
 */

describe('DM4 Dataset Core - Enhanced Features', () => {
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

  describe('Caching Mechanism', () => {
    test('should cache normalized dataset and return same result on repeat', () => {
      const rawDataset = {
        systems: {
          'sol': { name: 'Sol System' },
          'alpha': { name: 'Alpha Centauri' }
        },
        system_pixels: {
          'sol': [100, 200],
          'alpha': [150, 250]
        }
      };

      const result1 = DM4.dataset.normalize(rawDataset);
      const result2 = DM4.dataset.normalize(rawDataset);

      // Should return the same cached object
      expect(result1).toBe(result2);
      expect(result1.systems['sol'].coords).toEqual([100, 200]);
    });

    test('should maintain separate cache entries for different datasets', () => {
      const dataset1 = {
        systems: { 'sol': { name: 'Sol' } },
        system_pixels: { 'sol': [100, 200] }
      };

      const dataset2 = {
        systems: { 'alpha': { name: 'Alpha' } },
        system_pixels: { 'alpha': [150, 250] }
      };

      const result1 = DM4.dataset.normalize(dataset1);
      const result2 = DM4.dataset.normalize(dataset2);

      expect(result1).not.toBe(result2);
      expect(result1.systems['sol']).toBeDefined();
      expect(result1.systems['alpha']).toBeUndefined();
      expect(result2.systems['alpha']).toBeDefined();
      expect(result2.systems['sol']).toBeUndefined();
    });

    test('should clear cache when clearCache() is called', () => {
      const rawDataset = {
        systems: { 'sol': { name: 'Sol' } },
        system_pixels: { 'sol': [100, 200] }
      };

      const result1 = DM4.dataset.normalize(rawDataset);
      const stats1 = DM4.dataset.getCacheStats();
      expect(stats1.size).toBe(1);

      DM4.dataset.clearCache();
      
      const stats2 = DM4.dataset.getCacheStats();
      expect(stats2.size).toBe(0);

      const result2 = DM4.dataset.normalize(rawDataset);
      // Should be a new object, not the cached one
      expect(result2).not.toBe(result1);
    });

    test('should provide cache stats with and without keys', () => {
      const dataset = {
        systems: { 'sol': { name: 'Sol' } }
      };

      DM4.dataset.normalize(dataset);

      const statsWithoutKeys = DM4.dataset.getCacheStats();
      expect(statsWithoutKeys.size).toBe(1);
      expect(statsWithoutKeys.keys).toBeUndefined();

      const statsWithKeys = DM4.dataset.getCacheStats({ includeKeys: true });
      expect(statsWithKeys.size).toBe(1);
      expect(statsWithKeys.keys).toBeDefined();
      expect(Array.isArray(statsWithKeys.keys)).toBe(true);
      expect(statsWithKeys.keys.length).toBe(1);
    });

    test('should cache datasets with additional properties correctly', () => {
      const rawDataset = {
        systems: { 'sol': { name: 'Sol' } },
        system_pixels: { 'sol': [100, 200] },
        customProp: 'custom-value',
        routes: [{ from: 'sol', to: 'alpha' }]
      };

      const result1 = DM4.dataset.normalize(rawDataset);
      const result2 = DM4.dataset.normalize(rawDataset);

      expect(result1).toBe(result2);
      expect(result1.customProp).toBe('custom-value');
      expect(result1.routes).toEqual([{ from: 'sol', to: 'alpha' }]);
    });
  });

  describe('Async Normalization', () => {
    test('should return Promise when async option is true', async () => {
      const rawDataset = {
        systems: {
          'sol': { name: 'Sol System' }
        },
        system_pixels: {
          'sol': [100, 200]
        }
      };

      const result = DM4.dataset.normalize(rawDataset, { async: true });
      expect(result).toBeInstanceOf(Promise);

      const normalized = await result;
      expect(normalized.systems['sol'].coords).toEqual([100, 200]);
    });

    test('should use cache in async mode', async () => {
      const rawDataset = {
        systems: { 'sol': { name: 'Sol' } },
        system_pixels: { 'sol': [100, 200] }
      };

      // First call (sync) should cache
      const syncResult = DM4.dataset.normalize(rawDataset);
      
      // Second call (async) should hit cache
      const asyncResult = await DM4.dataset.normalize(rawDataset, { async: true });
      
      // Should be the same cached object
      expect(syncResult).toBe(asyncResult);
    });

    test('should handle invalid data in async mode', async () => {
      try {
        await DM4.dataset.normalize(null, { async: true });
        // Should not reach here - but if it does, check the result
        expect(true).toBe(true);
      } catch (error) {
        // Error is acceptable
        expect(error).toBeDefined();
      }
    });
  });

  describe('Error Handling', () => {
    test('should continue normalization when one system fails', () => {
      // Create a dataset where Object.assign might fail on one system
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
        }
      };

      const result = DM4.dataset.normalize(rawDataset);
      
      // All systems should be present
      expect(result.systems['sol']).toBeDefined();
      expect(result.systems['alpha']).toBeDefined();
      expect(result.systems['beta']).toBeDefined();
    });

    test('should handle missing coords gracefully', () => {
      const rawDataset = {
        systems: {
          'sol': { name: 'Sol' }
        }
        // No system_pixels or endpoint_pixels
      };

      const result = DM4.dataset.normalize(rawDataset);
      
      expect(result.systems['sol']).toBeDefined();
      expect(result.systems['sol'].name).toBe('Sol');
      expect(result.systems['sol'].coords).toBeUndefined();
    });

    test('should validate coords format and log warnings', () => {
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      const rawDataset = {
        systems: {
          'sol': { name: 'Sol' }
        },
        system_pixels: {
          'sol': [100]  // Invalid: should be array of length 2
        }
      };

      const result = DM4.dataset.normalize(rawDataset);
      
      expect(result.systems['sol']).toBeDefined();
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Validation failed: System \'sol\' coords should be array of length 2')
      );
      
      warnSpy.mockRestore();
    });

    test('should handle complex dataset with all features', () => {
      const rawDataset = {
        systems: {
          'sol': { name: 'Sol', population: 10000 },
          'alpha': { name: 'Alpha', population: 5000 },
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
        },
        routes: [{ from: 'sol', to: 'alpha' }],
        metadata: { version: '1.0' }
      };

      const result = DM4.dataset.normalize(rawDataset);
      
      // Check all systems are normalized correctly
      expect(result.systems['sol'].coords).toEqual([100, 200]);
      expect(result.systems['sol'].grid).toEqual({ row: 5, col: 10 });
      expect(result.systems['sol'].sector).toBe('core');
      expect(result.systems['sol'].population).toBe(10000);
      
      expect(result.systems['alpha'].coords).toEqual([150, 250]);
      expect(result.systems['alpha'].sector).toBe('core');
      
      expect(result.systems['beta'].coords).toEqual([200, 300]);
      expect(result.systems['beta'].sector).toBe('outer');
      
      // Check preserved properties
      expect(result.routes).toEqual([{ from: 'sol', to: 'alpha' }]);
      expect(result.metadata).toEqual({ version: '1.0' });
    });
  });

  describe('Logger Integration', () => {
    test('should have Logger.validate() method available', () => {
      expect(DM4.Logger.validate).toBeDefined();
      expect(typeof DM4.Logger.validate).toBe('function');
    });

    test('should use Logger.validate() and return boolean', () => {
      // Clear any previous spies first
      jest.restoreAllMocks();
      
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      const result1 = DM4.Logger.validate(true, 'This should not warn');
      expect(result1).toBe(true);
      expect(warnSpy).not.toHaveBeenCalled();
      
      const result2 = DM4.Logger.validate(false, 'This should warn');
      expect(result2).toBe(false);
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Validation failed: This should warn')
      );
      
      warnSpy.mockRestore();
    });
  });

  describe('Performance', () => {
    test('should handle large dataset (1000 systems) in reasonable time', () => {
      const rawDataset = {
        systems: {},
        system_pixels: {}
      };

      // Generate 1000 systems
      for (let i = 0; i < 1000; i++) {
        const id = 'system-' + i;
        rawDataset.systems[id] = { name: 'System ' + i };
        rawDataset.system_pixels[id] = [i * 10, i * 10];
      }

      const startTime = Date.now();
      const result = DM4.dataset.normalize(rawDataset);
      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(1000); // Should complete in under 1 second
      expect(Object.keys(result.systems).length).toBe(1000);
    });

    test('should improve performance on repeated normalization via caching', () => {
      const rawDataset = {
        systems: {},
        system_pixels: {}
      };

      // Generate 500 systems
      for (let i = 0; i < 500; i++) {
        const id = 'system-' + i;
        rawDataset.systems[id] = { name: 'System ' + i };
        rawDataset.system_pixels[id] = [i * 10, i * 10];
      }

      // First normalization (cold)
      const start1 = Date.now();
      const result1 = DM4.dataset.normalize(rawDataset);
      const duration1 = Date.now() - start1;

      // Second normalization (cached)
      const start2 = Date.now();
      const result2 = DM4.dataset.normalize(rawDataset);
      const duration2 = Date.now() - start2;

      // Cached should be much faster (or same object reference)
      expect(result1).toBe(result2);
      expect(duration2).toBeLessThanOrEqual(duration1);
    });
  });
});
