/**
 * TodoRepositoryモジュール
 * - in-memoryキャッシュ + LocalStorage同期
 * - ビジネスロジック統合の高レベルデータアクセス
 */
import { Todo, CreateTodoInput, UpdateTodoInput } from '../types/todo';
import { createTodo, updateTodo } from '../core/todoCore';
import {
  saveTodos,
  loadTodos,
  initializeStorage,
} from '../storage/storageAdapter';

// in-memoryキャッシュ（アプリ起動時にlocalStorageから初期化）
let cache: Todo[] = [];
let initialized = false;

/**
 * キャッシュを初期化（アプリ起動時に一度だけ呼び出す）
 */
export function initialize(): void {
  if (initialized) return;
  initializeStorage();
  cache = loadTodos();
  initialized = true;
}

/**
 * テスト用: 状態をリセット
 */
export function _resetForTest(): void {
  cache = [];
  initialized = false;
}

/**
 * 全Todo取得
 */
export function getAllTodos(): Todo[] {
  ensureInitialized();
  return [...cache];
}

/**
 * ID指定でTodo取得
 */
export function getTodoById(id: string): Todo | null {
  ensureInitialized();
  return cache.find((t) => t.id === id) ?? null;
}

/**
 * 新しいTodoを追加
 */
export function addTodo(input: CreateTodoInput): Todo {
  ensureInitialized();
  const todo = createTodo(input);
  cache = [todo, ...cache];
  persist();
  return todo;
}

/**
 * Todoを更新
 * isCompleted のトグルにも使用
 */
export function updateTodoInRepo(id: string, updates: UpdateTodoInput): Todo {
  ensureInitialized();
  const index = cache.findIndex((t) => t.id === id);
  if (index === -1) {
    throw new Error(`Todo not found: ${id}`);
  }

  const updated = updateTodo(cache[index], updates);
  cache = cache.map((t) => (t.id === id ? updated : t));
  persist();
  return updated;
}

/**
 * Todoを削除
 */
export function removeTodo(id: string): void {
  ensureInitialized();
  cache = cache.filter((t) => t.id !== id);
  persist();
}

/**
 * 完了状態をトグル（POA AC-1, AC-2準拠）
 */
export function toggleTodoCompletion(id: string): Todo {
  ensureInitialized();
  const todo = getTodoById(id);
  if (!todo) {
    throw new Error(`Todo not found: ${id}`);
  }
  return updateTodoInRepo(id, { isCompleted: !todo.isCompleted });
}

/**
 * ステータスでフィルタリング
 */
export function getTodosByStatus(status: 'active' | 'completed'): Todo[] {
  ensureInitialized();
  return cache.filter((t) =>
    status === 'completed' ? t.isCompleted : !t.isCompleted
  );
}

// --- private ---

function ensureInitialized(): void {
  if (!initialized) {
    initialize();
  }
}

function persist(): void {
  saveTodos(cache);
}
