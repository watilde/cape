/**
 * TodoCore Module
 *
 * Responsibility: Manage todo item lifecycle and data model.
 * Pure domain logic — no dependencies on storage, UI, or framework code.
 *
 * Architecture layer: Domain Logic Layer
 * Dependencies: None
 */

import type { Todo } from "../types/todo";

// ---------------------------------------------------------------------------
// ID generation
// ---------------------------------------------------------------------------

/**
 * Generate a unique todo identifier using timestamp + random suffix.
 * Collision probability is negligible for single-user client-side usage.
 */
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

// ---------------------------------------------------------------------------
// CRUD operations
// ---------------------------------------------------------------------------

/**
 * Create a new todo item with sensible defaults.
 */
export function createTodo(
  title: string,
  emoji: string,
  options?: { description?: string; dueDate?: string }
): Todo {
  if (title.trim().length === 0) {
    throw new Error("[TodoCore] Todo title must not be empty.");
  }
  if (title.length > 100) {
    throw new Error("[TodoCore] Todo title must be 100 characters or fewer.");
  }

  return {
    id: generateId(),
    title: title.trim(),
    emoji,
    description: options?.description,
    dueDate: options?.dueDate,
    completed: false,
    createdAt: new Date().toISOString(),
  };
}

/**
 * Apply a partial update to an existing todo, returning the updated entity.
 * Does not mutate the original object.
 */
export function updateTodo(existing: Todo, updates: Partial<Todo>): Todo {
  const updated: Todo = { ...existing, ...updates };

  // Automatically set completedAt when transitioning to completed
  if (updates.completed === true && existing.completed === false) {
    updated.completedAt = new Date().toISOString();
  }

  // Clear completedAt when un-completing a todo
  if (updates.completed === false && existing.completed === true) {
    updated.completedAt = undefined;
  }

  return updated;
}

/**
 * Mark a todo as logically deleted (soft delete).
 * The item remains in storage for undo support.
 */
export function deleteTodo(existing: Todo): Todo {
  return { ...existing, deleted: true };
}

// ---------------------------------------------------------------------------
// Sorting
// ---------------------------------------------------------------------------

export function sortTodosByCreatedAt(todos: Todo[]): Todo[] {
  return [...todos].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

/**
 * Runtime type guard for the Todo interface.
 * Used by StorageAdapter when loading data from LocalStorage to guard
 * against corrupted or schema-mismatched entries.
 */
export function validateTodoData(data: unknown): data is Todo {
  if (typeof data !== "object" || data === null) return false;

  const d = data as Record<string, unknown>;

  return (
    typeof d["id"] === "string" &&
    d["id"].length > 0 &&
    typeof d["title"] === "string" &&
    d["title"].length > 0 &&
    typeof d["emoji"] === "string" &&
    typeof d["completed"] === "boolean" &&
    typeof d["createdAt"] === "string" &&
    // Optional fields — only validate type if present
    (d["description"] === undefined || typeof d["description"] === "string") &&
    (d["dueDate"] === undefined || typeof d["dueDate"] === "string") &&
    (d["completedAt"] === undefined || typeof d["completedAt"] === "string") &&
    (d["deleted"] === undefined || typeof d["deleted"] === "boolean")
  );
}
