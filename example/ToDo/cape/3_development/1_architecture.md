---
type: input
---

# ToDoアプリ Architecture Documentation

## System North Star

### Goals
- **Aesthetic-First Task Management**: Deliver a visually delightful todo experience that makes task management feel like personal expression rather than obligation
- **Seamless Offline Capability**: Enable stylish todo management without requiring internet connectivity, leveraging LocalStorage for persistence
- **Performance Excellence**: Achieve sub-100ms interaction latency for all UI interactions to support smooth, responsive animations and transitions
- **Youth Appeal**: Create an interface that resonates with fashion-conscious young users through contemporary design patterns, smooth micro-interactions, and cultural relevance

### Tradeoffs Made
- **LocalStorage over Backend**: Prioritized immediate offline availability and installation simplicity over multi-device synchronization. Users own their data locally without server dependencies.
- **React Component Complexity**: Accepted increased component lifecycle management complexity to enable sophisticated animations and state transitions that define the "cute" aesthetic.
- **TypeScript Strictness**: Enforced full TypeScript compilation without `any` types to catch styling and data flow errors early, trading development speed for reliability.
- **No Real-time Sync**: Eliminated cloud synchronization in v1 to reduce infrastructure complexity and ensure 100% offline functionality. Device-local data is the source of truth.

---

## Layer Architecture

