import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
} from 'react';
import { Todo } from '../../lib/todo/TodoCore';
import { initializeStorage } from '../../lib/storage/StorageAdapter';
import {
  getAllTodos,
  addTodo,
  updateTodo,
  removeTodo,
} from '../../lib/storage/TodoRepository';

// ─── State ────────────────────────────────────────────────────────────────────

interface TodoState {
  todos: Todo[];
  /** 現在編集中のタスクID（排他制御: 同時に1タスクのみ編集可） */
  editingId: string | null;
}

// ─── Actions ──────────────────────────────────────────────────────────────────

type TodoAction =
  | { type: 'INITIALIZE'; todos: Todo[] }
  | { type: 'ADD_TODO'; todo: Todo }
  | { type: 'UPDATE_TODO'; id: string; updates: Partial<Omit<Todo, 'id' | 'createdAt'>> }
  | { type: 'REMOVE_TODO'; id: string }
  | { type: 'SET_EDITING_ID'; id: string | null };

// ─── Reducer ──────────────────────────────────────────────────────────────────

function todoReducer(state: TodoState, action: TodoAction): TodoState {
  switch (action.type) {
    case 'INITIALIZE':
      return { ...state, todos: action.todos };

    case 'ADD_TODO':
      return { ...state, todos: [action.todo, ...state.todos] };

    case 'UPDATE_TODO': {
      return {
        ...state,
        todos: state.todos.map((t) =>
          t.id === action.id ? { ...t, ...action.updates, updatedAt: Date.now() } : t
        ),
      };
    }

    case 'REMOVE_TODO':
      return {
        ...state,
        todos: state.todos.filter((t) => t.id !== action.id),
        editingId: state.editingId === action.id ? null : state.editingId,
      };

    case 'SET_EDITING_ID':
      return { ...state, editingId: action.id };

    default:
      return state;
  }
}

// ─── Context ──────────────────────────────────────────────────────────────────

interface TodoContextValue {
  todos: Todo[];
  editingId: string | null;
  addTodoItem: (todo: Todo) => void;
  updateTodoItem: (id: string, updates: Partial<Omit<Todo, 'id' | 'createdAt'>>) => void;
  removeTodoItem: (id: string) => void;
  toggleComplete: (id: string) => void;
  setEditingId: (id: string | null) => void;
}

const TodoContext = createContext<TodoContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function TodoProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(todoReducer, {
    todos: [],
    editingId: null,
  });

  useEffect(() => {
    initializeStorage();
    const loaded = getAllTodos();
    dispatch({ type: 'INITIALIZE', todos: loaded });
  }, []);

  const addTodoItem = useCallback((todo: Todo) => {
    addTodo(todo);
    dispatch({ type: 'ADD_TODO', todo });
  }, []);

  const updateTodoItem = useCallback(
    (id: string, updates: Partial<Omit<Todo, 'id' | 'createdAt'>>) => {
      updateTodo(id, updates);
      dispatch({ type: 'UPDATE_TODO', id, updates });
    },
    []
  );

  const removeTodoItem = useCallback((id: string) => {
    removeTodo(id);
    dispatch({ type: 'REMOVE_TODO', id });
  }, []);

  const toggleComplete = useCallback(
    (id: string) => {
      const todo = state.todos.find((t) => t.id === id);
      if (!todo) return;
      const updates = {
        isCompleted: !todo.isCompleted,
        completedAt: !todo.isCompleted ? Date.now() : undefined,
      };
      updateTodo(id, updates);
      dispatch({ type: 'UPDATE_TODO', id, updates });
    },
    [state.todos]
  );

  const setEditingId = useCallback((id: string | null) => {
    dispatch({ type: 'SET_EDITING_ID', id });
  }, []);

  const value = useMemo<TodoContextValue>(
    () => ({
      todos: state.todos,
      editingId: state.editingId,
      addTodoItem,
      updateTodoItem,
      removeTodoItem,
      toggleComplete,
      setEditingId,
    }),
    [state.todos, state.editingId, addTodoItem, updateTodoItem, removeTodoItem, toggleComplete, setEditingId]
  );

  return <TodoContext.Provider value={value}>{children}</TodoContext.Provider>;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useTodoContext(): TodoContextValue {
  const ctx = useContext(TodoContext);
  if (!ctx) throw new Error('useTodoContext は TodoProvider 内で使用してください');
  return ctx;
}
