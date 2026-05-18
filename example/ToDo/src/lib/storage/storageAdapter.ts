/**
 * StorageAdapterモジュール
 * - LocalStorage操作の抽象化
 * - isCompleted フィールドのマイグレーション対応
 *
 * NOTE: Electron移行ポイント
 *   saveTodos / loadTodos の実装をipcRenderer経由に差し替えることで
 *   Mainプロセス永続化に移行可能。このモジュール以外の変更は不要。
 */
import { Todo } from '../types/todo';
import { validateTodoData } from '../core/todoCore';

const STORAGE_KEY = 'todoapp_v1_todos';
const SCHEMA_VERSION_KEY = 'todoapp_v1_schema_version';
const CURRENT_SCHEMA_VERSION = 2; // isCompleted追加でv2に更新

/**
 * ストレージスキーマを初期化（バージョン管理）
 */
export function initializeStorage(): void {
  const storedVersion = localStorage.getItem(SCHEMA_VERSION_KEY);
  const version = storedVersion ? parseInt(storedVersion, 10) : 1;

  if (version < CURRENT_SCHEMA_VERSION) {
    migrateTodos();
    localStorage.setItem(SCHEMA_VERSION_KEY, String(CURRENT_SCHEMA_VERSION));
  }
}

/**
 * 既存データのマイグレーション
 * v1→v2: isCompletedフィールドがundefinedの場合はfalseに正規化
 */
function migrateTodos(): void {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return;

  try {
    const parsed = JSON.parse(raw) as unknown[];
    if (!Array.isArray(parsed)) return;

    const migrated = parsed.map((item) => {
      if (typeof item === 'object' && item !== null) {
        const record = item as Record<string, unknown>;
        return {
          ...record,
          isCompleted:
            typeof record['isCompleted'] === 'boolean'
              ? record['isCompleted']
              : false,
          completedAt:
            record['completedAt'] !== undefined ? record['completedAt'] : null,
        };
      }
      return item;
    });

    localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
  } catch {
    // マイグレーション失敗時は既存データを保護（何もしない）
    console.error('[StorageAdapter] Migration failed, preserving existing data');
  }
}

/**
 * Todo配列をLocalStorageに保存
 */
export function saveTodos(todos: Todo[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
  } catch (error) {
    if (
      error instanceof DOMException &&
      error.name === 'QuotaExceededError'
    ) {
      throw new Error(
        'ストレージ容量が上限に達しました。不要なタスクを削除してください。'
      );
    }
    throw error;
  }
}

/**
 * LocalStorageからTodo配列を読み込む
 * 不正なデータはフィルタリングして除外（破損データ耐性）
 */
export function loadTodos(): Todo[] {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw) as unknown[];
    if (!Array.isArray(parsed)) return [];

    return parsed.filter(validateTodoData);
  } catch {
    console.error('[StorageAdapter] Failed to parse todos from storage');
    return [];
  }
}

/**
 * 全Todoを削除
 */
export function clearAllTodos(): void {
  localStorage.removeItem(STORAGE_KEY);
}

/**
 * ストレージ使用状況を取得
 */
export function getStorageStats(): { usedBytes: number; warningThreshold: number } {
  const serialized = localStorage.getItem(STORAGE_KEY) ?? '';
  return {
    usedBytes: new Blob([serialized]).size,
    warningThreshold: 4.5 * 1024 * 1024, // 4.5MB警告閾値
  };
}
