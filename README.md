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
A campaign manager app for tabletop RPGs, designed to assist Game Masters (GMs) and players with real-time collaboration, state management, user-configurable datasets, and in-game asset tracking.

## Features

- **Web-Hosted**: Accessible online for real-time GM/player collaboration
- **Key-Based Access Control**: Define user roles for dynamically adjusted permissions
- **Asset Management System**: Tools for tracking, buying, and requesting assets tied to the game world
- **State Management**: Centralized state management with subscription-based updates
- **Dataset Normalization**: Robust handling of galactic system data

## Development

### Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)

### Installation

```bash
npm install
```

### Running Tests

This project uses [Jest](https://jestjs.io/) as the testing framework.

#### Run all tests

```bash
npm test
```

#### Run tests in watch mode

Watch mode will automatically re-run tests when files change:

```bash
npm run test:watch
```

#### Run tests with coverage

Generate a coverage report to see how much of the code is covered by tests:

```bash
npm run test:coverage
```

Coverage reports will be generated in the `coverage/` directory.

### Test Structure

Tests are located in the `__tests__/` directory and follow the naming convention `*.test.js`.

Current test coverage includes:

- **dm4-dataset-core.test.js**: Tests for dataset normalization functionality
  - Valid dataset normalization with systems, pixels, grids, and sectors
  - Invalid input handling (null, undefined, non-objects)
  - Edge cases (null values, multiple sectors, empty arrays)

- **dm4-state.test.js**: Tests for state manager behavior
  - State manager creation and initialization
  - Subscribe and notify patterns
  - State actions (selectSystem, setMode, setDataset, setCampaign, setAccess)
  - Editor state management
  - State immutability

### Writing Tests

When adding new features:

1. Create a test file in `__tests__/` with the `.test.js` extension
2. Import or require the module you want to test
3. Write test cases using Jest's `describe` and `test` functions
4. Run tests to ensure they pass

Jest configuration is managed in `jest.config.js` at the root of the project.

Example test structure:

```javascript
describe('My Module', () => {
  test('should do something', () => {
    // Arrange
    const input = 'test';
    
    // Act
    const result = myFunction(input);
    
    // Assert
    expect(result).toBe('expected output');
  });
});
```

## Project Structure

```
.
├── __tests__/              # Test files
├── dm4-dataset-core.js     # Dataset normalization module
├── dm4-state.js            # State management module
├── dm4-map-layers.js       # Map layer rendering
├── dm4-panels-*.js         # UI panel components
├── index.html              # Main application entry point
└── package.json            # Project configuration and dependencies
```

## License

ISC
