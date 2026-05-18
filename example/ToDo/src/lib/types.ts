export interface Todo {
  id: string;
  title: string;
  completed: boolean;
  createdAt: number;
  completedAt?: number;
}

export interface FilterConfig {
  status: 'all' | 'active' | 'completed';
}

export type AnimationState = 'idle' | 'entering' | 'completing' | 'deleting';

export interface UIState {
  animatingIds: Record<string, AnimationState>;
  storageAvailable: boolean;
}

export type TodoAction =
  | { type: 'LOAD_TODOS'; payload: Todo[] }
  | { type: 'ADD_TODO'; payload: Todo }
  | { type: 'TOGGLE_TODO'; payload: string }
  | { type: 'DELETE_TODO'; payload: string }
  | { type: 'SET_STORAGE_UNAVAILABLE' };

export type UIAction =
  | { type: 'SET_ANIMATION'; id: string; state: AnimationState }
  | { type: 'CLEAR_ANIMATION'; id: string };
