/**
 * Dataset Normalizer Web Worker
 * 
 * NOTE: This file contains duplicated normalization logic from dm4-dataset-core.js.
 * This is intentional because Web Workers cannot easily import shared scripts
 * in all browser environments, and we need the worker to be self-contained.
 * 
 * MAINTENANCE WARNING:
 * If you modify the normalization algorithm, you MUST update BOTH files:
 * - src/core/dm4-dataset-core.js (normalizeDatasetSync function)
 * - src/core/dataset-normalizer.worker.js (normalizeDataset function)
 * 
 * The logic should remain identical between the two versions to ensure
 * consistent results whether normalization happens in the main thread or worker.
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
        error: error.message || String(error),
        id: data.id
      });
    }
  }
});

/**
 * Normalize dataset (Worker version)
 * 
 * This is a duplicate of normalizeDatasetSync from dm4-dataset-core.js
 * adapted to run in a Web Worker environment (no DM4.Logger available).
 * 
 * @param {Object} raw - Raw dataset object to normalize
 * @returns {Object} Normalized dataset with consolidated system data
 */
function normalizeDataset(raw) {
  // Validate input - return safe default if invalid
  if (!raw || typeof raw !== "object") {
    return { systems: {} };
  }

  // Extract source data with safe defaults
  var systemsSrc = raw.systems || {};
  var pixelsSrc = raw.system_pixels || raw.endpoint_pixels || {};
  var gridSrc = raw.system_grid || {};
  var sectorsSrc = raw.sectors || {};
  
  // Error collection for resilient processing
  var errors = [];

  /**
   * Build reverse lookup: systemId -> sectorName
   */
  var sectorBySystem = {};
  Object.entries(sectorsSrc).forEach(function (entry) {
    var sectorName = entry[0];
    var systemList = entry[1];
    (systemList || []).forEach(function (sysId) {
      sectorBySystem[sysId] = sectorName;
    });
  });

  /**
   * Normalize each system
   */
  var normalizedSystems = {};

  Object.entries(systemsSrc).forEach(function (entry) {
    var id = entry[0];
    var sys = entry[1] || {};
    
    try {
      var base = sys;

      // Consolidate coordinates
      var coords = base.coords;
      if (!coords && pixelsSrc && pixelsSrc[id]) {
        coords = pixelsSrc[id];
      }
      
      // Validate coords format (same validation as main thread)
      if (coords) {
        if (!Array.isArray(coords) || coords.length !== 2) {
          // Log validation warning in errors array
          errors.push({
            systemId: id,
            message: "Validation failed: System '" + id + "' coords should be array of length 2"
          });
        }
      }

      // Consolidate grid position
      var grid = base.grid;
      if (!grid && gridSrc && gridSrc[id]) {
        grid = gridSrc[id];
      }

      // Consolidate sector assignment
      var sector = base.sector;
      if (!sector && sectorBySystem[id]) {
        sector = sectorBySystem[id];
      }

      // Create normalized system object with all consolidated data
      normalizedSystems[id] = Object.assign({}, base, {
        coords: coords,
        grid: grid,
        sector: sector
      });
    } catch (error) {
      // Collect error but continue processing
      errors.push({
        systemId: id,
        message: error.message || String(error)
      });
      // Still add a basic normalized entry
      normalizedSystems[id] = Object.assign({}, sys);
    }
  });

  /**
   * Return new dataset with normalized systems
   */
  var result = Object.assign({}, raw, {
    systems: normalizedSystems
  });
  
  // Add errors if any occurred
  if (errors.length > 0) {
    result._normalizationErrors = errors;
  }
  
  return result;
}
