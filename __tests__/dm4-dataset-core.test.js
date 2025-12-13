/**
 * Unit tests for dm4-dataset-core.js
 * Testing the normalizeDataset function
 */

describe('DM4 Dataset Core - normalizeDataset', () => {
  let DM4;

  beforeAll(() => {
    // Setup DM4 global namespace
    global.window = global;
    global.DM4 = {
      config: { debug: false },
      dataset: {}
    };
    DM4 = global.DM4;

    // Load the module - it executes immediately
    require('../dm4-dataset-core.js');
  });

  afterAll(() => {
    // Cleanup
    delete global.window;
    delete global.DM4;
  });

  describe('Valid Dataset Normalization', () => {
    test('should normalize a complete dataset with systems, pixels, grid, and sectors', () => {
      const rawDataset = {
        systems: {
          'sol': {
            name: 'Sol System',
            description: 'Home system'
          },
          'alpha-centauri': {
            name: 'Alpha Centauri',
            description: 'Nearby system'
          }
        },
        system_pixels: {
          'sol': [100, 200],
          'alpha-centauri': [150, 250]
        },
        system_grid: {
          'sol': { row: 5, col: 10 },
          'alpha-centauri': { row: 6, col: 11 }
        },
        sectors: {
          'core-sector': ['sol'],
          'outer-sector': ['alpha-centauri']
        }
      };

      const normalized = DM4.dataset.normalize(rawDataset);

      expect(normalized).toBeDefined();
      expect(normalized.systems).toBeDefined();
      expect(normalized.systems['sol']).toEqual({
        name: 'Sol System',
        description: 'Home system',
        coords: [100, 200],
        grid: { row: 5, col: 10 },
        sector: 'core-sector'
      });
      expect(normalized.systems['alpha-centauri']).toEqual({
        name: 'Alpha Centauri',
        description: 'Nearby system',
        coords: [150, 250],
        grid: { row: 6, col: 11 },
        sector: 'outer-sector'
      });
    });

    test('should use endpoint_pixels as fallback for system_pixels', () => {
      const rawDataset = {
        systems: {
          'sol': { name: 'Sol System' }
        },
        endpoint_pixels: {
          'sol': [100, 200]
        }
      };

      const normalized = DM4.dataset.normalize(rawDataset);

      expect(normalized.systems['sol'].coords).toEqual([100, 200]);
    });

    test('should normalize dataset with only systems', () => {
      const rawDataset = {
        systems: {
          'sol': {
            name: 'Sol System',
            coords: [100, 200],
            grid: { row: 5, col: 10 },
            sector: 'core-sector'
          }
        }
      };

      const normalized = DM4.dataset.normalize(rawDataset);

      expect(normalized.systems['sol']).toEqual({
        name: 'Sol System',
        coords: [100, 200],
        grid: { row: 5, col: 10 },
        sector: 'core-sector'
      });
    });

    test('should preserve additional properties in raw dataset', () => {
      const rawDataset = {
        systems: { 'sol': { name: 'Sol' } },
        customProperty: 'custom-value',
        routes: [{ from: 'sol', to: 'alpha' }]
      };

      const normalized = DM4.dataset.normalize(rawDataset);

      expect(normalized.customProperty).toBe('custom-value');
      expect(normalized.routes).toEqual([{ from: 'sol', to: 'alpha' }]);
    });
  });

  describe('Invalid Dataset Handling', () => {
    test('should return default structure for null input', () => {
      const normalized = DM4.dataset.normalize(null);

      expect(normalized).toEqual({ systems: {} });
    });

    test('should return default structure for undefined input', () => {
      const normalized = DM4.dataset.normalize(undefined);

      expect(normalized).toEqual({ systems: {} });
    });

    test('should return default structure for non-object input', () => {
      expect(DM4.dataset.normalize('string')).toEqual({ systems: {} });
      expect(DM4.dataset.normalize(123)).toEqual({ systems: {} });
      expect(DM4.dataset.normalize(true)).toEqual({ systems: {} });
    });

    test('should handle empty dataset object', () => {
      const normalized = DM4.dataset.normalize({});

      expect(normalized).toEqual({ systems: {} });
    });

    test('should handle dataset with empty systems object', () => {
      const rawDataset = { systems: {} };
      const normalized = DM4.dataset.normalize(rawDataset);

      expect(normalized.systems).toEqual({});
    });

    test('should handle missing systems property gracefully', () => {
      const rawDataset = {
        system_pixels: { 'sol': [100, 200] },
        sectors: { 'core': ['sol'] }
      };

      const normalized = DM4.dataset.normalize(rawDataset);

      expect(normalized.systems).toEqual({});
    });
  });

  describe('Edge Cases', () => {
    test('should handle system with null value', () => {
      const rawDataset = {
        systems: {
          'sol': null
        }
      };

      const normalized = DM4.dataset.normalize(rawDataset);

      expect(normalized.systems['sol']).toBeDefined();
      expect(normalized.systems['sol'].coords).toBeUndefined();
    });

    test('should handle multiple systems in same sector', () => {
      const rawDataset = {
        systems: {
          'sol': { name: 'Sol' },
          'proxima': { name: 'Proxima' },
          'sirius': { name: 'Sirius' }
        },
        sectors: {
          'core-sector': ['sol', 'proxima', 'sirius']
        }
      };

      const normalized = DM4.dataset.normalize(rawDataset);

      expect(normalized.systems['sol'].sector).toBe('core-sector');
      expect(normalized.systems['proxima'].sector).toBe('core-sector');
      expect(normalized.systems['sirius'].sector).toBe('core-sector');
    });

    test('should handle system in multiple sectors (last sector wins)', () => {
      const rawDataset = {
        systems: {
          'sol': { name: 'Sol' }
        },
        sectors: {
          'sector-a': ['sol'],
          'sector-b': ['sol']
        }
      };

      const normalized = DM4.dataset.normalize(rawDataset);

      // The last sector processed wins (depends on Object.entries iteration order)
      expect(['sector-a', 'sector-b']).toContain(normalized.systems['sol'].sector);
    });

    test('should handle sectors with empty arrays', () => {
      const rawDataset = {
        systems: {
          'sol': { name: 'Sol' }
        },
        sectors: {
          'empty-sector': [],
          'core-sector': ['sol']
        }
      };

      const normalized = DM4.dataset.normalize(rawDataset);

      expect(normalized.systems['sol'].sector).toBe('core-sector');
    });

    test('should handle sectors with null system lists', () => {
      const rawDataset = {
        systems: {
          'sol': { name: 'Sol' }
        },
        sectors: {
          'null-sector': null,
          'core-sector': ['sol']
        }
      };

      const normalized = DM4.dataset.normalize(rawDataset);

      expect(normalized.systems['sol'].sector).toBe('core-sector');
    });
  });
});
