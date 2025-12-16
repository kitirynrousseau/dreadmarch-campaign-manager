# Contributing to Dreadmarch Campaign Manager

Thank you for your interest in contributing to the Dreadmarch Campaign Manager! This guide will help you get started with development and understand our contribution workflow.

## Table of Contents

- [Project Setup](#project-setup)
- [Running the Application](#running-the-application)
- [Development Workflow](#development-workflow)
- [Testing Guidelines](#testing-guidelines)
- [Development Standards](#development-standards)
- [Pull Request Process](#pull-request-process)
- [Code of Conduct](#code-of-conduct)

## Project Setup

### Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v14 or higher)
- **npm** (v6 or higher)
- A modern web browser (Chrome, Firefox, Safari, or Edge)

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/kitirynrousseau/dreadmarch-campaign-manager.git
   cd dreadmarch-campaign-manager
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Verify installation**:
   ```bash
   npm test
   ```

### Running the Application

The Dreadmarch Campaign Manager is a client-side web application:

1. **Open the application**:
   - Open `index.html` in your web browser directly, or
   - Use a local web server (recommended):
     ```bash
     # Using Python 3
     python3 -m http.server 8000
     
     # Using Node.js http-server
     npx http-server -p 8000
     ```
   - Navigate to `http://localhost:8000` in your browser

2. **Debug mode**:
   - The application supports debug mode via the `DM4.config.debug` flag
   - Debug logging provides additional console output for troubleshooting

## Development Workflow

### Branching Strategy

1. **Create a feature branch** from `main`:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes** following the development standards below

3. **Commit your changes** with descriptive messages:
   ```bash
   git add .
   git commit -m "Add brief description of changes"
   ```

4. **Push to your fork**:
   ```bash
   git push origin feature/your-feature-name
   ```

5. **Open a Pull Request** on GitHub

### Branch Naming Conventions

- Feature branches: `feature/descriptive-name`
- Bug fixes: `bugfix/issue-description`
- Documentation: `docs/what-you-changed`
- Refactoring: `refactor/area-refactored`

## Testing Guidelines

### Running Tests

The project uses [Jest](https://jestjs.io/) as the testing framework with jsdom for browser environment simulation.

```bash
# Run all tests
npm test

# Run tests in watch mode (auto-rerun on file changes)
npm run test:watch

# Run tests with coverage report
npm run test:coverage
```

### Writing Tests

When adding new features or fixing bugs:

1. **Create test files** in the `src/tests/` directory
2. **Follow the naming convention**: `module-name.test.js`
3. **Import modules** from their new locations in `src/core/`, `src/components/`, or `src/utils/`
4. **Use descriptive test names** that explain what is being tested
5. **Follow the Arrange-Act-Assert pattern**:
   ```javascript
   test('should do something specific', () => {
     // Arrange - Set up test data and conditions
     const input = 'test data';
     
     // Act - Execute the code being tested
     const result = myFunction(input);
     
     // Assert - Verify the results
     expect(result).toBe('expected output');
   });
   ```

### Test Coverage

- Aim for high test coverage on core modules
- Focus on testing:
  - Edge cases and error handling
  - State management behavior
  - Dataset normalization logic
  - UI component interactions

### Browser Module Testing Notes

Browser modules use the IIFE (Immediately Invoked Function Expression) pattern and require special test setup:

- Set up `global.window` in `beforeAll`, not `beforeEach`
- Clean up in `afterAll`, not `afterEach`
- See existing tests in `src/tests/` for examples

## Development Standards

### File Organization

The repository follows a clear directory structure:

```
src/
├── core/          # Core application logic and state management
├── components/    # UI components (panels, controls, map layers)
├── utils/         # Utility functions (style helpers, etc.)
├── tests/         # Test files
└── styles/        # CSS stylesheets
```

#### When Creating New Files

- **Core modules**: Place in `src/core/` if it's fundamental to app operation
- **UI components**: Place in `src/components/` for panels, UI controls, or visual elements
- **Utilities**: Place in `src/utils/` for helper functions
- **Tests**: Place in `src/tests/` with a `.test.js` suffix
- **Styles**: Place in `src/styles/` with kebab-case naming

### Code Style

#### JavaScript

- **ES5 syntax** is used for browser compatibility (no `const`, `let`, `=>` in production modules)
- **Use `var` and `function` declarations** in core modules
- **Strict mode**: Use `"use strict";` at the top of function scopes
- **IIFE pattern** for module encapsulation:
  ```javascript
  ;(function () {
    "use strict";
    // Module code here
  })();
  ```

#### Naming Conventions

**Files:**
- **Core modules**: `dm4-module-name.js` (e.g., `dm4-state.js`, `dm4-logger.js`)
- **Panel components**: `dm4-panels-name.js` (e.g., `dm4-panels-identity.js`)
- **UI components**: `dm4-ui-name.js` (e.g., `dm4-ui-controlbar.js`)
- **Tests**: `module-name.test.js` (e.g., `dm4-state.test.js`)
- **Stylesheets**: `kebab-case.css` (e.g., `dm-style-palette-e2.css`)

**Code:**
- **Variables and functions**: `camelCase`
- **Constants**: `UPPER_SNAKE_CASE` (e.g., `DM4_DEBUG`)
- **Function prefixes**:
  - `create*` - Factory functions that create and return objects
  - `init*` - Initialization functions that set up components
  - `render*` - Functions that generate or update DOM
  - `handle*` - Event handler functions

#### Module Structure

All modules must attach to the shared `DM4` namespace:

```javascript
if (!window.DM4) {
  window.DM4 = {};
}
var DM4 = window.DM4;
```

### Logging Standards

- **Use DM4.Logger** for all diagnostic messages
- **Never use direct `console.*` calls** (except for critical errors during bootstrap)
- Logger levels:
  - `Logger.info()` - General information
  - `Logger.warn()` - Warnings and non-critical issues
  - `Logger.error()` - Recoverable errors
  - `Logger.critical()` - Critical errors requiring fallback handling

### Commenting Guidelines

#### When to Add Comments

- **Complex algorithms**: Explain the logic and approach
- **Non-obvious code**: Clarify intent when code isn't self-documenting
- **Business logic**: Document domain-specific rules and constraints
- **Function headers**: Use structured comments for key functions:
  ```javascript
  // DM4_CORE_FUNCTION: functionName
  // Description of what the function does
  function functionName() {
    // Implementation
  }
  ```

#### When NOT to Add Comments

- **Self-explanatory code**: Well-named variables and functions don't need comments
- **Obvious operations**: Don't state what the code already clearly shows
- **Redundant descriptions**: Comments should add value, not repeat code

### Dataset and State Management

#### Dataset Rules

1. All dataset mutations must use strict editor jobs and patch logic
2. Never infer missing system or route data
3. Never introduce new schema fields without explicit approval
4. Do not recalculate endpoints, routes, or structure unless explicitly requested

#### State Management

1. **Immutability**: Always create new state objects, never mutate existing state
2. **Scoped subscriptions**: Use `scopePath` parameter for targeted updates
3. **Batch notifications**: State changes are batched with a 10ms delay
4. **Subscriber pattern**: Use `subscribe()` to listen for state changes

### UI and Style Standards

#### Text Roles

Only use approved text-role classes:
- `.dm-text-title` - For title text
- `.dm-text-header` - For header text  
- `.dm-text-body` - For body text

No ad-hoc text styles should be introduced.

#### Palette Variables

- Use CSS custom properties (variables) for colors
- No inline styles with hard-coded colors
- All color values must reference the palette

### Error Handling

1. **Validate inputs** at function boundaries
2. **Provide fallbacks** for critical errors using `Logger.critical()`
3. **Fail gracefully** - Log errors but keep the application functional
4. **Clear error messages** - Include context and actionable information

## Pull Request Process

### Before Submitting

1. **Run tests**: Ensure all tests pass (`npm test`)
2. **Test manually**: Verify your changes work in a browser
3. **Check code style**: Follow the development standards above
4. **Update documentation**: Add/update relevant documentation
5. **Review your changes**: Do a self-review of your code

### PR Description

Your pull request should include:

1. **Summary**: Brief description of what changed and why
2. **Changes**: List of specific changes made
3. **Testing**: How you tested the changes
4. **Screenshots**: If UI changes are involved, include before/after screenshots
5. **Related Issues**: Reference any related issue numbers

### Code Review

- Be responsive to feedback and questions
- Make requested changes promptly
- Ask for clarification if feedback is unclear
- Keep discussions professional and constructive

### Merging

- PRs require approval from a maintainer before merging
- All tests must pass
- No merge conflicts should exist
- The PR will be squash-merged into `main`

## Code of Conduct

### Our Standards

- **Be respectful**: Treat all contributors with respect and kindness
- **Be collaborative**: Work together to find the best solutions
- **Be patient**: Help newcomers learn and grow
- **Be constructive**: Provide helpful feedback and suggestions

### Unacceptable Behavior

- Harassment, discrimination, or offensive comments
- Trolling, insulting, or derogatory remarks
- Publishing others' private information
- Other unprofessional conduct

### Reporting

If you experience or witness unacceptable behavior, please contact the project maintainers.

## Questions?

If you have questions not covered in this guide:

1. Check the [README.md](README.md) for general project information
2. Review the [Architecture documentation](docs/architecture.md)
3. Look at existing code and tests for examples
4. Open an issue for discussion

Thank you for contributing to Dreadmarch Campaign Manager!
