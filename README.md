# Dreadmarch Campaign Manager

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
