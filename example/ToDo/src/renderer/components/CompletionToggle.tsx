/**
 * CompletionToggleコンポーネント
 * - DAハンドオフノートに準拠したカスタムチェックボックス
 * - 44×44pxタッチターゲット、24×24px視覚サイズ
 * - role="checkbox", aria-checked, キーボード操作対応
 */
import React, { useCallback, KeyboardEvent } from 'react';

interface CompletionToggleProps {
  isCompleted: boolean;
  todoId: string;
  todoTitle: string;
  onToggle: (id: string) => void;
  disabled?: boolean;
}

export const CompletionToggle = React.memo(function CompletionToggle({
  isCompleted,
  todoId,
  todoTitle,
  onToggle,
  disabled = false,
}: CompletionToggleProps): JSX.Element {
  const handleClick = useCallback(() => {
    if (!disabled) {
      onToggle(todoId);
    }
  }, [todoId, onToggle, disabled]);

  // Space / Enter キーでトグル（WAI-ARIA準拠）
  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLButtonElement>) => {
      if ((e.key === ' ' || e.key === 'Enter') && !disabled) {
        e.preventDefault();
        onToggle(todoId);
      }
    },
    [todoId, onToggle, disabled]
  );

  const ariaLabel = isCompleted
    ? `${todoTitle} の完了を解除する`
    : `${todoTitle} を完了にする`;

  return (
    <button
      className="completion-toggle"
      role="checkbox"
      aria-checked={isCompleted}
      aria-label={ariaLabel}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      disabled={disabled}
      type="button"
      data-testid={`completion-toggle-${todoId}`}
    >
      <span className={`completion-toggle__circle${isCompleted ? ' completion-toggle__circle--checked' : ''}`}>
        {isCompleted && (
          <svg
            className="completion-toggle__checkmark"
            width="12"
            height="10"
            viewBox="0 0 12 10"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <path
              d="M1 5L4.5 8.5L11 1.5"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </span>
    </button>
  );
});
