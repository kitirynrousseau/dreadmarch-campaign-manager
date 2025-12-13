/**
 * Dataset Normalizer Web Worker
 * 
 * Offloads dataset normalization to a separate thread to improve performance
 * for large datasets.
 * 
 * NOTE: This file contains duplicated normalization logic from dm4-dataset-core.js.
 * This is intentional because:
 * 1. Web Workers in browsers cannot easily import ES modules or shared scripts
 * 2. The worker needs to be self-contained for deployment simplicity
 * 3. The normalization logic is stable and rarely changes
 * 
 * If you modify the normalization algorithm, update BOTH files:
 * - dm4-dataset-core.js (normalizeDatasetSync function)
 * - dataset-normalizer.worker.js (normalizeDataset function)
 */

self.addEventListener('message', function(event) {
  var data = event.data;
  
  if (data.type === 'NORMALIZE') {
    try {
      var normalized = normalizeDataset(data.payload);
      self.postMessage({
        type: 'SUCCESS',
        payload: normalized,
        id: data.id
      });
    } catch (error) {
      self.postMessage({
        type: 'ERROR',
        error: error.message,
        id: data.id
      });
    }
  }
});

/**
 * Core normalization logic (extracted from dm4-dataset-core.js)
 */
function normalizeDataset(raw) {
  if (!raw || typeof raw !== "object") {
    return { systems: {} };
  }

  var systemsSrc = raw.systems || {};
  var pixelsSrc = raw.system_pixels || raw.endpoint_pixels || {};
  var gridSrc = raw.system_grid || {};
  var sectorsSrc = raw.sectors || {};

  // Build reverse lookup: systemId -> sectorName
  var sectorBySystem = {};
  Object.entries(sectorsSrc).forEach(function (entry) {
    var sectorName = entry[0];
    var systemList = entry[1];
    (systemList || []).forEach(function (sysId) {
      sectorBySystem[sysId] = sectorName;
    });
  });

  var normalizedSystems = {};
  var errors = [];

  Object.entries(systemsSrc).forEach(function (entry) {
    var id = entry[0];
    var sys = entry[1] || {};
    
    try {
      var base = sys;

      var coords = base.coords;
      if (!coords && pixelsSrc && pixelsSrc[id]) {
        coords = pixelsSrc[id];
      }

      // Validate coords if present (consistent with main thread)
      if (coords && !Array.isArray(coords)) {
        // Log warning but continue processing
        errors.push({
          systemId: id,
          error: 'Invalid coords format (expected array)'
        });
      }

      var grid = base.grid;
      if (!grid && gridSrc && gridSrc[id]) {
        grid = gridSrc[id];
      }

      var sector = base.sector;
      if (!sector && sectorBySystem[id]) {
        sector = sectorBySystem[id];
      }

      normalizedSystems[id] = Object.assign({}, base, {
        coords: coords,
        grid: grid,
        sector: sector
      });
    } catch (err) {
      // Log error but continue processing other systems
      errors.push({
        systemId: id,
        error: err.message
      });
    }
  });

  var result = Object.assign({}, raw, {
    systems: normalizedSystems
  });

  // Include errors if any occurred
  if (errors.length > 0) {
    result._normalizationErrors = errors;
  }

  return result;
}
