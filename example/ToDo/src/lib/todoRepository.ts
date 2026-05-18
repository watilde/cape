import { Todo } from './types';
import { createTodo, toggleTodo, validateTodoData } from './todoCore';
import { saveTodos, loadTodos, isStorageAvailable } from './storageAdapter';

/**
 * インメモリキャッシュ + LocalStorage を統合するリポジトリ
 * アプリ起動時に一度だけLoadし、以降はキャッシュを使う
 */
let cache: Todo[] | null = null;

function getCache(): Todo[] {
  if (cache === null) {
    cache = loadTodos();
  }
  return cache;
}

function persistCache(): void {
  if (cache !== null) {
    saveTodos(cache);
  }
}

export function initRepository(): Todo[] {
  cache = loadTodos();
  return [...cache];
}

export function getAllTodos(): Todo[] {
  return [...getCache()];
}

export function getTodoById(id: string): Todo | null {
  return getCache().find((t) => t.id === id) ?? null;
}

export function addTodo(title: string): Todo {
  const todo = createTodo(title);
  cache = [...getCache(), todo];
  persistCache();
  return todo;
}

export function toggleTodoById(id: string): Todo | null {
  const current = getCache();
  const index = current.findIndex((t) => t.id === id);
  if (index === -1) return null;
  const updated = toggleTodo(current[index]);
  if (!validateTodoData(updated)) return null;
  cache = [...current.slice(0, index), updated, ...current.slice(index + 1)];
  persistCache();
  return updated;
}

export function deleteTodo(id: string): boolean {
  const current = getCache();
  const next = current.filter((t) => t.id !== id);
  if (next.length === current.length) return false;
  cache = next;
  persistCache();
  return true;
}

export function getTodosByStatus(status: 'active' | 'completed'): Todo[] {
  return getCache().filter((t) =>
    status === 'active' ? !t.completed : t.completed
  );
}

export function isStorageReady(): boolean {
  return isStorageAvailable();
}

/** テスト用: キャッシュをリセットする */
export function _resetCache(): void {
  cache = null;
}
