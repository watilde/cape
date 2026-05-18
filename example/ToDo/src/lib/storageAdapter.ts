import { Todo } from './types';
import { validateTodoArray } from './todoCore';

const STORAGE_KEY = 'todoapp_v1_todos';
const BACKUP_KEY = 'todoapp_v1_todos_backup';

/**
 * LocalStorageが利用可能かチェックする
 */
export function isStorageAvailable(): boolean {
  try {
    const testKey = '__storage_test__';
    localStorage.setItem(testKey, '1');
    localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

/**
 * ストレージを初期化する（初回起動時）
 */
export function initializeStorage(): void {
  if (!isStorageAvailable()) return;
  if (localStorage.getItem(STORAGE_KEY) === null) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
  }
}

/**
 * Todo配列をLocalStorageに保存する
 */
export function saveTodos(todos: Todo[]): void {
  if (!isStorageAvailable()) return;
  try {
    const serialized = JSON.stringify(todos);
    // バックアップを先に書いてから本体を更新（障害復旧用）
    localStorage.setItem(BACKUP_KEY, localStorage.getItem(STORAGE_KEY) ?? '[]');
    localStorage.setItem(STORAGE_KEY, serialized);
  } catch (e) {
    console.error('[StorageAdapter] Failed to save todos:', e);
    throw new Error('STORAGE_QUOTA_EXCEEDED');
  }
}

/**
 * LocalStorageからTodo配列を読み込む
 */
export function loadTodos(): Todo[] {
  if (!isStorageAvailable()) return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === null) return [];
    const parsed: unknown = JSON.parse(raw);
    if (validateTodoArray(parsed)) {
      return parsed;
    }
    // メインストレージが壊れていたらバックアップを試みる
    console.warn('[StorageAdapter] Main storage corrupted, trying backup');
    const backup = localStorage.getItem(BACKUP_KEY);
    if (backup !== null) {
      const backupParsed: unknown = JSON.parse(backup);
      if (validateTodoArray(backupParsed)) {
        return backupParsed;
      }
    }
    return [];
  } catch {
    return [];
  }
}

/**
 * すべてのTodoデータをクリアする
 */
export function clearAllTodos(): void {
  if (!isStorageAvailable()) return;
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(BACKUP_KEY);
}

/**
 * ストレージ使用状況を返す（バイト数の概算）
 */
export function getStorageStats(): { usedBytes: number } {
  try {
    let total = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        total += key.length + (localStorage.getItem(key)?.length ?? 0);
      }
    }
    return { usedBytes: total * 2 }; // UTF-16 概算
  } catch {
    return { usedBytes: 0 };
  }
}
