/**
 * StorageAdapter Module
 *
 * Responsibility: Abstract LocalStorage operations and handle data
 * serialization/deserialization for the todo application.
 *
 * Architecture layer: Data Persistence Layer
 * Dependencies: TodoCore Module (for validation), src/lib/constants.ts
 *
 * Fix note (task-1779178940125):
 *   STORAGE_KEY was previously imported from '../types/todo.ts', which is a
 *   type-definition-only file. Per POA scope declaration, runtime constants
 *   must not reside in type definition files. STORAGE_KEY is now imported
 *   from 'src/lib/constants.ts', which owns all runtime constant definitions.
 */

import {
  STORAGE_KEY,
  FILTER_PREFERENCES_KEY,
  UI_PREFERENCES_KEY,
  STORAGE_SCHEMA_VERSION,
} from "./lib/constants";
import { validateTodoData } from "./lib/todoCore";
import type { Todo, FilterConfig, UiPreferences } from "./types/todo";

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Safe JSON parse wrapper — returns null on any parse failure.
 * Prevents corrupted LocalStorage data from crashing the app.
 */
function safeJsonParse<T>(raw: string | null): T | null {
  if (raw === null) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    console.error("[StorageAdapter] Failed to parse JSON from LocalStorage:", raw);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Storage initialisation
// ---------------------------------------------------------------------------

/**
 * Initialize storage schema with version tracking.
 * Must be called once on app startup before any read/write operations.
 */
export function initializeStorage(): void {
  const versionKey = `todoapp_v1_schema_version`;
  const storedVersion = localStorage.getItem(versionKey);

  if (storedVersion === null) {
    // First-time initialization: write schema version
    localStorage.setItem(versionKey, String(STORAGE_SCHEMA_VERSION));
    console.info(
      `[StorageAdapter] Initialized storage schema v${STORAGE_SCHEMA_VERSION}`
    );
    return;
  }

  const parsedVersion = Number(storedVersion);
  if (parsedVersion < STORAGE_SCHEMA_VERSION) {
    // Future: add migration logic here when schema version bumps
    console.info(
      `[StorageAdapter] Storage schema migration: v${parsedVersion} → v${STORAGE_SCHEMA_VERSION}`
    );
    localStorage.setItem(versionKey, String(STORAGE_SCHEMA_VERSION));
  }
}

// ---------------------------------------------------------------------------
// Todo persistence
// ---------------------------------------------------------------------------

/**
 * Persist the complete todo array to LocalStorage.
 * Overwrites any previously stored data.
 *
 * @throws Never — storage quota errors are caught and reported via console.
 */
export function saveTodos(todos: Todo[]): void {
  try {
    const serialized = JSON.stringify(todos);
    localStorage.setItem(STORAGE_KEY, serialized);
  } catch (error) {
    if (error instanceof DOMException && error.name === "QuotaExceededError") {
      console.error(
        "[StorageAdapter] LocalStorage quota exceeded. Todo data could not be saved.",
        error
      );
      // UIStateManager should surface a user-facing notification here.
      // The caller is responsible for handling the error signal.
    } else {
      console.error("[StorageAdapter] Unexpected error saving todos:", error);
    }
  }
}

/**
 * Load the complete todo collection from LocalStorage.
 * Returns an empty array if no data exists or if the stored data is corrupted.
 *
 * Each item is validated via TodoCore.validateTodoData() to guard against
 * schema drift or corrupted entries.
 */
export function loadTodos(): Todo[] {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw === null) return [];

  const parsed = safeJsonParse<unknown[]>(raw);
  if (!Array.isArray(parsed)) {
    console.warn(
      "[StorageAdapter] Stored todo data is not an array. Returning empty list."
    );
    return [];
  }

  const valid: Todo[] = [];
  for (const item of parsed) {
    if (validateTodoData(item)) {
      valid.push(item);
    } else {
      console.warn(
        "[StorageAdapter] Skipping invalid todo entry during load:",
        item
      );
    }
  }

  return valid;
}

/**
 * Clear all todos from LocalStorage.
 * Intended for the "reset all data" feature — requires explicit caller confirmation.
 */
export function clearAllTodos(): void {
  localStorage.removeItem(STORAGE_KEY);
  console.info("[StorageAdapter] All todos cleared from LocalStorage.");
}

// ---------------------------------------------------------------------------
// Storage diagnostics
// ---------------------------------------------------------------------------

/**
 * Return a rough estimate of LocalStorage utilization.
 * Browsers typically allow ~5MB; values are in bytes.
 */
export function getStorageStats(): { used: number; available: number } {
  let used = 0;
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i) ?? "";
    const value = localStorage.getItem(key) ?? "";
    used += key.length + value.length;
  }

  // 5MB is the de-facto standard quota for most browsers
  const estimatedTotal = 5 * 1024 * 1024;
  return {
    used,
    available: Math.max(0, estimatedTotal - used),
  };
}

// ---------------------------------------------------------------------------
// Filter preference persistence
// ---------------------------------------------------------------------------

/**
 * Persist user's active filter configuration for session restoration.
 */
export function saveFilterPreferences(config: FilterConfig): void {
  try {
    localStorage.setItem(FILTER_PREFERENCES_KEY, JSON.stringify(config));
  } catch {
    console.warn("[StorageAdapter] Could not save filter preferences.");
  }
}

/**
 * Load persisted filter preferences. Returns null if none stored.
 */
export function loadFilterPreferences(): FilterConfig | null {
  const raw = localStorage.getItem(FILTER_PREFERENCES_KEY);
  return safeJsonParse<FilterConfig>(raw);
}

// ---------------------------------------------------------------------------
// UI preference persistence
// ---------------------------------------------------------------------------

/**
 * Persist UI state preferences (theme variant, compact mode, etc.)
 */
export function saveUiPreferences(prefs: UiPreferences): void {
  try {
    localStorage.setItem(UI_PREFERENCES_KEY, JSON.stringify(prefs));
  } catch {
    console.warn("[StorageAdapter] Could not save UI preferences.");
  }
}

/**
 * Load persisted UI preferences. Returns null if none stored.
 */
export function loadUiPreferences(): UiPreferences | null {
  const raw = localStorage.getItem(UI_PREFERENCES_KEY);
  return safeJsonParse<UiPreferences>(raw);
}
