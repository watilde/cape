/**
 * アプリルート
 * TodoProviderでコンテキストを提供し、TaskListをレンダリング
 */
import React from 'react';
import { TodoProvider, useTodoContext } from './context/TodoContext';
import { TaskList } from './components/TaskList';
import './styles/completion.css';

function AppContent(): JSX.Element {
  const { state, handleToggleCompletion, handleRemoveTodo } = useTodoContext();

  const activeTodoCount = state.todos.filter((t) => !t.isCompleted).length;

  return (
    <div className="app">
      <header className="app-header">
        <h1 className="app-title">
          ✅ やること
          {activeTodoCount > 0 && (
            <span
              className="app-header__badge"
              aria-label={`残り${activeTodoCount}件`}
            >
              {activeTodoCount}
            </span>
          )}
        </h1>
      </header>
      <main className="app-main">
        {state.error && (
          <div className="app-error" role="alert">
            {state.error}
          </div>
        )}
        <TaskList
          todos={state.todos}
          onToggleCompletion={handleToggleCompletion}
          onRemove={handleRemoveTodo}
        />
      </main>
    </div>
  );
}

export function App(): JSX.Element {
  return (
    <TodoProvider>
      <AppContent />
    </TodoProvider>
  );
}

export default App;
