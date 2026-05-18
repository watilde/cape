/**
 * TodoCore Module
 * 純粋なドメインロジック——外部依存なし、副作用なし
 * LocalStorage・React・DOM一切触らない
 */

import type { Todo } from '../types/todo';

/**
 * タイムスタンプベースのUUID生成
 * 同一ミリ秒内の衝突を防ぐためランダムサフィックスを追加
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * 新しいTodoオブジェクトを生成する
 * AC-001-1: タスク作成でリストに追加される
 */
export function createTodo(title: string): Todo {
  const trimmed = title.trim();
  if (trimmed.length === 0) {
    throw new Error('タスクのタイトルは空にできません');
  }
  if (trimmed.length > 100) {
    throw new Error('タスクのタイトルは100文字以内にしてください');
  }
  return {
    id: generateId(),
    title: trimmed,
    completed: false,
    createdAt: Date.now(),
    completedAt: null,
  };
}

/**
 * Todoのプロパティを更新する（イミュータブル）
 * AC-002-1: 完了状態のトグル
 */
export function updateTodo(todo: Todo, updates: Partial<Pick<Todo, 'title' | 'completed' | 'completedAt'>>): Todo {
  const updated = { ...todo, ...updates };

  // completedがtrueになった場合はcompletedAtを自動設定
  if (updates.completed === true && todo.completed === false) {
    updated.completedAt = Date.now();
  }
  // completedがfalseに戻った場合はcompletedAtをクリア
  if (updates.completed === false) {
    updated.completedAt = null;
  }

  return updated;
}

/**
 * ランタイムバリデーション：パース済みデータがTodo型かどうか確認する
 * StorageAdapterでのデシリアライズ後に使用
 */
export function validateTodoData(data: unknown): data is Todo {
  if (typeof data !== 'object' || data === null) return false;
  const d = data as Record<string, unknown>;
  return (
    typeof d['id'] === 'string' &&
    d['id'].length > 0 &&
    typeof d['title'] === 'string' &&
    typeof d['completed'] === 'boolean' &&
    typeof d['createdAt'] === 'number' &&
    (d['completedAt'] === null || typeof d['completedAt'] === 'number')
  );
}

/**
 * 配列からTodoを安全にバリデートする（壊れたエントリは除外）
 */
export function validateTodoArray(data: unknown): Todo[] {
  if (!Array.isArray(data)) return [];
  return data.filter(validateTodoData);
}

/**
 * Todo配列をcreatedAtの降順（新しい順）にソート
 */
export function sortTodosByCreatedAt(todos: Todo[]): Todo[] {
  return [...todos].sort((a, b) => b.createdAt - a.createdAt);
}
