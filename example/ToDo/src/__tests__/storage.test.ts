/**
 * StorageAdapter Module ユニットテスト
 * localStorageモックを使用したテスト（テスト間の汚染なし）
 * 目標: 90%+ ラインカバレッジ
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  initializeStorage,
  saveTodos,
  loadTodos,
  clearAllTodos,
  setStorageEngine,
} from '../lib/storage';
import { createMockStorage } from './setup';
import type { Todo } from '../types/todo';
import { STORAGE_KEY, STORAGE_SCHEMA_KEY, STORAGE_SCHEMA_VERSION } from '../types/todo';

const sampleTodos: Todo[] = [
  { id: 'a', title: 'タスクA', completed: false, createdAt: 1000, completedAt: null },
  { id: 'b', title: 'タスクB', completed: true, createdAt: 2000, completedAt: 2001 },
];

let mockStorage: ReturnType<typeof createMockStorage>;

beforeEach(() => {
  mockStorage = createMockStorage();
  setStorageEngine(mockStorage);
});

describe('initializeStorage', () => {
  it('初回起動時にスキーマバージョンを書き込む', () => {
    initializeStorage();
    expect(mockStorage.setItem).toHaveBeenCalledWith(
      STORAGE_SCHEMA_KEY,
      String(STORAGE_SCHEMA_VERSION),
    );
  });

  it('スキーマバージョンが既に存在する場合は書き込まない', () => {
    mockStorage._store[STORAGE_SCHEMA_KEY] = String(STORAGE_SCHEMA_VERSION);
    initializeStorage();
    expect(mockStorage.setItem).not.toHaveBeenCalled();
  });
});

describe('saveTodos', () => {
  it('Todo配列をJSON文字列としてLocalStorageに保存する', () => {
    saveTodos(sampleTodos);
    expect(mockStorage.setItem).toHaveBeenCalledWith(STORAGE_KEY, JSON.stringify(sampleTodos));
  });

  it('空配列を保存できる', () => {
    saveTodos([]);
    expect(mockStorage.setItem).toHaveBeenCalledWith(STORAGE_KEY, '[]');
  });

  it('setItemがエラーをスローしてもクラッシュしない（クォータエラー対応）', () => {
    mockStorage.setItem = vi.fn().mockImplementation(() => {
      throw new DOMException('QuotaExceededError');
    });
    expect(() => saveTodos(sampleTodos)).not.toThrow();
  });
});

describe('loadTodos', () => {
  it('保存済みのTodosを正しく読み込む（AC-004-1）', () => {
    mockStorage._store[STORAGE_KEY] = JSON.stringify(sampleTodos);
    const loaded = loadTodos();
    expect(loaded).toHaveLength(2);
    expect(loaded[0].id).toBe('a');
    expect(loaded[1].id).toBe('b');
  });

  it('LocalStorageが空の場合は空配列を返す（AC-004-2）', () => {
    const loaded = loadTodos();
    expect(loaded).toEqual([]);
  });

  it('壊れたJSONの場合は空配列でフォールバックする（AC-004-2）', () => {
    mockStorage._store[STORAGE_KEY] = '{invalid json';
    const loaded = loadTodos();
    expect(loaded).toEqual([]);
  });

  it('バリデーション失敗のエントリを除外する', () => {
    const mixedData = [
      ...sampleTodos,
      { id: '', title: '無効', completed: false, createdAt: 0, completedAt: null },
    ];
    mockStorage._store[STORAGE_KEY] = JSON.stringify(mixedData);
    const loaded = loadTodos();
    expect(loaded).toHaveLength(2);
  });

  it('getItemがエラーをスローしても空配列を返す', () => {
    mockStorage.getItem = vi.fn().mockImplementation(() => {
      throw new Error('Storage error');
    });
    const loaded = loadTodos();
    expect(loaded).toEqual([]);
  });
});

describe('clearAllTodos', () => {
  it('LocalStorageからTodoキーを削除する', () => {
    mockStorage._store[STORAGE_KEY] = JSON.stringify(sampleTodos);
    clearAllTodos();
    expect(mockStorage.removeItem).toHaveBeenCalledWith(STORAGE_KEY);
  });

  it('removeItemがエラーをスローしてもクラッシュしない', () => {
    mockStorage.removeItem = vi.fn().mockImplementation(() => {
      throw new Error('Storage error');
    });
    expect(() => clearAllTodos()).not.toThrow();
  });
});

describe('saveTodos → loadTodos 統合フロー', () => {
  it('保存したTodosを完全に復元できる（AC-001-3 / AC-002-3 / AC-003-2 / AC-004-1）', () => {
    saveTodos(sampleTodos);
    const loaded = loadTodos();
    expect(loaded).toEqual(sampleTodos);
  });

  it('完了状態を含むTodosを正確に保存・復元する', () => {
    const completedTodos: Todo[] = [
      { id: 'x', title: '完了タスク', completed: true, createdAt: 5000, completedAt: 5001 },
    ];
    saveTodos(completedTodos);
    const loaded = loadTodos();
    expect(loaded[0].completed).toBe(true);
    expect(loaded[0].completedAt).toBe(5001);
  });
});
