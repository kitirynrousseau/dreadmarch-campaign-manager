# Dataset Normalization API

## Overview

The Dataset Normalization system (`dm4-dataset-core.js`) provides robust, performant handling of galactic system data with intelligent caching and optional Web Worker offloading for large datasets. This document describes the enhanced API introduced in version 2.0 of the normalization system.

## Key Features

- **Intelligent Caching**: Automatically caches normalized datasets to improve performance on repeated calls
- **Web Worker Support**: Optional async processing via Web Workers for large datasets
- **Error Resilience**: Continues processing even when individual systems fail, collecting errors for review
- **Validation Integration**: Uses `DM4.Logger.validate()` to check data format
- **Backward Compatible**: Default behavior unchanged; new features are opt-in

## API Reference

### DM4.dataset.normalize(raw, options)

Main entry point for dataset normalization.

**Parameters:**
- `raw` (Object): Raw dataset object to normalize
- `options` (Object, optional): Configuration options
  - `async` (Boolean): If `true`, uses Web Worker for async processing. Default: `false`

**Returns:**
- When `async: false` (default): Returns normalized dataset object
- When `async: true`: Returns Promise that resolves to normalized dataset object

**Example (Synchronous):**
```javascript
var rawDataset = {
  systems: {
    'Darkknell': { name: 'Darkknell' }
  },
  system_pixels: {
    'Darkknell': [2752, 2414]
  },
  sectors: {
    'Grumani': ['Darkknell']
  }
};

var normalized = DM4.dataset.normalize(rawDataset);
// normalized.systems['Darkknell'].coords === [2752, 2414]
// normalized.systems['Darkknell'].sector === 'Grumani'
```

**Example (Asynchronous):**
```javascript
DM4.dataset.normalize(largeDataset, { async: true })
  .then(function(normalized) {
    console.log('Normalized ' + Object.keys(normalized.systems).length + ' systems');
  })
  .catch(function(error) {
    console.error('Normalization failed:', error);
  });
```

### DM4.dataset.clearCache()

Clears the normalization cache. Use this when you need to force re-normalization of a dataset.

**Parameters:** None

**Returns:** `undefined`

**Example:**
```javascript
DM4.dataset.clearCache();
console.log('Cache cleared');
```

### DM4.dataset.getCacheStats(options)

Returns statistics about the normalization cache.

**Parameters:**
- `options` (Object, optional): Configuration options
  - `includeKeys` (Boolean): If `true`, includes cache keys in the result. Default: `false`

**Returns:**
- Object with cache statistics:
  - `size` (Number): Number of cached datasets
  - `keys` (Array, optional): Array of cache keys (only if `includeKeys: true`)

**Example:**
```javascript
var stats = DM4.dataset.getCacheStats();
console.log('Cached datasets: ' + stats.size);

var detailedStats = DM4.dataset.getCacheStats({ includeKeys: true });
console.log('Cache keys:', detailedStats.keys);
```

### DM4.Logger.validate(condition, message)

New validation method added to the Logger for use in normalization and other modules.

**Parameters:**
- `condition` (Boolean): Condition to validate
- `message` (String): Message to log if validation fails

**Returns:**
- (Boolean): The condition result

**Example:**
```javascript
var coords = [100, 200];
var isValid = DM4.Logger.validate(
  Array.isArray(coords) && coords.length === 2,
  'Coords should be array of length 2'
);
// If condition is false, logs: "[DREADMARCH] Validation failed: Coords should be array of length 2"
```

## Data Format

### Input Format

```javascript
{
  systems: {
    systemId: {
      name: "System Name",
      // ... other properties
    }
  },
  system_pixels: {
    systemId: [x, y]  // Pixel coordinates
  },
  endpoint_pixels: {  // Alternative to system_pixels
    systemId: [x, y]
  },
  system_grid: {
    systemId: {
      col: "M",
      row: 17,
      grid: "M-17"
    }
  },
  sectors: {
    sectorName: [systemId1, systemId2, ...]
  },
  // ... other properties preserved
}
```

### Output Format

