/**
 * StorageAdapter Module — Unit Tests
 *
 * Verifies that:
 * 1. STORAGE_KEY is correctly sourced from constants.ts (regression guard for task-1779178940125)
 * 2. Core CRUD operations on LocalStorage work as expected
 * 3. Corrupted data is handled gracefully without crashing
 *
 * Test strategy: Mock localStorage via a simple in-memory implementation.
 * No test pollution between suites — storage is cleared in beforeEach.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";

// ---------------------------------------------------------------------------
// LocalStorage mock
// ---------------------------------------------------------------------------

const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string): string | null => store[key] ?? null,
    setItem: (key: string, value: string): void => {
      store[key] = value;
    },
    removeItem: (key: string): void => {
      delete store[key];
    },
    clear: (): void => {
      store = {};
    },
    get length(): number {
      return Object.keys(store).length;
    },
    key: (index: number): string | null =>
      Object.keys(store)[index] ?? null,
  };
})();

Object.defineProperty(global, "localStorage", {
  value: localStorageMock,
});

// ---------------------------------------------------------------------------
// Imports under test (after localStorage mock is set up)
// ---------------------------------------------------------------------------

import { STORAGE_KEY } from "../lib/constants";
import {
  initializeStorage,
  saveTodos,
  loadTodos,
  clearAllTodos,
  getStorageStats,
} from "../storage";
import { createTodo } from "../lib/todoCore";
import type { Todo } from "../types/todo";

// ---------------------------------------------------------------------------
// Test suite
// ---------------------------------------------------------------------------

describe("constants.ts — STORAGE_KEY export", () => {
  it("should export STORAGE_KEY as a non-empty string", () => {
    expect(typeof STORAGE_KEY).toBe("string");
    expect(STORAGE_KEY.length).toBeGreaterThan(0);
  });

  it("should be namespaced with todoapp_v1_ prefix (architecture guardrail)", () => {
    expect(STORAGE_KEY.startsWith("todoapp_v1_")).toBe(true);
  });
});

describe("StorageAdapter — initializeStorage", () => {
  beforeEach(() => localStorageMock.clear());

  it("should write schema version on first initialization", () => {
    initializeStorage();
    expect(localStorage.getItem("todoapp_v1_schema_version")).toBe("1");
  });

  it("should not throw on repeated initialization calls", () => {
    expect(() => {
      initializeStorage();
      initializeStorage();
    }).not.toThrow();
  });
});

describe("StorageAdapter — saveTodos / loadTodos", () => {
  beforeEach(() => localStorageMock.clear());

  it("should return an empty array when no data is stored", () => {
    const result = loadTodos();
    expect(result).toEqual([]);
  });

  it("should persist and reload todos correctly (AC-2 regression: task-1779178940125)", () => {
    const todo = createTodo("Meeting with designer", "💼", {
      dueDate: "2025-02-01",
    });
    saveTodos([todo]);

    const loaded = loadTodos();
    expect(loaded).toHaveLength(1);
    expect(loaded[0]?.id).toBe(todo.id);
    expect(loaded[0]?.title).toBe("Meeting with designer");
    expect(loaded[0]?.emoji).toBe("💼");
    expect(loaded[0]?.completed).toBe(false);
  });

  it("should persist completed state and reload correctly (AC-3 regression)", () => {
    const todo: Todo = {
      ...createTodo("Finish report", "📝"),
      completed: true,
      completedAt: new Date().toISOString(),
    };
    saveTodos([todo]);

    const loaded = loadTodos();
    expect(loaded[0]?.completed).toBe(true);
    expect(loaded[0]?.completedAt).toBeDefined();
  });

  it("should persist multiple todos and reload all of them", () => {
    const todos = [
      createTodo("Task one", "🌸"),
      createTodo("Task two", "💼"),
      createTodo("Task three", "📚"),
    ];
    saveTodos(todos);

    const loaded = loadTodos();
    expect(loaded).toHaveLength(3);
    expect(loaded.map((t) => t.title)).toEqual([
      "Task one",
      "Task two",
      "Task three",
    ]);
  });

  it("should overwrite previous data on save", () => {
    saveTodos([createTodo("Old task", "🗑️")]);
    const newTodo = createTodo("New task", "✨");
    saveTodos([newTodo]);

    const loaded = loadTodos();
    expect(loaded).toHaveLength(1);
    expect(loaded[0]?.title).toBe("New task");
  });

  it("should skip corrupted entries without crashing", () => {
    // Manually inject a mix of valid and invalid data
    const valid = createTodo("Valid task", "✅");
    const corrupt = { id: 123, title: null }; // fails validateTodoData
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify([valid, corrupt])
    );

    const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const loaded = loadTodos();
    consoleSpy.mockRestore();

    expect(loaded).toHaveLength(1);
    expect(loaded[0]?.title).toBe("Valid task");
  });

  it("should return empty array when stored data is not an array", () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ bad: "data" }));
    const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const loaded = loadTodos();
    consoleSpy.mockRestore();
    expect(loaded).toEqual([]);
  });

  it("should return empty array when stored data is malformed JSON", () => {
    localStorage.setItem(STORAGE_KEY, "{{not_valid_json}}");
    const consoleSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    const loaded = loadTodos();
    consoleSpy.mockRestore();
    expect(loaded).toEqual([]);
  });
});

describe("StorageAdapter — clearAllTodos", () => {
  beforeEach(() => localStorageMock.clear());

  it("should remove all todos from storage", () => {
    saveTodos([createTodo("Task to clear", "🧹")]);
    clearAllTodos();
    expect(loadTodos()).toEqual([]);
  });

  it("should not throw when storage is already empty", () => {
    expect(() => clearAllTodos()).not.toThrow();
  });
});

describe("StorageAdapter — getStorageStats", () => {
  beforeEach(() => localStorageMock.clear());

  it("should return used and available as non-negative numbers", () => {
    saveTodos([createTodo("Stats test task", "📊")]);
    const stats = getStorageStats();
    expect(stats.used).toBeGreaterThan(0);
    expect(stats.available).toBeGreaterThanOrEqual(0);
  });

  it("should reflect zero used bytes on empty storage", () => {
    const stats = getStorageStats();
    expect(stats.used).toBe(0);
  });
});
