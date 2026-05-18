import { Todo, validateTodoData } from '../todo/TodoCore';

const STORAGE_KEY = 'todoapp_v1_todos';
const BACKUP_KEY = 'todoapp_v1_todos_backup';
const SCHEMA_VERSION_KEY = 'todoapp_v1_schema_version';
const CURRENT_SCHEMA_VERSION = 1;

// NOTE: Electron/ipcRenderer への移行は次スプリントで独立チケット化予定。
// 現在はブラウザ localStorage を直接使用。
// 移行時はこのアダプターの実装のみ変更し、インターフェースは維持する。

export function initializeStorage(): void {
  const version = localStorage.getItem(SCHEMA_VERSION_KEY);
  if (!version) {
    localStorage.setItem(SCHEMA_VERSION_KEY, String(CURRENT_SCHEMA_VERSION));
  }
}

export function saveTodos(todos: Todo[]): void {
  try {
    const serialized = JSON.stringify(todos);
    // バックアップを先に書いてからメインを更新
    const existing = localStorage.getItem(STORAGE_KEY);
    if (existing) {
      localStorage.setItem(BACKUP_KEY, existing);
    }
    localStorage.setItem(STORAGE_KEY, serialized);
  } catch (e) {
    if (e instanceof DOMException && e.name === 'QuotaExceededError') {
      console.error('[StorageAdapter] ストレージ容量超過:', e);
      throw new Error('ストレージ容量が不足しています。不要なタスクを削除してください。');
    }
    throw e;
  }
}

export function loadTodos(): Todo[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return recoverFromBackup();
    const valid = parsed.filter(validateTodoData);
    if (valid.length !== parsed.length) {
      console.warn('[StorageAdapter] 一部のデータが不正です。有効なデータのみ復元します。');
    }
    return valid;
  } catch {
    return recoverFromBackup();
  }
}

function recoverFromBackup(): Todo[] {
  try {
    const backup = localStorage.getItem(BACKUP_KEY);
    if (!backup) return [];
    const parsed: unknown = JSON.parse(backup);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(validateTodoData);
  } catch {
    return [];
  }
}

export function clearAllTodos(): void {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(BACKUP_KEY);
}

export function getStorageStats(): { used: number; available: number } {
  let used = 0;
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key) {
      used += (localStorage.getItem(key) ?? '').length * 2; // UTF-16
    }
  }
  const available = 5 * 1024 * 1024 - used; // 5MB 推定
  return { used, available };
}
