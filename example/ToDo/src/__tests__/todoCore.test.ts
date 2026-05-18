/**
 * TodoCore Module ユニットテスト
 * 純粋関数のため外部依存なし
 * 目標: 90%+ ラインカバレッジ
 */

import { describe, it, expect } from 'vitest';
import {
  createTodo,
  updateTodo,
  validateTodoData,
  validateTodoArray,
  sortTodosByCreatedAt,
  generateId,
} from '../lib/todoCore';
import type { Todo } from '../types/todo';

describe('generateId', () => {
  it('一意なIDを生成する', () => {
    const id1 = generateId();
    const id2 = generateId();
    expect(id1).not.toBe(id2);
  });

  it('文字列を返す', () => {
    expect(typeof generateId()).toBe('string');
  });
});

describe('createTodo', () => {
  it('有効なタイトルでTodoを生成する', () => {
    const todo = createTodo('テストタスク');
    expect(todo.title).toBe('テストタスク');
    expect(todo.completed).toBe(false);
    expect(todo.completedAt).toBeNull();
    expect(typeof todo.id).toBe('string');
    expect(typeof todo.createdAt).toBe('number');
  });

  it('タイトルの前後の空白をトリムする', () => {
    const todo = createTodo('  スペース付きタスク  ');
    expect(todo.title).toBe('スペース付きタスク');
  });

  it('空文字列でエラーをスローする（AC-001-2）', () => {
    expect(() => createTodo('')).toThrow();
  });

  it('空白のみの文字列でエラーをスローする', () => {
    expect(() => createTodo('   ')).toThrow();
  });

  it('100文字を超えるタイトルでエラーをスローする', () => {
    const longTitle = 'あ'.repeat(101);
    expect(() => createTodo(longTitle)).toThrow();
  });

  it('ちょうど100文字のタイトルは有効', () => {
    const exactTitle = 'あ'.repeat(100);
    const todo = createTodo(exactTitle);
    expect(todo.title).toBe(exactTitle);
  });
});

describe('updateTodo', () => {
  const baseTodo: Todo = {
    id: 'test-id',
    title: 'テストタスク',
    completed: false,
    createdAt: 1000000,
    completedAt: null,
  };

  it('completedをtrueにするとcompletedAtが設定される（AC-002-1）', () => {
    const updated = updateTodo(baseTodo, { completed: true });
    expect(updated.completed).toBe(true);
    expect(updated.completedAt).not.toBeNull();
    expect(typeof updated.completedAt).toBe('number');
  });

  it('completedをfalseに戻すとcompletedAtがnullになる（AC-002-2）', () => {
    const completedTodo = { ...baseTodo, completed: true, completedAt: 1000001 };
    const updated = updateTodo(completedTodo, { completed: false });
    expect(updated.completed).toBe(false);
    expect(updated.completedAt).toBeNull();
  });

  it('イミュータブル更新——元のTodoを変更しない', () => {
    const updated = updateTodo(baseTodo, { completed: true });
    expect(baseTodo.completed).toBe(false);
    expect(updated).not.toBe(baseTodo);
  });

  it('タイトルを更新できる', () => {
    const updated = updateTodo(baseTodo, { title: '更新後タスク' });
    expect(updated.title).toBe('更新後タスク');
  });
});

describe('validateTodoData', () => {
  const validTodo: Todo = {
    id: 'valid-id',
    title: '有効なタスク',
    completed: false,
    createdAt: 1000000,
    completedAt: null,
  };

  it('有効なTodoオブジェクトをtrueで検証する', () => {
    expect(validateTodoData(validTodo)).toBe(true);
  });

  it('completedAtがnumberでも有効', () => {
    expect(validateTodoData({ ...validTodo, completedAt: 1000001 })).toBe(true);
  });

  it('nullをfalseで返す', () => {
    expect(validateTodoData(null)).toBe(false);
  });

  it('undefinedをfalseで返す', () => {
    expect(validateTodoData(undefined)).toBe(false);
  });

  it('idが空文字列の場合falseで返す', () => {
    expect(validateTodoData({ ...validTodo, id: '' })).toBe(false);
  });

  it('completedがboolean以外の場合falseで返す', () => {
    expect(validateTodoData({ ...validTodo, completed: 'true' })).toBe(false);
  });

  it('createdAtがnumberでない場合falseで返す', () => {
    expect(validateTodoData({ ...validTodo, createdAt: '2024-01-01' })).toBe(false);
  });
});

describe('validateTodoArray', () => {
  it('有効なTodo配列をそのまま返す', () => {
    const todos: Todo[] = [
      { id: 'a', title: 'タスクA', completed: false, createdAt: 1, completedAt: null },
      { id: 'b', title: 'タスクB', completed: true, createdAt: 2, completedAt: 3 },
    ];
    expect(validateTodoArray(todos)).toHaveLength(2);
  });

  it('壊れたエントリを除外する', () => {
    const mixed = [
      { id: 'good', title: '有効', completed: false, createdAt: 1, completedAt: null },
      { id: '', title: '無効IDなし', completed: false, createdAt: 1, completedAt: null },
      null,
      'string',
    ];
    const result = validateTodoArray(mixed);
    expect(result).toHaveLength(1);
  });

  it('配列でない入力は空配列を返す（AC-004-2）', () => {
    expect(validateTodoArray(null)).toEqual([]);
    expect(validateTodoArray({})).toEqual([]);
    expect(validateTodoArray('string')).toEqual([]);
  });

  it('空配列は空配列を返す', () => {
    expect(validateTodoArray([])).toEqual([]);
  });
});

describe('sortTodosByCreatedAt', () => {
  it('createdAtの降順（新しい順）でソートする', () => {
    const todos: Todo[] = [
      { id: 'old', title: '古い', completed: false, createdAt: 1000, completedAt: null },
      { id: 'new', title: '新しい', completed: false, createdAt: 3000, completedAt: null },
      { id: 'mid', title: '中間', completed: false, createdAt: 2000, completedAt: null },
    ];
    const sorted = sortTodosByCreatedAt(todos);
    expect(sorted[0].id).toBe('new');
    expect(sorted[1].id).toBe('mid');
    expect(sorted[2].id).toBe('old');
  });

  it('イミュータブル——元の配列を変更しない', () => {
    const todos: Todo[] = [
      { id: 'a', title: 'A', completed: false, createdAt: 1, completedAt: null },
    ];
    const sorted = sortTodosByCreatedAt(todos);
    expect(sorted).not.toBe(todos);
  });
});