```
┌─────────────────────────────────────────────────────────┐
│         Presentation Layer (React Components)            │
│  ┌─────────────────────────────────────────────────────┐ │
│  │ Pages (TodoList, Settings) & Feature Components     │ │
│  │ (AddTodoForm, TodoCard, FilterBar)                  │ │
│  └─────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
                        ↕
┌─────────────────────────────────────────────────────────┐
│          State Management Layer (React Context)          │
│  ┌─────────────────────────────────────────────────────┐ │
│  │ TodoContext, FilterContext, UiStateContext          │ │
│  │ (Manages application state & event dispatch)        │ │
│  └─────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
                        ↕
┌─────────────────────────────────────────────────────────┐
│         Domain Logic Layer (Business Rules)              │
│  ┌─────────────────────────────────────────────────────┐ │
│  │ TodoService, FilterLogic, ValidationRules          │ │
│  │ (Core todo operations & filtering algorithms)       │ │
│  └─────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
                        ↕
┌─────────────────────────────────────────────────────────┐
│       Data Persistence Layer (LocalStorage)              │
│  ┌─────────────────────────────────────────────────────┐ │
│  │ StorageAdapter, TodoRepository                      │ │
│  │ (CRUD operations on browser storage)                │ │
│  └─────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

---

## 5 Core Modules with Responsibilities

### 1. TodoCore Module
**Responsibility**: Manage todo item lifecycle and data model

**Key Functions**:
- Create new todo items with title, description, emoji indicators, and due dates
- Update todo properties (title, completion status, emoji, due date)
- Delete todo items with soft-delete capability for undo operations
- Validate todo data structure before persistence
- Generate unique todo identifiers using timestamp-based UUIDs

**Exports**:
```typescript
createTodo(title: string, emoji: string): Todo
updateTodo(id: string, updates: Partial<Todo>): Todo
deleteTodo(id: string): void
validateTodoData(data: unknown): data is Todo
```

**Dependencies**: None (pure domain logic)

---

### 2. StorageAdapter Module
**Responsibility**: Abstract LocalStorage operations and handle data serialization/deserialization

**Key Functions**:
- Initialize storage schema with version tracking for future migrations
- Persist todo array to browser LocalStorage with JSON serialization
- Retrieve complete todo collection from LocalStorage on app startup
- Clear all todos with confirmation for data reset functionality
- Handle storage quota errors gracefully with user notifications
- Detect and recover from corrupted storage data

**Exports**:
```typescript
initializeStorage(): void
saveTodos(todos: Todo[]): void
loadTodos(): Todo[]
clearAllTodos(): void
getStorageStats(): { used: number; available: number }
```

**Dependencies**: TodoCore Module (for validation)

---

### 3. TodoRepository Module
**Responsibility**: Provide high-level data access patterns with business logic integration

**Key Functions**:
- Retrieve all todos with optional filtering by status, emoji category, or due date
- Get single todo by ID for detail views
- Persist new todos and automatically save to storage
- Apply transactions for multi-step operations (create + update)
- Maintain in-memory cache of todos for performance
- Sync in-memory state with LocalStorage on every mutation

**Exports**:
```typescript
getAllTodos(): Todo[]
getTodoById(id: string): Todo | null
addTodo(todo: Todo): void
updateTodo(id: string, updates: Partial<Todo>): void
removeTodo(id: string): void
getTodosByStatus(status: 'active' | 'completed'): Todo[]
getTodosByEmoji(emoji: string): Todo[]
```

**Dependencies**: StorageAdapter Module, TodoCore Module

---

### 4. FilteringEngine Module
**Responsibility**: Implement sophisticated filtering and sorting for the todo list view

**Key Functions**:
- Filter todos by completion status (active, completed, all)
- Filter by emoji categories (work, personal, urgent, celebration, etc.)
- Filter by due date ranges (today, tomorrow, overdue, this week)
- Combine multiple filters with AND logic
- Sort todos by creation date, due date, or completion status
- Search todos by title and description with fuzzy matching
- Persist user's preferred filter/sort settings to localStorage

**Exports**:
```typescript
applyFilters(todos: Todo[], filters: FilterConfig): Todo[]
sortTodos(todos: Todo[], sortBy: 'date' | 'due' | 'status'): Todo[]
searchTodos(todos: Todo[], query: string): Todo[]
getFilteredAndSorted(todos: Todo[], config: CompleteFilterConfig): Todo[]
```

**Dependencies**: TodoRepository Module

---

### 5. UIStateManager Module
**Responsibility**: Manage transient UI state including animations, modals, notifications, and user interaction feedback

**Key Functions**:
- Track animation state for smooth transitions (entering, exiting, transitioning)
- Manage modal visibility and content (add-todo form, edit form, confirmation dialogs)
- Queue and display toast notifications with auto-dismiss timers
- Track currently selected/focused todo for keyboard navigation
- Manage loading states during async operations
- Persist UI preferences (theme variant, compact mode, sidebar state)
- Handle undo/redo stack for destructive operations

**Exports**:
```typescript
setAnimationState(todoId: string, state: AnimationState): void
openAddTodoModal(): void
closeAddTodoModal(): void
showNotification(message: string, type: 'success' | 'error' | 'info'): void
setSelectedTodo(id: string | null): void
pushUndoAction(action: UndoAction): void
popAndExecuteUndo(): void
```

**Dependencies**: TodoRepository Module (for undo actions)

---

## Data & Event Flow (Step by Step)

### Flow 1: Create New Todo
1. **User Action**: User clicks "Add Todo" button on main page
2. **UI Response**: UIStateManager opens AddTodoModal component, animation state transitions to "entering"
3. **Form Input**: User types title "Meeting with designer", selects work emoji "💼", sets due date for tomorrow
4. **Validation**: AddTodoForm component validates title length (1-100 chars), emoji selection exists
5. **Submission**: User clicks "Create" button, form submission event triggered
6. **Creation**: TodoCore.createTodo() generates new Todo object with UUID, timestamp, default status as "active"
7. **Persistence**: TodoRepository.addTodo() receives new todo object
8. **Storage**: StorageAdapter.saveTodos() serializes entire todo array to JSON, writes to browser LocalStorage
9. **State Update**: TodoContext dispatch action UPDATE_TODOS with new array
10. **Re-render**: React re-renders TodoListView with new todo appearing at top with slide-in animation
11. **Feedback**: UIStateManager triggers toast notification "Task added! 🎉"
12. **Cleanup**: Modal closes, UIStateManager resets animation state to "idle"

### Flow 2: Mark Todo as Complete
1. **User Action**: User clicks checkbox on TodoCard displaying "Meeting with designer"
2. **Visual Feedback**: TodoCard immediately applies strikethrough CSS and fade animation
3. **State Update**: FilterContext updates, dispatch TOGGLE_TODO_COMPLETION event with todo ID
4. **Domain Logic**: TodoRepository.updateTodo() called with id and `{ completed: true, completedAt: timestamp }`
5. **Validation**: TodoCore.validateTodoData() confirms updated todo structure is valid
6. **Persistence**: StorageAdapter.saveTodos() writes updated array to LocalStorage with new completedAt timestamp
7. **Context Sync**: TodoContext receives UPDATE_TODOS action, all subscribers notified
8. **UI Update**: Active todos filter is reapplied automatically, completed todo moves to bottom section
9. **Stats Update**: Todo counter in header updates from "8 active" to "7 active"
10. **Undo Setup**: UIStateManager.pushUndoAction() adds reversible action to undo stack (max 20 actions)

### Flow 3: Filter by Emoji Category
1. **User Action**: User clicks "💼 Work" filter chip in FilterBar component
2. **Filter State**: FilterContext dispatch action SET_ACTIVE_FILTERS with emoji category "work"
3. **Application**: FilteringEngine.applyFilters() receives all todos and filter config { emoji: 'work' }
4. **Processing**: Engine iterates through todos, creates new array containing only work-emoji todos
5. **Sorting**: FilteringEngine.sortTodos() applies default sort (creation date desc)
6. **Context Update**: FilterContext state updates with filtered todos array
7. **Memoization**: React.useMemo prevents unnecessary re-filtering on component re-renders
8. **Rendering**: TodoListView component receives filtered todos via context hook
9. **Visual Feedback**: Filter chip receives active state styling (bold, highlight color)
10. **Persistence**: FilteringEngine saves user's preferred filter to localStorage for session restoration

### Flow 4: Search Todos
1. **User Action**: User types "meeting" in SearchInput component
2. **Debounce**: Input change event is debounced for 300ms to prevent excessive filtering
3. **Query Setup**: FilterContext dispatch SET_SEARCH_QUERY with "meeting"
4. **Search Execution**: FilteringEngine.searchTodos() performs fuzzy matching on all todos
5. **Algorithm**: Matches "meeting" in TodoCard titles and descriptions, calculates relevance scores
6. **Results**: Returns filtered array sorted by relevance (exact title matches first)
7. **Combined Filters**: Results are intersected with active emoji/status filters if any
8. **UI Update**: TodoListView re-renders showing matching todos, non-matching todos fade out
9. **Empty State**: If no matches found, EmptySearchState component displays helpful message
10. **Cache**: Filtered results cached in component state to avoid re-filtering during scroll

### Flow 5: Delete Todo with Undo
1. **User Action**: User clicks delete icon on TodoCard for "Old task"
2. **Confirmation**: ConfirmDeleteModal opens asking "Delete this task?"
3. **Undo Preparation**: UIStateManager.pushUndoAction() creates reversible delete action
4. **State Capture**: Original todo object saved in undo stack
5. **Deletion**: User clicks "Delete", TodoRepository.removeTodo(todoId) called
6. **Domain Update**: TodoCore marks todo as logically deleted (soft delete initially)
7. **Persistence**: StorageAdapter.saveTodos() writes updated array to LocalStorage
8. **Animation**: TodoCard plays slide-out and fade animation (400ms duration)
9. **Context Update**: TodoContext dispatch UPDATE_TODOS, triggers re-render
10. **Undo Option**: Toast notification displays "Task deleted" with undo button visible for 10 seconds
11. **Undo Action**: If user clicks undo, TodoRepository.addTodo() re-inserts original todo
12. **Recovery**: Undo action writes to storage, TodoCard re-appears with slide-in animation

---

## Non-Functional Guardrails

### Security
- **Input Sanitization**: All user-entered text (titles, descriptions) passed through DOMPurify before rendering to prevent XSS attacks
- **LocalStorage Isolation**: Data stored under unique app namespace `todoapp_v1_` to prevent collision with other apps
- **No External APIs**: All functionality contained within single-origin React app, no cross-origin requests, eliminates CORS vulnerabilities
- **Data Validation**: TypeScript strict mode enforces type checking; runtime validators confirm data structure before persistence
- **No Sensitive Data**: No passwords, API keys, or personal information stored; only task titles and metadata

### Performance
- **Component Memoization**: React.memo() applied to TodoCard, FilterBar, and heavy rendering components to prevent unnecessary re-renders
- **Virtual Scrolling**: For lists exceeding 100 todos, implement react-window to render only visible items in viewport
- **Debounced Filtering**: Search input debounced to 300ms to limit FilteringEngine.applyFilters() calls
- **Lazy Context**: Split context into TodoContext, FilterContext, UIStateContext to enable selective subscriptions
- **Bundle Size**: Target < 150KB gzipped; use dynamic imports for modals loaded only when needed
- **LocalStorage Caching**: In-memory todo array cached across session; storage reads only happen on app startup
- **Interaction Target**: All user interactions (click, type, scroll) must respond within 100ms

### Offline
- **Complete Offline Functionality**: Every feature works without internet; LocalStorage is the source of truth, not a cache
- **No Network Requests**: Zero external API calls; all business logic executes client-side
- **Persistent State**: All todo data, filter preferences, and UI state persisted to LocalStorage; survives browser close
- **Storage Quota Handling**: Monitor localStorage.length; display warning when approaching 5MB quota on most devices
- **Data Recovery**: Implement automatic backup of todos to separate localStorage key for disaster recovery
- **Offline Indicators**: No disconnect/reconnect UI needed; app assumes always-online behavior locally

### Testing
- **Unit Test Coverage**: TodoCore, FilteringEngine, StorageAdapter modules tested with 90%+ line coverage
- **Test Structure**: Tests organized as `/src/__tests__/[module-name].test.ts` following naming convention
- **Snapshot Testing**: React component snapshots captured for TodoCard, TodoList to detect unintended UI changes
- **Integration Tests**: Test complete flows (create → update → delete) with real React components and localStorage
- **Mock Storage**: StorageAdapter wrapped with mock localStorage for tests; no test pollution between suites
- **Accessibility Tests**: Render components with @testing-library/react and verify keyboard navigation, ARIA labels
- **Performance Benchmarks**: Measure FilteringEngine.applyFilters() on arrays of 1000+ todos; target < 50ms execution

### Telemetry
- **User Analytics**: Track events (todo created, completed, deleted) without personally identifiable information
- **Session Tracking**: Record session duration, filter usage frequency, favorite emoji categories to inform design
- **Error Reporting**: Capture TypeScript compilation errors and runtime exceptions to localStorage, display to user on next session
- **Storage Monitoring**: Log localStorage usage percentage monthly to detect quota issues early
- **Performance Metrics**: Record interaction latency (click-to-response time) as custom metrics
- **Opt-out Capability**: User Settings page includes toggle to disable all telemetry collection
- **No External Tracking**: All metrics stored locally; no data sent to third-party analytics services

---

## Evolution Roadmap

### Phase 1: Current Release (v1.0)
**Focus**: Aesthetic task management with core CRUD operations
- ✅ Create, read, update, delete todos
- ✅ Emoji selection for categorization
- ✅ Status toggle (active/completed)
- ✅ Filter by emoji and status
- ✅ Search functionality
- ✅ Undo/redo for destructive operations
- ✅ Cute animations and micro-interactions
- ✅ Full offline support via LocalStorage
- ✅ Mobile-responsive design

### Phase 2: Enhanced Organization (v1.5 - Q2 2025)
**Focus**: Deeper organizational capabilities while maintaining aesthetic appeal
- **Recurring Todos**: Create daily/weekly/monthly recurring tasks with visual calendar integration
- **Subtasks**: Break down todos into nested checklist items with completion percentage visualization
- **Custom Categories**: User-created categories beyond emojis; organize by projects or life areas
- **Smart Collections**: Saved filter combinations (e.g., "Urgent work tasks due this week")
- **Theme System**: Light/dark mode toggle; color palette customization for interface elements
- **Kanban View**: Alternative to list view showing todos organized in Status columns (Todo, In Progress, Done)

### Phase 3: Collaborative Features (v2.0 - Q4 2025)
**Focus**: Enable sharing and collaboration while preserving offline-first architecture
- **Export/Import**: Share todos via JSON export; import shared task templates
- **Cloud Sync** (Optional): Gradual sync to backend for multi-device access without breaking offline mode
- **Share Lists**: Generate shareable links for read-only todo list views (no live sync)
- **Collaborator Invites**: Invite users to shared lists with role-based permissions
- **Comments on Todos**: Add discussion threads on task items
- **Activity Feed**: Timeline showing who updated what and when (for shared lists)
- **Conflict Resolution**: Handle simultaneous edits gracefully with last-write-wins + change history

### Phase 4: Smart Features (v2.5 - Q2 2026)
**Focus**: Intelligent features powered by client-side logic and optional cloud AI
- **Natural Language Input**: Parse "meeting with designer tomorrow at 2pm" into structured todo with due date
- **Smart Suggestions**: Recommend similar existing todos when creating new ones
- **Emoji Recommendations**: Auto-suggest emoji categories based on todo title
- **Priority Inference**: Suggest priority levels based on due dates and overdue patterns
- **Habit Tracking**: Track completion streaks for recurring todos; visualization of productivity patterns
- **Export to Calendar**: Sync todos with due dates to device calendar (Google Calendar, Outlook, Apple Calendar)
- **Voice Input**: Record audio notes on todos; optional transcription via optional backend service

### Phase 5: Social & Gamification (v3.0 - Q4 2026)
**Focus**: Community features and motivation mechanics
- **Challenge Boards**: Create friendly competitions with friends on shared todo completion
- **Achievement Badges**: Unlock badges for milestones (100 todos completed, 7-day streak, etc.)
- **Public Inspiration Gallery**: Share beautiful/funny todo list screenshots (opt-in) to inspire others
- **Community Templates**: Browse and import popular todo templates created by other users
- **Leaderboards**: Global/friend leaderboards for most productive users (anonymous, opt-in)
- **Reward Animations**: Confetti, celebration animations for major milestones
- **Custom Themes Gallery**: Community-designed themes available for installation

### Phase 6: Platform Expansion (v4.0 - 2027)
**Focus**: Native mobile apps and ecosystem expansion
- **iOS App**: Native SwiftUI app with iCloud sync for offline-first experience on iPhone/iPad
- **Android App**: Native Kotlin app with Google Play Sync for Android devices
- **Desktop App**: Electron wrapper with system tray integration and native notifications
- **Browser Extension**: Quick-add widget in browser toolbar for capturing todos from any webpage
- **Integration Ecosystem**: Zapier/IFTTT integration for automated todo creation from other services
- **Wearable Support**: Apple Watch app for quick todo glance and voice capture
- **Smart Home Integration**: Control via voice assistants (Alexa, Google Assistant)

### Technical Debt & Maintenance
- **Dependency Updates**: Monthly security and compatibility updates for React, TypeScript, build tools
- **Browser Compatibility**: Maintain support for Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- **Accessibility**: WCAG 2.1 AA compliance maintained across all new features
- **Performance Optimization**: Continuous profiling to maintain sub-100ms interaction times as features grow
- **Documentation**: Keep architecture, module dependencies, and API documentation synchronized with code
- **Test Coverage**: Maintain 90%+ coverage; add tests for all bug fixes and new features

