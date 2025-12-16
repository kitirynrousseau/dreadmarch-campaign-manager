# Dreadmarch Campaign Manager

A modular, offline-capable galactic campaign viewer and editor for Star Wars tabletop campaigns.

## Features

- **Interactive Galactic Map**: Browse star systems, hyperlanes, and sectors
- **Campaign State Management**: Track faction control, actors, and resources
- **Live Editor**: Make changes to the dataset and export patches
- **Dataset Normalization**: Robust handling of galactic system data with intelligent caching and optional Web Worker offloading for large datasets
- **Style Contracts**: Enforce consistent UI styling across all panels
- **Modular Architecture**: Clean separation between state, UI, map, and editor concerns

## Architecture

The viewer is built on a modular architecture with the following core modules:

### Core Modules

All modules are now organized in the `src/` directory:

- **src/core/dm4-runtime.js**: Establishes the DM4 namespace and core configuration
- **src/core/dm4-logger.js**: Centralized logging utility with validate() method
- **src/core/dm4-dataset-core.js**: Dataset normalization with caching & Web Worker support
- **src/core/dataset-normalizer.worker.js**: Web Worker for async dataset normalization
- **src/core/dm4-state.js**: Application state manager with scoped subscriptions
- **src/utils/dm4-style-core.js**: Style contract enforcement and validation
- **src/components/dm4-map-layers.js**: Map rendering (systems, labels, routes, graticule)
- **src/components/dm4-panels-registry.js**: Panel lifecycle management
- **src/components/dm4-panels-editor.js**: Dataset editing and DB5 patch system
- **src/components/dm4-ui-controlbar.js**: Top-level control bar UI
- **src/components/dreadmarch-viewer4.js**: Main viewer bootstrap and integration

### Module Loading Order

Modules must be loaded in the following order (enforced in `index.html`):

1. src/core/dm4-runtime.js
2. src/core/dm4-logger.js
3. src/core/dm4-dataset-core.js
4. src/core/dm4-dataset-main.js
5. src/utils/dm4-style-core.js
6. src/core/dm4-state.js
7. src/components/dm4-map-layers.js
8. src/components/dm4-panels-identity.js
9. src/components/dm4-panels-test.js
10. src/components/dm4-panels-registry.js
11. src/components/dm4-panels-editor.js
12. src/components/dm4-ui-controlbar.js
13. src/components/dreadmarch-viewer4.js

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

## Table of Contents