```javascript
{
  systems: {
    systemId: {
      name: "System Name",
      coords: [x, y],           // Consolidated from system_pixels/endpoint_pixels
      grid: { col, row, grid }, // Consolidated from system_grid
      sector: "sectorName",     // Consolidated from sectors reverse lookup
      // ... all original properties preserved
    }
  },
  _normalizationErrors: [  // Added if any errors occurred
    {
      systemId: "system-id",
      message: "Error message"
    }
  ],
  // ... all other input properties preserved
}
```

## Caching Behavior

### Cache Key Generation

The cache key is generated differently based on dataset size:

**Small Datasets (< 100 systems):**
- Uses full `JSON.stringify(raw)` as cache key
- Provides exact match for cache hits
- Efficient for small datasets

**Large Datasets (≥ 100 systems):**
- Uses a fingerprint including:
  - System count
  - Pixel count
  - Pixel source type (`system_pixels` vs `endpoint_pixels`)
  - Grid count
  - Sector count
  - Sample of up to 10 system IDs (sorted)
- More efficient for large datasets
- May have rare cache collisions for very similar datasets

### Cache Invalidation

The cache persists for the lifetime of the page session. To manually clear:

```javascript
DM4.dataset.clearCache();
```

Cache is automatically bypassed if key generation fails (e.g., circular references).

## Web Worker Behavior

### Initialization

Web Worker is initialized lazily on first async normalization request:
- Creates worker from `src/core/dataset-normalizer.worker.js`
- Sets up message handlers
- Worker persists for page lifetime

### Fallback Behavior

The system automatically falls back to synchronous normalization if:
- `Worker` is not supported in the browser
- Worker fails to initialize
- Worker times out (5 second default)
- Worker encounters an error

Fallback is transparent to the caller - the Promise still resolves with the result.

### Timeout

Worker requests have a 5-second timeout. If the worker doesn't respond within this time, the system falls back to synchronous normalization.

## Error Handling

### Per-System Error Collection

If normalization of an individual system fails, the system:
1. Logs a warning via `DM4.Logger.warn()`
2. Adds the error to `_normalizationErrors` array
3. Continues processing other systems
4. Still includes a basic entry for the failed system

**Example:**
```javascript
var result = DM4.dataset.normalize(datasetWithBadSystem);

if (result._normalizationErrors) {
  console.log('Encountered ' + result._normalizationErrors.length + ' errors:');
  result._normalizationErrors.forEach(function(err) {
    console.log('  - ' + err.systemId + ': ' + err.message);
  });
}
```

### Validation Warnings

The system uses `DM4.Logger.validate()` to check coords format:
- Warns if coords exist but are not an array of length 2
- Does not block normalization
- Logged to console for developer review

## Performance Considerations

### Dataset Size

**Small Datasets (< 100 systems):**
- Fast synchronous normalization (< 10ms typically)
- Caching provides minimal benefit
- Recommend: Use default sync mode

**Medium Datasets (100-500 systems):**
- Synchronous normalization still fast (< 50ms typically)
- Caching provides noticeable benefit for repeated normalizations
- Recommend: Use default sync mode with caching

**Large Datasets (500+ systems):**
- Synchronous normalization may take 100ms+
- Async mode can prevent UI blocking
- Caching provides significant benefit
- Recommend: Use async mode for initial normalization

### Cache Performance

**Cache Hit:**
- Returns cached object reference (O(1))
- No re-normalization needed
- Extremely fast (< 1ms)

**Cache Miss:**
- Full normalization required
- Result cached for future use
- Time depends on dataset size

### Memory Considerations

Each cached dataset consumes memory. For applications that normalize many different datasets:
- Monitor cache size via `getCacheStats()`
- Clear cache periodically if needed
- Consider cache size limits for your use case

## Browser Compatibility

### Core Functionality
- Works in all modern browsers
- ES5 compatible (no ES6 features)
- No external dependencies

### Web Worker Support
- Supported in: Chrome, Firefox, Safari, Edge (all modern versions)
- Not supported in: IE 9 and below
- Graceful fallback to sync mode if unavailable

### Map Support
- Uses JavaScript `Map` for caching
- Supported in all modern browsers
- Consider polyfill for IE 10 and below if needed

## Migration Guide

### From Version 1.x

**No Breaking Changes!**

The enhanced normalization system is fully backward compatible. Existing code continues to work without modification:

