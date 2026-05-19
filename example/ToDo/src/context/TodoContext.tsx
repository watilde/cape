import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';
import { Todo, TodoAction, TodoState } from '../types/todo';
import { loadTodos, saveTodos } from '../lib/storageAdapter';

// ---------------------------------------------------------------------------
// Reducer
// ---------------------------------------------------------------------------

const initialState: TodoState = {
  todos: [],
  editingId: null,
};

function todoReducer(state: TodoState, action: TodoAction): TodoState {
  switch (action.type) {
    case 'SET_TODOS':
      return { ...state, todos: action.payload };

    case 'ADD_TODO':
      return { ...state, todos: [action.payload, ...state.todos] };

    case 'UPDATE_TODO': {
      const updated = state.todos.map((todo) =>
        todo.id === action.payload.id
          ? { ...todo, ...action.payload.updates }
          : todo
      );
      return { ...state, todos: updated };
    }

    case 'REMOVE_TODO':
      return {
        ...state,
        todos: state.todos.filter((todo) => todo.id !== action.payload),
      };

    case 'TOGGLE_TODO_COMPLETION': {
      const toggled = state.todos.map((todo) => {
        if (todo.id !== action.payload) return todo;
        const isCompleting = todo.status === 'active';
        return {
          ...todo,
          status: isCompleting ? ('completed' as const) : ('active' as const),
          completedAt: isCompleting ? Date.now() : undefined,
        };
      });
      return { ...state, todos: toggled };
    }

    // OQ-1: SET_EDITING_ID — state型にeditingIdフィールドを追加。
    // Todo[]データ構造・LocalStorageスキーマへの変更なし。
    case 'SET_EDITING_ID':
      return { ...state, editingId: action.payload };

    default:
      return state;
  }
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

interface TodoContextValue {
  state: TodoState;
  dispatch: React.Dispatch<TodoAction>;
  updateTodoTitle: (id: string, title: string) => void;
}

const TodoContext = createContext<TodoContextValue | undefined>(undefined);

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export function TodoProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(todoReducer, initialState);

  // Load from LocalStorage on mount
  useEffect(() => {
    const todos = loadTodos();
    dispatch({ type: 'SET_TODOS', payload: todos });
  }, []);

  // Persist to LocalStorage on every todos change
  useEffect(() => {
    // Skip on initial empty load
    saveTodos(state.todos);
  }, [state.todos]);

  /** Helper: update title + persist */
  const updateTodoTitle = useCallback(
    (id: string, title: string) => {
      dispatch({ type: 'UPDATE_TODO', payload: { id, updates: { title } } });
    },
    []
  );

  return (
    <TodoContext.Provider value={{ state, dispatch, updateTodoTitle }}>
      {children}
    </TodoContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useTodoContext(): TodoContextValue {
  const ctx = useContext(TodoContext);
  if (!ctx) {
    throw new Error('useTodoContext must be used within TodoProvider');
  }
  return ctx;
}
