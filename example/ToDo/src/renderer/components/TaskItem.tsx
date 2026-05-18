/**
 * TaskItemコンポーネント
 * - 完了状態対応のタスク行
 * - DAハンドオフノート: task-item--completed クラスでCSSスタイル全制御
 * - スパークルエフェクトは完了方向のみトリガー
 */
import React, { useCallback, useRef, useEffect } from 'react';
import { Todo } from '../../lib/types/todo';
import { CompletionToggle } from './CompletionToggle';
import { useSparkle } from '../hooks/useSparkle';

interface TaskItemProps {
  todo: Todo;
  onToggleCompletion: (id: string) => void;
  onRemove: (id: string) => void;
}

export const TaskItem = React.memo(function TaskItem({
  todo,
  onToggleCompletion,
  onRemove,
}: TaskItemProps): JSX.Element {
  const checkboxRef = useRef<HTMLDivElement>(null);
  const { triggerSparkle } = useSparkle();
  const prevCompletedRef = useRef<boolean>(todo.isCompleted);

  // 完了方向のトグル時のみスパークル発火
  useEffect(() => {
    const wasCompleted = prevCompletedRef.current;
    const isNowCompleted = todo.isCompleted;

    if (!wasCompleted && isNowCompleted && checkboxRef.current) {
      triggerSparkle(checkboxRef.current);
    }

    prevCompletedRef.current = isNowCompleted;
  }, [todo.isCompleted, triggerSparkle]);

  const handleToggle = useCallback(
    (id: string) => {
      onToggleCompletion(id);
    },
    [onToggleCompletion]
  );

  const handleRemove = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onRemove(todo.id);
    },
    [todo.id, onRemove]
  );

  return (
    <li
      className={`task-item${todo.isCompleted ? ' task-item--completed' : ''}`}
      data-testid={`task-item-${todo.id}`}
      aria-label={`タスク: ${todo.title}${todo.isCompleted ? '（完了済み）' : ''}`}
    >
      {/* チェックボックス領域（スパークル基準点） */}
      <div ref={checkboxRef} className="task-item__toggle-wrapper">
        <CompletionToggle
          isCompleted={todo.isCompleted}
          todoId={todo.id}
          todoTitle={todo.title}
          onToggle={handleToggle}
        />
      </div>

      {/* タスク内容 */}
      <div className="task-item__content">
        <span className="task-item__emoji" aria-hidden="true">
          {todo.emoji}
        </span>
        <span className="task-item__title" data-testid={`task-title-${todo.id}`}>
          {todo.title}
        </span>
      </div>

      {/* アクションエリア */}
      <div className="task-item__actions">
        <button
          className="task-item__delete-button"
          onClick={handleRemove}
          type="button"
          aria-label={`${todo.title} を削除する`}
          data-testid={`delete-button-${todo.id}`}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <path
              d="M3 4H13M6 4V2.5C6 2.22386 6.22386 2 6.5 2H9.5C9.77614 2 10 2.22386 10 2.5V4M5.5 7V12M8 7V12M10.5 7V12M4.5 4L5 13.5C5 13.7761 5.22386 14 5.5 14H10.5C10.7761 14 11 13.7761 11 13.5L11.5 4H4.5Z"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>
    </li>
  );
});
