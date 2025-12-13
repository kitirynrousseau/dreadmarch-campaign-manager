;(function () {
  "use strict";

  if (!window.DM4) {
    window.DM4 = {};
  }
  var DM4 = window.DM4;

  // Local debug flag mirrors the core viewer's DM4_DEBUG behavior
  var DM4_DEBUG = !!(DM4 && DM4.config && DM4.config.debug);

  /**
   * DATASET NORMALIZER
   *
   * This module owns the canonical normalization step for DM4 datasets.
   * It mirrors the original normalizeDataset implementation from the viewer
   * core, but is now exposed as DM4.dataset.normalize(rawDataset).
   * 
   * Enhanced with:
   * - Web Worker support for async processing
   * - In-memory caching to avoid redundant normalization
   * - Graceful error handling with Logger integration
   */

  // Cache for normalized datasets
  var normalizationCache = new Map();
  var worker = null;
  var workerRequestId = 0;
  var pendingRequests = new Map();
  
  // Constants
  var WORKER_TIMEOUT_MS = 5000;
  var MAX_SYSTEM_IDS_IN_FINGERPRINT = 10;

  /**
   * Generate cache key from raw dataset structure
   * Uses a fingerprint approach for efficiency instead of full JSON.stringify
   */
  function generateCacheKey(raw) {
    try {
      // Create a fingerprint based on dataset structure, not full content
      var systemCount = raw.systems ? Object.keys(raw.systems).length : 0;
      var pixelCount = 0;
      var pixelSource = '';
      
      // Track which pixel source is used
      if (raw.system_pixels) {
        pixelCount = Object.keys(raw.system_pixels).length;
        pixelSource = 'system_pixels';
      } else if (raw.endpoint_pixels) {
        pixelCount = Object.keys(raw.endpoint_pixels).length;
        pixelSource = 'endpoint_pixels';
      }
      
      var gridCount = raw.system_grid ? Object.keys(raw.system_grid).length : 0;
      var sectorCount = raw.sectors ? Object.keys(raw.sectors).length : 0;
      
      // For small datasets, use full JSON; for large ones, use fingerprint
      if (systemCount < 100) {
        return JSON.stringify(raw);
      }
      
      // For large datasets, create a fingerprint
      var systemIds = raw.systems ? Object.keys(raw.systems).sort().slice(0, MAX_SYSTEM_IDS_IN_FINGERPRINT).join(',') : '';
      return [systemCount, pixelCount, pixelSource, gridCount, sectorCount, systemIds].join('|');
    } catch (e) {
      // If fingerprint fails, don't cache
      return null;
    }
  }

  /**
   * Initialize Web Worker for normalization
   */
  function initWorker() {
    if (worker || typeof Worker === 'undefined') {
      return;
    }

    try {
      worker = new Worker('dataset-normalizer.worker.js');
      
      worker.addEventListener('message', function(event) {
        var data = event.data;
        var request = pendingRequests.get(data.id);
        
        if (request) {
          pendingRequests.delete(data.id);
          
          if (data.type === 'SUCCESS') {
            // Cache the result
            if (request.cacheKey) {
              normalizationCache.set(request.cacheKey, data.payload);
            }
            request.resolve(data.payload);
          } else {
            request.reject(new Error(data.error));
          }
        }
      });

      worker.addEventListener('error', function(error) {
        if (DM4.Logger) {
          DM4.Logger.error('Worker error:', error.message);
        }
        // Reject all pending requests
        pendingRequests.forEach(function(request) {
          request.reject(error);
        });
        pendingRequests.clear();
        worker = null;
      });
    } catch (e) {
      if (DM4.Logger) {
        DM4.Logger.warn('Failed to initialize worker:', e.message);
      }
      worker = null;
    }
  }

  /**
   * Synchronous normalization (fallback)
   * 
   * NOTE: This logic is duplicated in dataset-normalizer.worker.js for Web Worker execution.
   * Keep both implementations in sync when making changes to the normalization algorithm.
   */
  function normalizeDatasetSync(raw) {
    if (!raw || typeof raw !== "object") {
      if (DM4.Logger) {
        DM4.Logger.warn("normalizeDataset: empty or invalid raw dataset");
      }
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

        // Validate coords if present
        if (coords && DM4.Logger) {
          DM4.Logger.validate(
            Array.isArray(coords) && coords.length >= 2,
            "System " + id + " has invalid coords format"
          );
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
        errors.push({ systemId: id, error: err.message });
        if (DM4.Logger) {
          DM4.Logger.warn("Failed to normalize system " + id + ":", err.message);
        }
      }
    });

    var result = Object.assign({}, raw, {
      systems: normalizedSystems
    });

    // Include errors if any occurred
    if (errors.length > 0 && DM4.Logger) {
      DM4.Logger.warn("Normalization completed with errors", errors);
      result._normalizationErrors = errors;
    }

    return result;
  }

  /**
   * Async normalization using Web Worker
   */
  function normalizeDatasetAsync(raw) {
    return new Promise(function(resolve, reject) {
      // Check cache first
      var cacheKey = generateCacheKey(raw);
      if (cacheKey && normalizationCache.has(cacheKey)) {
        if (DM4.Logger) {
          DM4.Logger.info("Cache hit for dataset normalization");
        }
        resolve(normalizationCache.get(cacheKey));
        return;
      }

      // Try to initialize worker if not already done
      if (!worker) {
        initWorker();
      }

      // Fallback to sync if worker not available
      if (!worker) {
        if (DM4.Logger) {
          DM4.Logger.info("Worker not available, using synchronous normalization");
        }
        try {
          var result = normalizeDatasetSync(raw);
          if (cacheKey) {
            normalizationCache.set(cacheKey, result);
          }
          resolve(result);
        } catch (e) {
          reject(e);
        }
        return;
      }

      // Send to worker
      var requestId = ++workerRequestId;
      pendingRequests.set(requestId, {
        resolve: resolve,
        reject: reject,
        cacheKey: cacheKey
      });

      worker.postMessage({
        type: 'NORMALIZE',
        payload: raw,
        id: requestId
      });

      // Timeout fallback
      setTimeout(function() {
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
          } catch (e) {
            reject(e);
          }
        }
      }, WORKER_TIMEOUT_MS);
    });
  }

  /**
   * Main normalize function - supports both sync and async
   * @param {Object} raw - Raw dataset to normalize
   * @param {Object} options - Options object
   * @param {boolean} options.async - Use async normalization (default: false for backward compatibility)
   * @returns {Object|Promise<Object>} Normalized dataset
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
        DM4.Logger.info("Cache hit for dataset normalization");
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
   * Clear normalization cache
   */
  function clearCache() {
    normalizationCache.clear();
    if (DM4.Logger) {
      DM4.Logger.info("Normalization cache cleared");
    }
  }

  /**
   * Get cache statistics
   * @param {Object} options - Options object
   * @param {boolean} options.includeKeys - Whether to include all cache keys (default: false)
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

  if (!DM4.dataset) {
    DM4.dataset = {};
  }
  DM4.dataset.normalize = normalizeDataset;
  DM4.dataset.clearCache = clearCache;
  DM4.dataset.getCacheStats = getCacheStats;
})();