- [Features](#features)
- [Getting Started](#getting-started)
- [Development](#development)
- [Documentation](#documentation)
- [Project Structure](#project-structure)
- [Contributing](#contributing)
- [License](#license)

## Features

- **Web-Hosted**: Accessible online for real-time GM/player collaboration
- **Interactive Galactic Map**: Visual representation of star systems, routes, and sectors
- **Key-Based Access Control**: Define user roles for dynamically adjusted permissions
- **Asset Management System**: Tools for tracking, buying, and requesting assets tied to the game world
- **State Management**: Centralized state management with subscription-based updates and scoped notifications
- **Dataset Normalization**: Robust handling of galactic system data with automatic consolidation
- **Extensible Architecture**: Modular design allows easy addition of new panels, actions, and layers

## Getting Started

### Prerequisites

- **Node.js** (v14 or higher)
- **npm** (v6 or higher)
- A modern web browser (Chrome, Firefox, Safari, or Edge)

### Quick Start

1. **Clone the repository**:
   ```bash
   git clone https://github.com/kitirynrousseau/dreadmarch-campaign-manager.git
   cd dreadmarch-campaign-manager
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Run tests** to verify installation:
   ```bash
   npm test
   ```

4. **Open the application**:
   - Open `index.html` directly in your browser, or
   - Use a local web server (recommended):
     ```bash
     # Using Python 3
     python3 -m http.server 8000
     
     # Using Node.js http-server
     npx http-server -p 8000
     ```
   - Navigate to `http://localhost:8000`

For detailed setup instructions and contribution guidelines, see [CONTRIBUTING.md](CONTRIBUTING.md).

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

Tests are located in the `src/tests/` directory and follow the naming convention `*.test.js`.

Current test coverage includes:

- **src/tests/dm4-dataset-core.test.js**: Tests for dataset normalization functionality
  - Valid dataset normalization with systems, pixels, grids, and sectors
  - Invalid input handling (null, undefined, non-objects)
  - Edge cases (null values, multiple sectors, empty arrays)

- **src/tests/dm4-state.test.js**: Tests for state manager behavior
  - State manager creation and initialization
  - Subscribe and notify patterns
  - State actions (selectSystem, setMode, setDataset, setCampaign, setAccess)
  - Editor state management
  - State immutability

### Writing Tests

When adding new features:

1. Create a test file in `src/tests/` with the `.test.js` extension
2. Import or require the module you want to test from `src/core/`, `src/components/`, or `src/utils/`
3. Write test cases using Jest's `describe` and `test` functions
4. Run tests to ensure they pass

Jest configuration is managed in `jest.config.js` at the root of the project.

### API Documentation

- **Dataset Normalization API** - Comprehensive guide to the enhanced dataset normalization system including caching, Web Worker support, error handling, and performance considerations. See [docs/dataset-normalization-api.md](docs/dataset-normalization-api.md)

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

## Documentation

### Core Documentation

- **[Architecture Overview](docs/architecture.md)** - High-level system architecture, module interactions, and data flow
- **[Contributing Guidelines](CONTRIBUTING.md)** - How to contribute, development standards, and workflow
- **[Development Protocol](Dreadmarch_Development_Protocol_v1.5.txt)** - Detailed technical protocol and rules

### Key Concepts

- **State Management**: Centralized state with immutable updates, scoped subscriptions, and batch notifications
- **Dataset Normalization**: Automatic consolidation of system data from multiple sources
- **Module System**: Namespace-based IIFE modules for clean separation of concerns
- **Panel Contract**: Consistent interface for UI components (`render()` and `destroy()`)

### Quick Links

- [How to add a new panel](docs/architecture.md#adding-a-new-panel)
- [How to add a new state action](docs/architecture.md#adding-a-new-state-action)
- [Understanding the data flow](docs/architecture.md#data-flow)
- [Module loading order](docs/architecture.md#module-loading-order)

## Project Structure

The repository is organized into a clear directory structure for improved maintainability:

```
.
├── src/                        # Source code
│   ├── core/                   # Core application logic
│   │   ├── dm4-runtime.js      # Runtime initialization
│   │   ├── dm4-logger.js       # Centralized logging (with validate method)
│   │   ├── dm4-dataset-core.js # Dataset normalization (with caching & Web Worker)
│   │   ├── dataset-normalizer.worker.js  # Web Worker for async normalization
│   │   ├── dm4-dataset-main.js # Main dataset definitions
│   │   └── dm4-state.js        # State management
│   ├── components/             # UI Components
│   │   ├── dm4-panels-identity.js  # System identity panel
│   │   ├── dm4-panels-editor.js    # Dataset editor panel
│   │   ├── dm4-panels-test.js      # Test panel
│   │   ├── dm4-panels-registry.js  # Panel management
│   │   ├── dm4-ui-controlbar.js    # Control bar UI
│   │   ├── dm4-map-layers.js       # Map layer rendering
│   │   └── dreadmarch-viewer4.js   # Main application
│   ├── utils/                  # Utility functions
│   │   └── dm4-style-core.js   # Style and palette management
│   ├── tests/                  # Test files
│   │   ├── dm4-dataset-core.test.js
│   │   ├── dm4-dataset-core-enhanced.test.js
│   │   ├── dm4-dataset-core-integration.test.js
│   │   ├── dm4-state.test.js
│   │   └── dm4-state-test.html
│   └── styles/                 # CSS stylesheets
│       └── dm-style-palette-e2.css
├── docs/                       # Documentation
│   ├── architecture.md         # Architecture overview
│   └── dataset-normalization-api.md  # Dataset normalization API docs
├── archive/                    # Archived legacy files
├── index.html                  # Application entry point
├── package.json                # Project configuration
├── jest.config.js              # Jest configuration
├── CONTRIBUTING.md             # Contribution guidelines
└── README.md                   # This file
```

### File Naming Conventions

- **Core modules**: `dm4-*.js` prefix for core functionality
- **Components**: `dm4-panels-*.js` for panel components, `dm4-ui-*.js` for UI controls
- **Tests**: `*.test.js` suffix for test files
- **Styles**: `kebab-case.css` for stylesheets


## Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for:

- Development setup and workflow
- Coding standards and conventions
- Testing guidelines
- Pull request process
- Code of conduct

Key points:
- Run `npm test` before submitting
- Follow ES5 syntax for browser compatibility
- Use the DM4.Logger for all diagnostic messages
- Write tests for new features
- Update documentation when making architectural changes

## License

ISC
