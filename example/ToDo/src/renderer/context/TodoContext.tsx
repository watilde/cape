import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';
import { Todo } from '../types/todo';

// ---------------------------------------------------------------------------
// Storage helpers
// ---------------------------------------------------------------------------
const STORAGE_KEY = 'todoapp_v1_todos';

function loadTodosFromStorage(): Todo[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as Todo[];
  } catch {
    return [];
  }
}

function saveTodosToStorage(todos: Todo[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
  } catch (e) {
    console.error('[TodoContext] LocalStorage write failed:', e);
  }
}

// ---------------------------------------------------------------------------
// State & Actions
// ---------------------------------------------------------------------------
interface TodoState {
  todos: Todo[];
  editingId: string | null;
}

type TodoAction =
  | { type: 'ADD_TODO'; payload: Todo }
  | { type: 'UPDATE_TODO'; payload: { id: string; updates: Partial<Todo> } }
  | { type: 'DELETE_TODO'; payload: { id: string } }
  | { type: 'SET_EDITING_ID'; payload: { id: string | null } }
  | { type: 'LOAD_TODOS'; payload: Todo[] };

function todoReducer(state: TodoState, action: TodoAction): TodoState {
  switch (action.type) {
    case 'LOAD_TODOS':
      return { ...state, todos: action.payload };

    case 'ADD_TODO':
      return { ...state, todos: [action.payload, ...state.todos] };

    case 'UPDATE_TODO': {
      const updated = state.todos.map((t) =>
        t.id === action.payload.id ? { ...t, ...action.payload.updates } : t,
      );
      return { ...state, todos: updated };
    }

    case 'DELETE_TODO':
      return {
        ...state,
        todos: state.todos.filter((t) => t.id !== action.payload.id),
        editingId:
          state.editingId === action.payload.id ? null : state.editingId,
      };

    case 'SET_EDITING_ID':
      return { ...state, editingId: action.payload.id };

    default:
      return state;
  }
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------
interface TodoContextValue {
  todos: Todo[];
  editingId: string | null;
  addTodo: (todo: Todo) => void;
  updateTodo: (id: string, updates: Partial<Todo>) => void;
  deleteTodo: (id: string) => void;
  setEditingId: (id: string | null) => void;
}

const TodoContext = createContext<TodoContextValue | null>(null);

export function TodoProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(todoReducer, {
    todos: [],
    editingId: null,
  });

  // Initial load from LocalStorage
  useEffect(() => {
    const stored = loadTodosFromStorage();
    dispatch({ type: 'LOAD_TODOS', payload: stored });
  }, []);

  // Sync to LocalStorage on every todos mutation
  useEffect(() => {
    saveTodosToStorage(state.todos);
  }, [state.todos]);

  const addTodo = useCallback((todo: Todo) => {
    dispatch({ type: 'ADD_TODO', payload: todo });
  }, []);

  const updateTodo = useCallback((id: string, updates: Partial<Todo>) => {
    dispatch({ type: 'UPDATE_TODO', payload: { id, updates } });
  }, []);

  const deleteTodo = useCallback((id: string) => {
    dispatch({ type: 'DELETE_TODO', payload: { id } });
  }, []);

  const setEditingId = useCallback((id: string | null) => {
    dispatch({ type: 'SET_EDITING_ID', payload: { id } });
  }, []);

  return (
    <TodoContext.Provider
      value={{
        todos: state.todos,
        editingId: state.editingId,
        addTodo,
        updateTodo,
        deleteTodo,
        setEditingId,
      }}
    >
      {children}
    </TodoContext.Provider>
  );
}

export function useTodoContext(): TodoContextValue {
  const ctx = useContext(TodoContext);
  if (!ctx) {
    throw new Error('useTodoContext must be used inside <TodoProvider>');
  }
  return ctx;
}
