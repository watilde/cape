/**
 * TodoCard.tsx
 * Effect-01（完了スパークル）・Effect-02（追加スライドイン）・Effect-03（削除フェードアウト）
 * を組み込んだTodoCardコンポーネント
 *
 * NOTE: 既存のTodoCard実装を置き換える。
 * 既存コンポーネントの構造・propsインターフェースに合わせて調整が必要な場合は
 * Open QuestionsでCMに報告すること（DA仕様逸脱防止）。
 */
import React, { useRef, useEffect, useCallback, useState } from 'react';
import { triggerSparkleEffect } from '../lib/effects';

export interface TodoItem {
  id: string;
  title: string;
  completed: boolean;
  emoji?: string;
  dueDate?: string;
  createdAt: number;
}

interface TodoCardProps {
  todo: TodoItem;
  isNew?: boolean; // effect-02トリガー用: TaskListから「新規追加されたカード」として渡される
  onToggleComplete: (id: string) => void;
  onDelete: (id: string) => void;
}

export const TodoCard: React.FC<TodoCardProps> = React.memo(({
  todo,
  isNew = false,
  onToggleComplete,
  onDelete,
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const checkboxRef = useRef<HTMLButtonElement>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const cleanupSparkleRef = useRef<(() => void) | null>(null);

  // Effect-02: 追加スライドイン
  useEffect(() => {
    if (isNew && cardRef.current) {
      const card = cardRef.current;
      card.classList.add('todo-card--entering');
      // DA仕様: 0.85s後にクラス削除
      const timer = setTimeout(() => {
        card.classList.remove('todo-card--entering');
      }, 850);
      return () => clearTimeout(timer);
    }
  }, [isNew]);

  // コンポーネントアンマウント時にスパークルクリーンアップ
  useEffect(() => {
    return () => {
      if (cleanupSparkleRef.current) {
        cleanupSparkleRef.current();
      }
    };
  }, []);

  // Effect-01: タスク完了スパークル
  const handleToggleComplete = useCallback(() => {
    if (isDeleting) return;

    // 既完了→未完了の場合はスパークルなし
    if (!todo.completed) {
      // チェックボックス中心座標を取得
      if (checkboxRef.current) {
        const rect = checkboxRef.current.getBoundingClientRect();
        const originX = rect.left + rect.width / 2;
        const originY = rect.top + rect.height / 2;

        // DA仕様: チェック完了後 0.05s ディレイでスパークル開始（CSS側でdelayを制御）
        if (cleanupSparkleRef.current) {
          cleanupSparkleRef.current();
        }
        cleanupSparkleRef.current = triggerSparkleEffect({ originX, originY });
      }

      // カード遷移アニメーション
      setIsCompleting(true);
    }

    onToggleComplete(todo.id);
  }, [todo.id, todo.completed, isDeleting, onToggleComplete]);

  // Effect-03: タスク削除フェードアウト
  const handleDelete = useCallback(() => {
    if (isDeleting) return;

    setIsDeleting(true);
    // OQ-03: animationend時点でstateを更新しReactのDOM管理に任せる
    // animationendイベントで onDelete を呼び出す
  }, [isDeleting]);

  const handleAnimationEnd = useCallback(
    (e: React.AnimationEvent<HTMLDivElement>) => {
      if (e.animationName === 'taskDeleteOut' && isDeleting) {
        // DA仕様: animationend後にDOMから削除 + LocalStorage更新
        // OQ-03準拠: React stateを更新することでDOMを削除
        onDelete(todo.id);
      }
    },
    [isDeleting, todo.id, onDelete],
  );

  const cardClassName = [
    'todo-card',
    todo.completed ? 'todo-card--completed' : '',
    isCompleting && !todo.completed ? 'todo-card--completing' : '',
    isDeleting ? 'todo-card--deleting' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      ref={cardRef}
      className={cardClassName}
      onAnimationEnd={handleAnimationEnd}
      data-testid={`todo-card-${todo.id}`}
    >
      {/* チェックボックス */}
      <button
        ref={checkboxRef}
        className={`todo-card__checkbox ${todo.completed ? 'todo-card__checkbox--checked' : ''}`}
        onClick={handleToggleComplete}
        aria-label={todo.completed ? `${todo.title}を未完了にする` : `${todo.title}を完了にする`}
        aria-pressed={todo.completed}
        disabled={isDeleting}
      >
        {todo.completed && (
          <svg
            className="todo-card__check-icon"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <path
              d="M5 13l4 4L19 7"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ animation: 'checkStroke 0.25s ease-out forwards' }}
            />
          </svg>
        )}
      </button>

      {/* タスク内容 */}
      <div className="todo-card__content">
        {todo.emoji && (
          <span className="todo-card__emoji" aria-hidden="true">
            {todo.emoji}
          </span>
        )}
        <span className={`todo-card__title ${todo.completed ? 'todo-card__title--completed' : ''}`}>
          {todo.title}
        </span>
        {todo.dueDate && (
          <span className="todo-card__due-date">{todo.dueDate}</span>
        )}
      </div>

      {/* 削除ボタン */}
      <button
        className="todo-card__delete-btn"
        onClick={handleDelete}
        aria-label={`${todo.title}を削除する`}
        disabled={isDeleting}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path
            d="M6 18L18 6M6 6l12 12"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </button>
    </div>
  );
});

TodoCard.displayName = 'TodoCard';
