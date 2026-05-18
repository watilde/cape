---
type: input
---

# Development Standards for StyleToDo

## Coding Standards

### Language Rules

TypeScript must be used for all application code with strict mode enabled. All files must use the `.ts` or `.tsx` extension. The following TypeScript compiler options are mandatory:

- `strict: true`
- `noImplicitAny: true`
- `strictNullChecks: true`
- `strictFunctionTypes: true`
- `noUnusedLocals: true`
- `noUnusedParameters: true`

All code must target ES2020 or later. Use const by default, let when reassignment is necessary, and avoid var entirely. Function declarations should use arrow functions for callbacks and functional components, and named function declarations for React components when readability benefits from named exports.

### Architectural Constraints

The application follows a component-based React architecture with functional components as the standard pattern. Components must be organized in the following directory structure:

```
src/
  components/
    TodoList/
    TodoItem/
    TodoForm/
    StyleButton/
    StyleInput/
  hooks/
  services/
    storageService.ts
  types/
    todo.ts
  styles/
```

React hooks must be used for state management within components. LocalStorage interactions must be abstracted into a dedicated `storageService.ts` module. All data types must be defined in the `types/` directory using interfaces or types.

Component props must be defined as interfaces, never as inline types. Custom hooks must be prefixed with `use` and stored in the `hooks/` directory.

### Validation Policy

All user input from the TodoForm component must be validated before storage:

- Todo titles must be non-empty strings with minimum length of 1 character and maximum length of 200 characters
- Todo descriptions (if implemented) must not exceed 1000 characters
- All input must be trimmed of leading and trailing whitespace
- Invalid input must trigger user-friendly error messages displayed in the UI
- Completed status must be boolean values only
- Timestamps must be valid ISO 8601 date strings

LocalStorage operations must validate data structure on retrieval to prevent corruption from manual browser storage edits. If stored data does not match the expected schema, the application must reset to empty state and notify the user.

### Comment Policy

Code comments must be written in English. Comments should explain the "why" rather than the "what" — the code itself should be clear enough to express the "what". Comments are required for:

- Complex business logic that is not immediately obvious
- Non-intuitive workarounds or hacks with explanation of why they were necessary
- Public function and component documentation using JSDoc format
- TODO items that represent incomplete work, formatted as `// TODO: [description] (YYYY-MM-DD)`

JSDoc comments are mandatory for all exported functions, components, and custom hooks using this format:

```typescript
/**
 * Adds a new todo item to the list
 * @param title - The title of the todo item (required, max 200 characters)
 * @returns The newly created todo object with generated ID and timestamp
 */
```

## Testing Expectations

### Unit Testing

All utility functions and custom hooks must have unit test coverage with minimum 80% line coverage. Tests for utility functions like input validation, data transformation, and storage helpers are mandatory.

Custom hooks must be tested using React Testing Library's hooks utilities. Mock LocalStorage for unit tests to avoid test pollution and ensure test isolation.

### Integration Testing

React components that manage todo state or interact with LocalStorage must have integration tests verifying:

- Todo items are rendered correctly from stored data
- User interactions (adding, completing, deleting todos) update both component state and LocalStorage
- Error states are displayed when storage operations fail
- Data persists correctly across component remounts

Integration tests should use React Testing Library to render components and userEvent to simulate user interactions.

### End-to-End Testing

End-to-end tests must verify the complete user workflow:

- User can add a new todo item with a title
- User can mark a todo as complete and see visual feedback
- User can delete a todo item
- Todos persist after page refresh
- Cute styling elements render without errors
- Application loads correctly with no console errors

E2E tests should cover the happy path for the primary use case and common error scenarios like localStorage being unavailable.

## Tooling

### Language

TypeScript 5.0 or later is the required language. All JavaScript files must be migrated to TypeScript. No JavaScript files are permitted in the src directory except for configuration files.

### Test Runner

Jest must be used as the test runner with the following configuration:

- Test files must be named with `.test.ts` or `.test.tsx` suffix
- Snapshot tests are permitted for component rendering but must be reviewed carefully
- Coverage thresholds: minimum 80% for statements, branches, and functions
- Jest must be configured to handle TypeScript files via ts-jest preset

### Linter

ESLint must be used with the following plugins:

- `@typescript-eslint/eslint-plugin` for TypeScript-specific rules
- `eslint-plugin-react` with React 18+ settings
- `eslint-plugin-react-hooks` to enforce hooks rules
- `eslint-plugin-prettier` for code formatting integration

The ESLint configuration must enforce:

- No unused variables or imports
- Consistent naming conventions (camelCase for functions/variables, PascalCase for components)
- No console.log statements in production code
- Required prop validation for all components
- Hooks dependency array completeness

### Continuous Integration

GitHub Actions must run on every pull request with these checks:

- TypeScript compilation with strict mode (`tsc --noEmit`)
- ESLint validation with no warnings allowed
- Jest test suite with coverage reporting
- Build verification to ensure production bundle generates without errors

The CI pipeline must block merging if any check fails.

### Key Commands

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run TypeScript compiler in watch mode
npm run type-check

# Run linter
npm run lint

# Fix linting errors automatically
npm run lint:fix

# Run all tests in watch mode
npm run test

# Run tests with coverage report
npm run test:coverage

# Build for production
npm run build

# Run E2E tests (if applicable)
npm run test:e2e
```

