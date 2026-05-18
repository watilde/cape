import { Todo, updateTodo as coreupdateTodo } from '../todo/TodoCore';
import { loadTodos, saveTodos } from './StorageAdapter';

let cache: Todo[] | null = null;

function getCache(): Todo[] {
  if (cache === null) {
    cache = loadTodos();
  }
  return cache;
}

function flushCache(todos: Todo[]): void {
  cache = todos;
  saveTodos(todos);
}

export function getAllTodos(): Todo[] {
  return [...getCache()];
}

export function getTodoById(id: string): Todo | null {
  return getCache().find((t) => t.id === id) ?? null;
}

export function addTodo(todo: Todo): void {
  const todos = getCache();
  flushCache([todo, ...todos]);
}

export function updateTodo(id: string, updates: Partial<Omit<Todo, 'id' | 'createdAt'>>): Todo {
  const todos = getCache();
  const index = todos.findIndex((t) => t.id === id);
  if (index === -1) throw new Error(`Todo not found: ${id}`);
  const updated = coreupdateTodo(todos[index], updates);
  const next = [...todos];
  next[index] = updated;
  flushCache(next);
  return updated;
}

export function removeTodo(id: string): void {
  const todos = getCache();
  flushCache(todos.filter((t) => t.id !== id));
}

export function getTodosByStatus(status: 'active' | 'completed'): Todo[] {
  return getCache().filter((t) =>
    status === 'active' ? !t.isCompleted : t.isCompleted
  );
}

export function getTodosByEmoji(emoji: string): Todo[] {
  return getCache().filter((t) => t.emoji === emoji);
}

/** テスト用: キャッシュをリセット */
export function _resetCacheForTest(): void {
  cache = null;
}
