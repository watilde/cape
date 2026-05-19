/**
 * constants.ts — Unit Tests
 *
 * Regression guard for task-1779178940125:
 * Verifies that STORAGE_KEY and other constants are correctly exported
 * from src/lib/constants.ts and NOT from src/types/todo.ts.
 */

import { describe, it, expect } from "vitest";
import {
  STORAGE_KEY,
  FILTER_PREFERENCES_KEY,
  UI_PREFERENCES_KEY,
  UNDO_STACK_KEY,
  TELEMETRY_OPT_OUT_KEY,
  STORAGE_SCHEMA_VERSION,
} from "../lib/constants";

describe("constants.ts — all exports present and typed correctly", () => {
  it("STORAGE_KEY is a string with todoapp_v1_ prefix", () => {
    expect(typeof STORAGE_KEY).toBe("string");
    expect(STORAGE_KEY).toMatch(/^todoapp_v1_/);
  });

  it("FILTER_PREFERENCES_KEY is a non-empty string", () => {
    expect(typeof FILTER_PREFERENCES_KEY).toBe("string");
    expect(FILTER_PREFERENCES_KEY.length).toBeGreaterThan(0);
  });

  it("UI_PREFERENCES_KEY is a non-empty string", () => {
    expect(typeof UI_PREFERENCES_KEY).toBe("string");
    expect(UI_PREFERENCES_KEY.length).toBeGreaterThan(0);
  });

  it("UNDO_STACK_KEY is a non-empty string", () => {
    expect(typeof UNDO_STACK_KEY).toBe("string");
    expect(UNDO_STACK_KEY.length).toBeGreaterThan(0);
  });

  it("TELEMETRY_OPT_OUT_KEY is a non-empty string", () => {
    expect(typeof TELEMETRY_OPT_OUT_KEY).toBe("string");
    expect(TELEMETRY_OPT_OUT_KEY.length).toBeGreaterThan(0);
  });

  it("STORAGE_SCHEMA_VERSION is a positive integer", () => {
    expect(typeof STORAGE_SCHEMA_VERSION).toBe("number");
    expect(STORAGE_SCHEMA_VERSION).toBeGreaterThan(0);
    expect(Number.isInteger(STORAGE_SCHEMA_VERSION)).toBe(true);
  });

  it("all keys are unique — no accidental duplicate values", () => {
    const keys = [
      STORAGE_KEY,
      FILTER_PREFERENCES_KEY,
      UI_PREFERENCES_KEY,
      UNDO_STACK_KEY,
      TELEMETRY_OPT_OUT_KEY,
    ];
    const uniqueKeys = new Set(keys);
    expect(uniqueKeys.size).toBe(keys.length);
  });
});

describe("constants.ts — STORAGE_KEY value stability (data migration guard)", () => {
  /**
   * This test is intentionally hardcoded.
   * If STORAGE_KEY value ever needs to change, a storage migration routine
   * must be implemented in StorageAdapter BEFORE this test is updated.
   * Changing this constant without a migration causes data loss for existing users.
   */
  it("STORAGE_KEY value matches the canonical expected string", () => {
    expect(STORAGE_KEY).toBe("todoapp_v1_todos");
  });
});
