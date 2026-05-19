/**
 * Application-wide constants
 *
 * Responsibility: Centralize all runtime constants used across the application.
 * This file is intentionally separate from src/types/todo.ts, which is reserved
 * exclusively for TypeScript type and interface definitions.
 *
 * Architecture note: Follows the StorageAdapter module's responsibility boundary
 * defined in 1_architecture.md — LocalStorage key management belongs to the
 * Data Persistence Layer, not the Domain type layer.
 */

/**
 * LocalStorage namespace key for all todo data.
 * Prefixed with app namespace to prevent collision with other apps
 * sharing the same browser origin (per architecture guardrail: "todoapp_v1_" namespace).
 *
 * ⚠️ WARNING: Do NOT change this value after initial release.
 * Changing this key will cause all existing users' LocalStorage data
 * to become unreachable, resulting in data loss.
 * If a migration is ever needed, implement a StorageAdapter migration
 * routine that reads the old key, writes to the new key, then deletes the old key.
 */
export const STORAGE_KEY = "todoapp_v1_todos" as const;

/**
 * LocalStorage key for persisting user filter/sort preferences.
 * Separated from todo data to allow independent clearing.
 */
export const FILTER_PREFERENCES_KEY = "todoapp_v1_filter_prefs" as const;

/**
 * LocalStorage key for UI state preferences (theme variant, compact mode, etc.)
 */
export const UI_PREFERENCES_KEY = "todoapp_v1_ui_prefs" as const;

/**
 * LocalStorage key for the undo action stack backup.
 * Used by UIStateManager for disaster recovery.
 */
export const UNDO_STACK_KEY = "todoapp_v1_undo_stack" as const;

/**
 * LocalStorage key for the telemetry opt-out preference.
 */
export const TELEMETRY_OPT_OUT_KEY = "todoapp_v1_telemetry_opt_out" as const;

/**
 * LocalStorage schema version — used by StorageAdapter.initializeStorage()
 * to detect when a migration is needed between app versions.
 */
export const STORAGE_SCHEMA_VERSION = 1 as const;

export const STORAGE_SCHEMA_KEY = "todoapp_v1_schema_version" as const;
