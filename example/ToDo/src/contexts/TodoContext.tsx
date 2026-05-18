/**
 * TodoContext
 * タスクリストの状態管理——Context + useReducerパターン
 * StorageAdapterを通じてLocalStorageと同期
 */

import React, { createContext, useReducer, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import type { Todo } from '../types/todo';
import { createTodo, updateTodo, sortTodosByCreatedAt } from '../lib/todoCore';
import { initializeStorage, saveTodos, loadTodos } from '../lib/storage';

// --- State & Action Types ---

interface TodoState {
  todos: Todo[];
  initialized: boolean;
}

type TodoAction =
  | { type: 'INITIALIZE'; payload: Todo[] }
  | { type: 'ADD_TODO'; payload: Todo }
  | { type: 'TOGGLE_TODO'; payload: string }
  | { type: 'DELETE_TODO'; payload: string }
  | { type: 'RESTORE_TODO'; payload: { todo: Todo; originalIndex: number } };

// --- Reducer ---

function todoReducer(state: TodoState, action: TodoAction): TodoState {
  switch (action.type) {
    case 'INITIALIZE':
      return { todos: action.payload, initialized: true };

    case 'ADD_TODO': {
      // AC-001-1: 新規タスクはリスト先頭に追加
      const newTodos = [action.payload, ...state.todos];
      saveTodos(newTodos);
      return { ...state, todos: newTodos };
    }

    case 'TOGGLE_TODO': {
      const newTodos = state.todos.map((todo) => {
        if (todo.id !== action.payload) return todo;
        return updateTodo(todo, { completed: !todo.completed });
      });
      saveTodos(newTodos);
      return { ...state, todos: newTodos };
    }

    case 'DELETE_TODO': {
      // ソフトデリート：UIから即座に除去、LocalStorageへの書き込みはUiStateContextのタイマー後
      // ここではメモリ上の配列からのみ削除する
      const newTodos = state.todos.filter((t) => t.id !== action.payload);
      // LocalStorageへの書き込みはここで行う（Undoのためのメモリ保持はUiStateContextで管理）
      saveTodos(newTodos);
      return { ...state, todos: newTodos };
    }

    case 'RESTORE_TODO': {
      // Undo: 元の位置に戻す
      const newTodos = [...state.todos];
      const insertAt = Math.min(action.payload.originalIndex, newTodos.length);
      newTodos.splice(insertAt, 0, action.payload.todo);
      saveTodos(newTodos);
      return { ...state, todos: newTodos };
    }

    default:
      return state;
  }
}

// --- Context ---

interface TodoContextValue {
  todos: Todo[];
  initialized: boolean;
  addTodo: (title: string) => void;
  toggleTodo: (id: string) => void;
  deleteTodo: (id: string) => { todo: Todo; originalIndex: number } | null;
  restoreTodo: (todo: Todo, originalIndex: number) => void;
}

export const TodoContext = createContext<TodoContextValue | null>(null);

// --- Provider ---

interface TodoProviderProps {
  children: ReactNode;
}

export function TodoProvider({ children }: TodoProviderProps): React.JSX.Element {
  const [state, dispatch] = useReducer(todoReducer, { todos: [], initialized: false });

  // アプリ起動時にLocalStorageからデータを復元
  // AC-004-1 / AC-004-2: 正常復元と空配列フォールバック
  useEffect(() => {
    initializeStorage();
    const savedTodos = loadTodos();
    const sorted = sortTodosByCreatedAt(savedTodos);
    dispatch({ type: 'INITIALIZE', payload: sorted });
  }, []);

  const addTodo = useCallback((title: string) => {
    const todo = createTodo(title); // バリデーション済み（空文字はここでthrow）
    dispatch({ type: 'ADD_TODO', payload: todo });
  }, []);

  const toggleTodo = useCallback((id: string) => {
    dispatch({ type: 'TOGGLE_TODO', payload: id });
  }, []);

  const deleteTodo = useCallback(
    (id: string): { todo: Todo; originalIndex: number } | null => {
      const originalIndex = state.todos.findIndex((t) => t.id === id);
      const todo = state.todos.find((t) => t.id === id);
      if (!todo) return null;
      dispatch({ type: 'DELETE_TODO', payload: id });
      return { todo, originalIndex };
    },
    [state.todos],
  );

  const restoreTodo = useCallback((todo: Todo, originalIndex: number) => {
    dispatch({ type: 'RESTORE_TODO', payload: { todo, originalIndex } });
  }, []);

  return (
    <TodoContext.Provider
      value={{
        todos: state.todos,
        initialized: state.initialized,
        addTodo,
        toggleTodo,
        deleteTodo,
        restoreTodo,
      }}
    >
      {children}
    </TodoContext.Provider>
  );
}
