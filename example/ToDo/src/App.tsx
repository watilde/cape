/**
 * App コンポーネント
 * ルートレイアウト——Provider配置とメインコンテンツ構成
 */

import React from 'react';
import { TodoProvider } from './contexts/TodoContext';
import { UiStateProvider } from './contexts/UiStateContext';
import { AppHeader } from './components/AppHeader';
import { TaskInput } from './components/TaskInput';
import { TaskList } from './components/TaskList';
import { UndoSnackbar } from './components/UndoSnackbar';

export function App(): React.JSX.Element {
  return (
    <TodoProvider>
      <UiStateProvider>
        <div className="app-container">
          <AppHeader />
          <main className="app-main">
            <TaskInput />
            <TaskList />
          </main>
          <UndoSnackbar />
        </div>
      </UiStateProvider>
    </TodoProvider>
  );
}
