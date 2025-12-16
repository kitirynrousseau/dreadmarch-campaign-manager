;(function () {
  "use strict";

  if (!window.DM4) {
    window.DM4 = {};
  }
  var DM4 = window.DM4;

  // Local debug flag mirrors the core viewer's DM4_DEBUG behavior
  var DM4_DEBUG = !!(DM4 && DM4.config && DM4.config.debug);

  // Cache for normalized datasets
  var normalizationCache = new Map();
  var worker = null;
  var workerRequestId = 0;
  var pendingRequests = new Map();

  // Constants
  var WORKER_TIMEOUT_MS = 5000;
  var MAX_SYSTEM_IDS_IN_FINGERPRINT = 10;

  /**
   * Generate cache key for a dataset
   * 
   * For small datasets (< 100 systems), use full JSON.stringify.
   * For large datasets, use a fingerprint with metadata.
   * 
   * @param {Object} raw - Raw dataset
   * @returns {string|null} Cache key or null if serialization fails
   */
  function generateCacheKey(raw) {
    try {
      if (!raw || typeof raw !== "object") {
        return null;
      }

      var systems = raw.systems || {};
      var systemIds = Object.keys(systems);
      var systemCount = systemIds.length;

      // For small datasets, use full serialization
      if (systemCount < 100) {
        return JSON.stringify(raw);
      }

      // For large datasets, use fingerprint
      var pixels = raw.system_pixels || raw.endpoint_pixels || {};
      var pixelCount = Object.keys(pixels).length;
      var pixelSourceType = raw.system_pixels ? "system_pixels" : "endpoint_pixels";
      var grid = raw.system_grid || {};
      var gridCount = Object.keys(grid).length;
      var sectors = raw.sectors || {};
      var sectorCount = Object.keys(sectors).length;

      // Sample of system IDs for uniqueness
      var sampleSize = Math.min(MAX_SYSTEM_IDS_IN_FINGERPRINT, systemCount);
      var systemSample = systemIds.slice(0, sampleSize).sort();

      var fingerprint = {
        systemCount: systemCount,
        pixelCount: pixelCount,
        pixelSourceType: pixelSourceType,
        gridCount: gridCount,
        sectorCount: sectorCount,
        systemSample: systemSample
      };

      return JSON.stringify(fingerprint);
    } catch (e) {
      if (DM4.Logger) {
        DM4.Logger.warn("Failed to generate cache key: " + e.message);
      }
      return null;
    }
  }

  /**
   * Initialize Web Worker for async normalization
   * 
   * Creates worker from dataset-normalizer.worker.js if Worker is supported.
   * Sets up message handlers for SUCCESS/ERROR responses.
   */
  function initWorker() {
    // Only initialize once
    if (worker || typeof Worker === "undefined") {
      return;
    }

    try {
      worker = new Worker("src/core/dataset-normalizer.worker.js");

      worker.onmessage = function (event) {
        var data = event.data;
        var request = pendingRequests.get(data.id);

        if (!request) {
          return;
        }

        pendingRequests.delete(data.id);
        clearTimeout(request.timeoutId);

        if (data.type === "SUCCESS") {
          // Cache the result
          if (request.cacheKey) {
            normalizationCache.set(request.cacheKey, data.payload);
          }
          request.resolve(data.payload);
        } else if (data.type === "ERROR") {
          request.reject(new Error(data.error));
        }
      };

      worker.onerror = function (error) {
        if (DM4.Logger) {
          DM4.Logger.error("Worker error: " + error.message);
        }
        // Fall back to sync mode for pending requests
        pendingRequests.forEach(function (request) {
          clearTimeout(request.timeoutId);
          try {
            var result = normalizeDatasetSync(request.raw);
            if (request.cacheKey) {
              normalizationCache.set(request.cacheKey, result);
            }
            request.resolve(result);
          } catch (e) {
            request.reject(e);
          }
        });
        pendingRequests.clear();
      };
    } catch (e) {
      if (DM4.Logger) {
        DM4.Logger.warn("Failed to initialize Web Worker: " + e.message);
      }
      worker = null;
    }
  }

  /**
   * DATASET NORMALIZER MODULE
   *
   * This module provides the canonical dataset normalization function for the
   * Dreadmarch Campaign Manager. It takes a raw dataset from various sources
   * and transforms it into a normalized, consistent format that the rest of
   * the application can rely on.
   * 
   * Purpose:
   * Raw datasets may have system information scattered across multiple properties:
   * - System base data in 'systems'
   * - Pixel coordinates in 'system_pixels' or 'endpoint_pixels'
   * - Grid coordinates in 'system_grid'
   * - Sector assignments in 'sectors' (which map sector names to system arrays)
   * 
   * The normalizer consolidates all this information so that each system object
   * contains everything needed: coords, grid, and sector.
   * 
   * Normalization Strategy:
   * 1. Start with base system data from raw.systems
   * 2. Add coordinate data from system_pixels or endpoint_pixels
   * 3. Add grid position from system_grid
   * 4. Add sector assignment by building a reverse lookup from sectors map
   * 5. Return a new dataset with consolidated systems object
   * 
   * Caching:
   * The module now includes intelligent caching to improve performance for
   * repeated normalization of the same dataset. Small datasets use full
   * JSON.stringify as cache keys, while large datasets use a fingerprint.
   * 
   * Web Worker Support:
   * Optional async processing via Web Workers for large datasets. Falls back
   * to synchronous processing if Worker is unavailable or times out.
   * 
   * Error Handling:
   * The normalizer is defensive and handles missing or malformed data gracefully:
   * - Returns {systems: {}} for null/undefined/non-object input
   * - Missing properties default to empty objects
   * - Missing system data defaults to empty objects
   * - All operations use safe property access
   * - Per-system errors are collected in _normalizationErrors property
   */

  /**
   * DM4_DATASET_CORE_FUNCTION: normalizeDatasetSync
   * 
   * Synchronously normalizes a raw dataset into a consistent format with 
   * consolidated system data. Includes error collection for resilient processing.
   * 
   * Input format (raw):
   * {
   *   systems: { systemId: { name, ... }, ... },
   *   system_pixels: { systemId: [x, y], ... },
   *   endpoint_pixels: { systemId: [x, y], ... },  // Alternative to system_pixels
   *   system_grid: { systemId: { col, row, grid }, ... },
   *   sectors: { sectorName: [systemId1, systemId2, ...], ... },
   *   ... other properties (preserved in output)
   * }
   * 
   * Output format:
   * {
   *   systems: {
   *     systemId: {
   *       ... base system properties ...,
   *       coords: [x, y],           // Added from system_pixels/endpoint_pixels
   *       grid: { col, row, grid }, // Added from system_grid
   *       sector: "sectorName"      // Added from sectors reverse lookup
   *     },
   *     ...
   *   },
   *   _normalizationErrors: [...],  // Added if any errors occurred
   *   ... all other properties from raw dataset preserved ...
   * }
   * 
   * @param {Object} raw - Raw dataset object to normalize
   * @returns {Object} Normalized dataset with consolidated system data
   */
  function normalizeDatasetSync(raw) {
    // Validate input - return safe default if invalid
    if (!raw || typeof raw !== "object") {
      return DM4.Logger.critical(
        "normalizeDataset: empty or invalid raw dataset",
        function () {
          return { systems: {} };
        }
      );
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
     * 
     * The sectors object maps sector names to arrays of system IDs:
     *   sectors: { "Grumani": ["Darkknell", "Sanrafsix", ...], ... }
     * 
     * We need to quickly find which sector a system belongs to, so we
     * build a reverse mapping:
     *   sectorBySystem: { "Darkknell": "Grumani", "Sanrafsix": "Grumani", ... }
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
     * 
     * For each system in the source data, we:
     * 1. Start with the base system object
     * 2. Add coords from pixels source (if not already present)
     * 3. Add grid position from grid source (if not already present)
     * 4. Add sector from reverse lookup (if not already present)
     * 
     * This allows systems to have inline data that overrides the separate
     * lookup tables, providing flexibility in dataset structure.
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
        
        // Validate coords format using Logger.validate
        if (coords && DM4.Logger) {
          DM4.Logger.validate(
            Array.isArray(coords) && coords.length === 2,
            "System '" + id + "' coords should be array of length 2"
          );
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
        if (DM4.Logger) {
          DM4.Logger.warn("Error normalizing system '" + id + "': " + error.message);
        }
        // Still add a basic normalized entry
        normalizedSystems[id] = Object.assign({}, sys);
      }
    });

    /**
     * Return new dataset with normalized systems
     * 
     * We preserve all other properties from the raw dataset (routes, metadata, etc.)
     * and only replace the systems object with our normalized version.
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

  /**
   * Async normalization via Web Worker
   * 
   * @param {Object} raw - Raw dataset object to normalize
   * @returns {Promise<Object>} Promise resolving to normalized dataset
   */
  function normalizeDatasetAsync(raw) {
    return new Promise(function (resolve, reject) {
      // Check cache first
      var cacheKey = generateCacheKey(raw);
      if (cacheKey && normalizationCache.has(cacheKey)) {
        if (DM4.Logger) {
          DM4.Logger.log("Cache hit for async dataset normalization");
        }
        resolve(normalizationCache.get(cacheKey));
        return;
      }

      // Initialize worker if needed
      initWorker();

      // Fall back to sync if worker unavailable
      if (!worker) {
        if (DM4.Logger) {
          DM4.Logger.log("Web Worker unavailable, falling back to sync normalization");
        }
        try {
          var result = normalizeDatasetSync(raw);
          if (cacheKey) {
            normalizationCache.set(cacheKey, result);
          }
          resolve(result);
        } catch (error) {
          reject(error);
        }
        return;
      }

      // Post message to worker
      var requestId = ++workerRequestId;
      var timeoutId = setTimeout(function () {
        // Timeout - fall back to sync
        if (pendingRequests.has(requestId)) {
          pendingRequests.delete(requestId);
          if (DM4.Logger) {
            DM4.Logger.warn("Worker timeout, falling back to sync normalization");
          }
          try {
            var result = normalizeDatasetSync(raw);
            if (cacheKey) {
              normalizationCache.set(cacheKey, result);
            }
            resolve(result);
          } catch (error) {
            reject(error);
          }
        }
      }, WORKER_TIMEOUT_MS);

      pendingRequests.set(requestId, {
        resolve: resolve,
        reject: reject,
        timeoutId: timeoutId,
        cacheKey: cacheKey,
        raw: raw
      });

      worker.postMessage({
        type: "NORMALIZE",
        payload: raw,
        id: requestId
      });
    });
  }

  /**
   * Main normalization function with caching and optional async support
   * 
   * @param {Object} raw - Raw dataset object to normalize
   * @param {Object} options - Options object
   * @param {boolean} options.async - If true, use Web Worker for async processing
   * @returns {Object|Promise<Object>} Normalized dataset (or Promise if async)
   */
  function normalizeDataset(raw, options) {
    options = options || {};
    
    if (options.async) {
      return normalizeDatasetAsync(raw);
    }
    
    // Synchronous mode (default for backward compatibility)
    var cacheKey = generateCacheKey(raw);
    if (cacheKey && normalizationCache.has(cacheKey)) {
      if (DM4.Logger) {
        DM4.Logger.log("Cache hit for dataset normalization");
      }
      return normalizationCache.get(cacheKey);
    }
    
    var result = normalizeDatasetSync(raw);
    if (cacheKey) {
      normalizationCache.set(cacheKey, result);
    }
    return result;
  }

  /**
   * Clear the normalization cache
   */
  function clearCache() {
    normalizationCache.clear();
    if (DM4.Logger) {
      DM4.Logger.log("Normalization cache cleared");
    }
  }

  /**
   * Get cache statistics
   * 
   * @param {Object} options - Options object
   * @param {boolean} options.includeKeys - If true, include cache keys in stats
   * @returns {Object} Cache statistics
   */
  function getCacheStats(options) {
    options = options || {};
    var stats = {
      size: normalizationCache.size
    };
    
    if (options.includeKeys) {
      stats.keys = Array.from(normalizationCache.keys());
    }
    
    return stats;
  }

  /**
   * Export functions on the DM4.dataset namespace
   * 
   * This makes the normalizer and utility functions available as:
   *   DM4.dataset.normalize(rawDataset, options)
   *   DM4.dataset.clearCache()
   *   DM4.dataset.getCacheStats(options)
   * 
   * Usage examples:
   *   // Synchronous normalization with caching
   *   var normalized = DM4.dataset.normalize(rawData);
   *   
   *   // Async normalization with Web Worker
   *   DM4.dataset.normalize(rawData, { async: true }).then(function(normalized) {
   *     // Use normalized data
   *   });
   *   
   *   // Clear cache
   *   DM4.dataset.clearCache();
   *   
   *   // Get cache stats
   *   var stats = DM4.dataset.getCacheStats({ includeKeys: true });
   */
  if (!DM4.dataset) {
    DM4.dataset = {};
  }
  DM4.dataset.normalize = normalizeDataset;
  DM4.dataset.clearCache = clearCache;
  DM4.dataset.getCacheStats = getCacheStats;
})();
