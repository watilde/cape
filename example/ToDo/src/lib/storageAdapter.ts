import { Todo } from '../types/todo';

const STORAGE_KEY = 'todoapp_v1_todos';
const BACKUP_KEY = 'todoapp_v1_todos_backup';

// ---------------------------------------------------------------------------
// Initialize
// ---------------------------------------------------------------------------

export function initializeStorage(): void {
  if (!localStorage.getItem(STORAGE_KEY)) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
  }
}

// ---------------------------------------------------------------------------
// Load
// ---------------------------------------------------------------------------

export function loadTodos(): Todo[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isValidTodo);
  } catch {
    // Attempt recovery from backup
    try {
      const backup = localStorage.getItem(BACKUP_KEY);
      if (!backup) return [];
      const parsed: unknown = JSON.parse(backup);
      if (!Array.isArray(parsed)) return [];
      return parsed.filter(isValidTodo);
    } catch {
      return [];
    }
  }
}

// ---------------------------------------------------------------------------
// Save
// ---------------------------------------------------------------------------

export function saveTodos(todos: Todo[]): void {
  try {
    const serialized = JSON.stringify(todos);
    // Write backup first
    localStorage.setItem(BACKUP_KEY, localStorage.getItem(STORAGE_KEY) ?? '[]');
    localStorage.setItem(STORAGE_KEY, serialized);
  } catch (e) {
    if (e instanceof DOMException && e.name === 'QuotaExceededError') {
      console.warn('[StorageAdapter] LocalStorage quota exceeded');
      // Surface to UI via custom event
      window.dispatchEvent(new CustomEvent('storage-quota-exceeded'));
    }
  }
}

// ---------------------------------------------------------------------------
// Clear
// ---------------------------------------------------------------------------

export function clearAllTodos(): void {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(BACKUP_KEY);
}

// ---------------------------------------------------------------------------
// Stats
// ---------------------------------------------------------------------------

export function getStorageStats(): { used: number; available: number } {
  let used = 0;
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i) ?? '';
    used += key.length + (localStorage.getItem(key)?.length ?? 0);
  }
  const MAX_BYTES = 5 * 1024 * 1024; // 5MB conservative estimate
  return { used, available: MAX_BYTES - used };
}

// ---------------------------------------------------------------------------
// Validator (runtime guard)
// ---------------------------------------------------------------------------

function isValidTodo(data: unknown): data is Todo {
  if (typeof data !== 'object' || data === null) return false;
  const d = data as Record<string, unknown>;
  return (
    typeof d['id'] === 'string' &&
    typeof d['title'] === 'string' &&
    typeof d['emoji'] === 'string' &&
    (d['status'] === 'active' || d['status'] === 'completed') &&
    typeof d['createdAt'] === 'number'
  );
}
