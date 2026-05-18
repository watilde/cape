/**
 * TodoContext
 * - アプリケーション全体のTodo状態管理
 * - TOGGLE_TODO_COMPLETION アクションを含む
 */
import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';
import { Todo, CreateTodoInput } from '../../lib/types/todo';
import {
  initialize,
  getAllTodos,
  addTodo,
  updateTodoInRepo,
  removeTodo,
  toggleTodoCompletion,
} from '../../lib/repository/todoRepository';

// --- State ---
interface TodoState {
  todos: Todo[];
  isLoading: boolean;
  error: string | null;
}

// --- Actions ---
type TodoAction =
  | { type: 'INIT_TODOS'; payload: Todo[] }
  | { type: 'ADD_TODO'; payload: Todo }
  | { type: 'UPDATE_TODO'; payload: Todo }
  | { type: 'REMOVE_TODO'; payload: string }
  | { type: 'TOGGLE_TODO_COMPLETION'; payload: Todo }
  | { type: 'SET_ERROR'; payload: string };

// --- Reducer ---
function todoReducer(state: TodoState, action: TodoAction): TodoState {
  switch (action.type) {
    case 'INIT_TODOS':
      return { ...state, todos: action.payload, isLoading: false };
    case 'ADD_TODO':
      return { ...state, todos: [action.payload, ...state.todos] };
    case 'UPDATE_TODO':
      return {
        ...state,
        todos: state.todos.map((t) =>
          t.id === action.payload.id ? action.payload : t
        ),
      };
    case 'REMOVE_TODO':
      return {
        ...state,
        todos: state.todos.filter((t) => t.id !== action.payload),
      };
    case 'TOGGLE_TODO_COMPLETION':
      return {
        ...state,
        todos: state.todos.map((t) =>
          t.id === action.payload.id ? action.payload : t
        ),
      };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    default:
      return state;
  }
}

// --- Context ---
interface TodoContextValue {
  state: TodoState;
  handleAddTodo: (input: CreateTodoInput) => void;
  handleToggleCompletion: (id: string) => void;
  handleRemoveTodo: (id: string) => void;
  handleUpdateTodo: (id: string, updates: Partial<Todo>) => void;
}

const TodoContext = createContext<TodoContextValue | null>(null);

// --- Provider ---
interface TodoProviderProps {
  children: ReactNode;
}

export function TodoProvider({ children }: TodoProviderProps): JSX.Element {
  const [state, dispatch] = useReducer(todoReducer, {
    todos: [],
    isLoading: true,
    error: null,
  });

  // 初期化: StorageからTodoを読み込む
  useEffect(() => {
    initialize();
    const todos = getAllTodos();
    dispatch({ type: 'INIT_TODOS', payload: todos });
  }, []);

  const handleAddTodo = useCallback((input: CreateTodoInput): void => {
    try {
      const todo = addTodo(input);
      dispatch({ type: 'ADD_TODO', payload: todo });
    } catch (error) {
      dispatch({
        type: 'SET_ERROR',
        payload: error instanceof Error ? error.message : '追加に失敗しました',
      });
    }
  }, []);

  const handleToggleCompletion = useCallback((id: string): void => {
    try {
      const updated = toggleTodoCompletion(id);
      dispatch({ type: 'TOGGLE_TODO_COMPLETION', payload: updated });
    } catch (error) {
      dispatch({
        type: 'SET_ERROR',
        payload:
          error instanceof Error ? error.message : '更新に失敗しました',
      });
    }
  }, []);

  const handleRemoveTodo = useCallback((id: string): void => {
    try {
      removeTodo(id);
      dispatch({ type: 'REMOVE_TODO', payload: id });
    } catch (error) {
      dispatch({
        type: 'SET_ERROR',
        payload:
          error instanceof Error ? error.message : '削除に失敗しました',
      });
    }
  }, []);

  const handleUpdateTodo = useCallback(
    (id: string, updates: Partial<Todo>): void => {
      try {
        const updated = updateTodoInRepo(id, updates);
        dispatch({ type: 'UPDATE_TODO', payload: updated });
      } catch (error) {
        dispatch({
          type: 'SET_ERROR',
          payload:
            error instanceof Error ? error.message : '更新に失敗しました',
        });
      }
    },
    []
  );

  return (
    <TodoContext.Provider
      value={{
        state,
        handleAddTodo,
        handleToggleCompletion,
        handleRemoveTodo,
        handleUpdateTodo,
      }}
    >
      {children}
    </TodoContext.Provider>
  );
}

// --- Hook ---
export function useTodoContext(): TodoContextValue {
  const context = useContext(TodoContext);
  if (!context) {
    throw new Error('useTodoContext must be used within TodoProvider');
  }
  return context;
}
