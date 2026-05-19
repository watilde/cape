import React, { useRef, useCallback } from 'react';
import { useConfetti } from '../../hooks/useConfetti';

// ---------------------------------------------------------------------------
// 型定義（既存プロジェクトの型に合わせて調整）
// ---------------------------------------------------------------------------
export interface Todo {
  id: string;
  title: string;
  description?: string;
  emoji: string;
  completed: boolean;
  completedAt?: number;
  createdAt: number;
  dueDate?: number;
}

interface TodoCardProps {
  todo: Todo;
  /** 完了操作後の残アクティブタスク数（confettiトリガー判定に使用） */
  remainingActiveCountAfterToggle: number;
  onToggleComplete: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (id: string) => void;
}

// ---------------------------------------------------------------------------
// TodoCard コンポーネント
// DA仕様: confettiエフェクトはTodoCard内のチェックボックス要素をエピセンターに使用
// ---------------------------------------------------------------------------
export const TodoCard: React.FC<TodoCardProps> = React.memo(
  ({
    todo,
    remainingActiveCountAfterToggle,
    onToggleComplete,
    onDelete,
    onEdit,
  }) => {
    const checkboxRef = useRef<HTMLButtonElement>(null);
    const { triggerCompletion } = useConfetti();

    const handleToggle = useCallback(() => {
      // DA仕様厳守:
      // 1. LocalStorage書き込み（onToggleComplete内）をエフェクト発火より前に完了
      // 2. confettiはUI副作用として後続で発火
      onToggleComplete(todo.id);

      // エフェクト発火（未完了 → 完了 の場合のみ）
      if (!todo.completed && checkboxRef.current) {
        triggerCompletion(checkboxRef.current, remainingActiveCountAfterToggle);
      }
    }, [
      todo.id,
      todo.completed,
      remainingActiveCountAfterToggle,
      onToggleComplete,
      triggerCompletion,
    ]);

    return (
      <article
        className={`todo-card ${todo.completed ? 'todo-card--completed' : ''}`}
        aria-label={`タスク: ${todo.title}`}
      >
        {/* チェックボックス — confettiエピセンター */}
        <button
          ref={checkboxRef}
          type="button"
          role="checkbox"
          aria-checked={todo.completed}
          aria-label={
            todo.completed
              ? `${todo.title} を未完了にする`
              : `${todo.title} を完了にする`
          }
          className={`todo-card__checkbox ${
            todo.completed ? 'todo-card__checkbox--checked' : ''
          }`}
          onClick={handleToggle}
        >
          {todo.completed && (
            <svg
              viewBox="0 0 12 10"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <path
                d="M1 5L4.5 8.5L11 1"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </button>

        {/* タスク内容 */}
        <div className="todo-card__content">
          <span className="todo-card__emoji" aria-hidden="true">
            {todo.emoji}
          </span>
          <div className="todo-card__text">
            <p
              className={`todo-card__title ${
                todo.completed ? 'todo-card__title--strikethrough' : ''
              }`}
            >
              {todo.title}
            </p>
            {todo.description && (
              <p className="todo-card__description">{todo.description}</p>
            )}
            {todo.dueDate && (
              <time
                className="todo-card__due-date"
                dateTime={new Date(todo.dueDate).toISOString()}
              >
                {new Date(todo.dueDate).toLocaleDateString('ja-JP', {
                  month: 'short',
                  day: 'numeric',
                })}
              </time>
            )}
          </div>
        </div>

        {/* アクション */}
        <div className="todo-card__actions">
          <button
            type="button"
            aria-label={`${todo.title} を編集`}
            className="todo-card__action-btn todo-card__action-btn--edit"
            onClick={() => onEdit(todo.id)}
          >
            <svg
              viewBox="0 0 16 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <path
                d="M11.5 2.5L13.5 4.5L5 13H3V11L11.5 2.5Z"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          <button
            type="button"
            aria-label={`${todo.title} を削除`}
            className="todo-card__action-btn todo-card__action-btn--delete"
            onClick={() => onDelete(todo.id)}
          >
            <svg
              viewBox="0 0 16 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <path
                d="M3 4H13M6 4V2H10V4M5 4V13H11V4H5Z"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
      </article>
    );
  },
);

TodoCard.displayName = 'TodoCard';
