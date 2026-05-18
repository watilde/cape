/**
 * StorageAdapterユニットテスト
 * localStorage はjest-environment-jsdomのモックを使用
 */
import {
  saveTodos,
  loadTodos,
  clearAllTodos,
  initializeStorage,
} from '../lib/storage/storageAdapter';
import { Todo } from '../lib/types/todo';

const STORAGE_KEY = 'todoapp_v1_todos';
const SCHEMA_VERSION_KEY = 'todoapp_v1_schema_version';

const mockTodo: Todo = {
  id: 'test-1',
  title: 'テストタスク',
  emoji: '📝',
  isCompleted: false,
  createdAt: 1000000,
  completedAt: null,
};

const completedTodo: Todo = {
  id: 'test-2',
  title: '完了タスク',
  emoji: '✅',
  isCompleted: true,
  createdAt: 1000001,
  completedAt: 1000100,
};

beforeEach(() => {
  localStorage.clear();
});

describe('saveTodos / loadTodos', () => {
  it('Todoを保存して読み込める', () => {
    saveTodos([mockTodo, completedTodo]);
    const loaded = loadTodos();
    expect(loaded).toHaveLength(2);
    expect(loaded[0].id).toBe('test-1');
    expect(loaded[1].isCompleted).toBe(true);
  });

  it('空配列を保存して読み込むと空配列が返る', () => {
    saveTodos([]);
    expect(loadTodos()).toEqual([]);
  });

  it('storageが空の場合は空配列を返す', () => {
    expect(loadTodos()).toEqual([]);
  });

  it('不正なJSONが保存されている場合は空配列を返す', () => {
    localStorage.setItem(STORAGE_KEY, 'INVALID JSON{{{');
    expect(loadTodos()).toEqual([]);
  });

  it('部分的に不正なデータを含む配列は正常データのみ返す', () => {
    const mixed = [
      mockTodo,
      { id: 'bad', title: '' }, // 不正（titleが空）
    ];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(mixed));
    const loaded = loadTodos();
    expect(loaded).toHaveLength(1);
    expect(loaded[0].id).toBe('test-1');
  });
});

describe('clearAllTodos', () => {
  it('保存したTodoをクリアできる', () => {
    saveTodos([mockTodo]);
    clearAllTodos();
    expect(loadTodos()).toEqual([]);
  });
});

describe('initializeStorage — マイグレーション', () => {
  it('isCompletedなしの旧データをfalseに正規化する', () => {
    const legacyData = [
      {
        id: 'legacy-1',
        title: '旧タスク',
        emoji: '📋',
        createdAt: 999999,
        completedAt: null,
        // isCompleted: なし（旧スキーマ）
      },
    ];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(legacyData));
    localStorage.setItem(SCHEMA_VERSION_KEY, '1'); // v1スキーマとしてマーク

    initializeStorage();

    const loaded = loadTodos();
    expect(loaded).toHaveLength(1);
    expect(loaded[0].isCompleted).toBe(false);
  });

  it('既にv2スキーマの場合マイグレーションをスキップする', () => {
    saveTodos([completedTodo]);
    localStorage.setItem(SCHEMA_VERSION_KEY, '2');

    initializeStorage(); // 2回目呼び出し

    const loaded = loadTodos();
    expect(loaded).toHaveLength(1);
    expect(loaded[0].isCompleted).toBe(true);
  });
});