```javascript
// Old code (still works)
var normalized = DM4.dataset.normalize(rawDataset);

// New code (opt-in features)
var normalized = DM4.dataset.normalize(rawDataset); // Uses caching automatically
var asyncNormalized = await DM4.dataset.normalize(rawDataset, { async: true }); // Async mode
```

### New Capabilities

To take advantage of new features:

1. **Use caching** - Automatic, no code changes needed
2. **Clear cache when needed** - Call `DM4.dataset.clearCache()`
3. **Monitor cache** - Call `DM4.dataset.getCacheStats()`
4. **Use async mode** - Add `{ async: true }` option for large datasets
5. **Check for errors** - Inspect `result._normalizationErrors` if present

## Usage Examples

### Example 1: Basic Normalization with Caching

```javascript
// First call - normalizes and caches
var result1 = DM4.dataset.normalize(campaignData);
console.log('First normalization complete');

// Second call - returns cached result instantly
var result2 = DM4.dataset.normalize(campaignData);
console.log('Cache hit!', result1 === result2); // true
```

### Example 2: Async Normalization for Large Dataset

```javascript
function loadLargeDataset(datasetId) {
  var rawData = loadFromStorage(datasetId);
  
  // Use async mode to avoid blocking UI
  return DM4.dataset.normalize(rawData, { async: true })
    .then(function(normalized) {
      console.log('Loaded ' + Object.keys(normalized.systems).length + ' systems');
      return normalized;
    })
    .catch(function(error) {
      console.error('Failed to load dataset:', error);
      throw error;
    });
}
```

### Example 3: Error Handling

```javascript
var result = DM4.dataset.normalize(userProvidedData);

// Check for normalization errors
if (result._normalizationErrors && result._normalizationErrors.length > 0) {
  console.warn('Dataset has ' + result._normalizationErrors.length + ' issues:');
  result._normalizationErrors.forEach(function(err) {
    console.warn('  - System ' + err.systemId + ': ' + err.message);
  });
  
  // Decide whether to proceed or show error to user
  if (result._normalizationErrors.length > 10) {
    alert('Dataset has significant errors. Please review and fix.');
    return;
  }
}

// Continue with normalized data
renderMap(result);
```

### Example 4: Cache Management

```javascript
// Check cache size periodically
function monitorCache() {
  var stats = DM4.dataset.getCacheStats();
  console.log('Cache contains ' + stats.size + ' datasets');
  
  // Clear cache if it gets too large
  if (stats.size > 50) {
    console.log('Cache limit reached, clearing...');
    DM4.dataset.clearCache();
  }
}

// Run monitor every 5 minutes
setInterval(monitorCache, 5 * 60 * 1000);
```

### Example 5: Validation Usage

```javascript
function validateSystemData(system) {
  var isValid = true;
  
  // Validate coords
  isValid = DM4.Logger.validate(
    system.coords && Array.isArray(system.coords) && system.coords.length === 2,
    'System coords must be [x, y] array'
  ) && isValid;
  
  // Validate grid
  isValid = DM4.Logger.validate(
    !system.grid || (system.grid.col && system.grid.row),
    'System grid must have col and row'
  ) && isValid;
  
  return isValid;
}
```

## Maintenance Notes

### Code Duplication

The normalization logic exists in two places:
1. `src/core/dm4-dataset-core.js` - Main thread implementation
2. `src/core/dataset-normalizer.worker.js` - Worker implementation

**IMPORTANT:** When modifying the normalization algorithm, update BOTH files to maintain consistency.

### Testing

The test suite includes:
- **dm4-dataset-core.test.js** - Original tests (15 tests)
- **dm4-dataset-core-enhanced.test.js** - Enhanced feature tests (16 tests)
- **dm4-dataset-core-integration.test.js** - Integration tests (11 tests)

Run tests with: `npm test`

### Performance Benchmarks

Target performance benchmarks:
- Small datasets (< 100 systems): < 10ms
- Medium datasets (100-500 systems): < 50ms
- Large datasets (500+ systems): < 200ms sync, < 100ms async
- Cache hit: < 1ms

---

**Last Updated:** 2024
**Version:** 2.0
**Module:** dm4-dataset-core.js
