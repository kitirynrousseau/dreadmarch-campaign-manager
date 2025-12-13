# Dreadmarch Campaign Manager

A modular, offline-capable galactic campaign viewer and editor for Star Wars tabletop campaigns.

## Features

- **Interactive Galactic Map**: Browse star systems, hyperlanes, and sectors
- **Campaign State Management**: Track faction control, actors, and resources
- **Live Editor**: Make changes to the dataset and export patches
- **Style Contracts**: Enforce consistent UI styling across all panels
- **Modular Architecture**: Clean separation between state, UI, map, and editor concerns

## Architecture

The viewer is built on a modular architecture with the following core modules:

### Core Modules

- **dm4-runtime.js**: Establishes the DM4 namespace and core configuration
- **dm4-logger.js**: Centralized logging utility (see below)
- **dm4-dataset-core.js**: Dataset normalization and validation
- **dm4-state.js**: Application state manager with scoped subscriptions
- **dm4-style-core.js**: Style contract enforcement and validation
- **dm4-map-layers.js**: Map rendering (systems, labels, routes, graticule)
- **dm4-panels-registry.js**: Panel lifecycle management
- **dm4-panels-editor.js**: Dataset editing and DB5 patch system
- **dm4-ui-controlbar.js**: Top-level control bar UI
- **dreadmarch-viewer4.js**: Main viewer bootstrap and integration

### Module Loading Order

Modules must be loaded in the following order (enforced in `index.html`):

1. dm4-runtime.js
2. dm4-logger.js
3. dm4-dataset-core.js
4. dm4-dataset-main.js
5. dm4-style-core.js
6. dm4-state.js
7. dm4-map-layers.js
8. dm4-panels-identity.js
9. dm4-panels-test.js
10. dm4-panels-registry.js
11. dm4-panels-editor.js
12. dm4-ui-controlbar.js
13. dreadmarch-viewer4.js

## Logging Standards

All diagnostic messages use the centralized `DM4.Logger` utility instead of direct `console.*` calls.

### Logger Methods

#### `DM4.Logger.log(message, ...args)`
General-purpose log messages for informational output.

```javascript
DM4.Logger.log("Viewer initialized successfully");
DM4.Logger.log("Dataset loaded:", datasetId);
```

#### `DM4.Logger.warn(message, ...args)`
Warnings about recoverable issues that don't prevent the application from functioning.

```javascript
DM4.Logger.warn("[STATE] Attempt to set unknown mode:", mode);
DM4.Logger.warn("Missing coords for system:", systemId);
```

#### `DM4.Logger.error(message, ...args)`
Non-fatal errors requiring developer attention but allowing the application to continue.

```javascript
DM4.Logger.error("[STYLE] Missing required CSS variable:", varName);
DM4.Logger.error("[EDITOR] Failed to export jobs:", error);
```

#### `DM4.Logger.critical(message, fallbackFn, ...args)`
Critical errors that require a fallback mechanism to keep the application running.

```javascript
// Fallback to empty dataset if normalization fails
var normalized = DM4.Logger.critical(
  "normalizeDataset: empty or invalid raw dataset",
  function() {
    return { systems: {} };
  }
);

// Fallback to empty dataset if missing from registry
if (!dataset) {
  DM4.Logger.critical("No dataset found for id: " + datasetId, function() {
    return { systems: {} };
  });
  dataset = { systems: {} };
}
```

### Message Format

- Logger automatically prefixes all messages with `[DREADMARCH]`
- Module-specific prefixes should be included in the message (e.g., `[STATE]`, `[EDITOR]`, `[PANEL]`)
- This creates a consistent format: `[DREADMARCH] [MODULE] message`

### Best Practices

1. **Always use Logger**: Never use `console.*` directly in application code
2. **Provide fallbacks for critical errors**: Use `Logger.critical()` when a safe default can be returned
3. **Include context**: Pass relevant variables as additional arguments
4. **Guard debug-only logs**: Use `if (DM4_DEBUG)` for verbose diagnostic output
5. **Keep messages actionable**: Include enough detail for developers to diagnose issues

## Development Protocol

See `Dreadmarch_Development_Protocol_v1.5.txt` for comprehensive development guidelines including:

- Core governance rules
- Dataset mutation rules
- Viewer architecture requirements
- UI and style contracts
- Editor and mutation workflows
- Modularization standards
- Logging standards (Section 8)

## Getting Started

1. Open `index.html` in a modern web browser
2. The viewer will load the default dataset (`arbra`)
3. Use the control bar to switch between modes:
   - **NAVCOM**: Navigation and exploration mode
   - **EDITOR**: Dataset editing mode
4. Click systems to view details in the right panel
5. In EDITOR mode, make changes and export patched datasets

## Browser Compatibility

The viewer is designed to work offline in modern browsers supporting:
- ES6 JavaScript features
- SVG rendering
- CSS custom properties
- Fetch API (for online features, if enabled)

Tested browsers:
- Chrome/Edge 90+
- Firefox 88+
- Safari 14+

## License

(License information to be added)

## Contributing

(Contribution guidelines to be added)
