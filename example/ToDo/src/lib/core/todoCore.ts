/**
 * TodoCoreモジュール
 * - Todo項目のライフサイクル管理
 * - 純粋ドメインロジック（外部依存なし）
 */
import { Todo, CreateTodoInput, UpdateTodoInput } from '../types/todo';

/**
 * ユニークIDを生成（timestamp + random suffix）
 */
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * 新しいTodoを生成する
 */
export function createTodo(input: CreateTodoInput): Todo {
  const { title, emoji } = input;

  if (!title || title.trim().length === 0) {
    throw new Error('タイトルは必須です');
  }
  if (title.trim().length > 100) {
    throw new Error('タイトルは100文字以内で入力してください');
  }
  if (!emoji) {
    throw new Error('絵文字は必須です');
  }

  return {
    id: generateId(),
    title: title.trim(),
    emoji,
    isCompleted: false,
    createdAt: Date.now(),
    completedAt: null,
  };
}

/**
 * 既存のTodoを更新する
 * isCompleted: true に変更された場合は completedAt を自動設定
 * isCompleted: false に変更された場合は completedAt をリセット
 */
export function updateTodo(todo: Todo, updates: UpdateTodoInput): Todo {
  const updated: Todo = { ...todo, ...updates };

  // 完了状態の整合性を保つ
  if (updates.isCompleted === true && todo.isCompleted === false) {
    updated.completedAt = Date.now();
  } else if (updates.isCompleted === false) {
    updated.completedAt = null;
  }

  if (!validateTodoData(updated)) {
    throw new Error('更新後のTodoデータが不正です');
  }

  return updated;
}

/**
 * データ構造の検証
 * runtime型ガード（TypeScript型安全性の補完）
 */
export function validateTodoData(data: unknown): data is Todo {
  if (typeof data !== 'object' || data === null) return false;

  const d = data as Record<string, unknown>;

  return (
    typeof d['id'] === 'string' &&
    d['id'].length > 0 &&
    typeof d['title'] === 'string' &&
    d['title'].length > 0 &&
    d['title'].length <= 100 &&
    typeof d['emoji'] === 'string' &&
    d['emoji'].length > 0 &&
    typeof d['isCompleted'] === 'boolean' &&
    typeof d['createdAt'] === 'number' &&
    (d['completedAt'] === null || typeof d['completedAt'] === 'number')
  );
}
