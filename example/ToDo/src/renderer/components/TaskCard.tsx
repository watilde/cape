import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import { Todo } from '../../lib/todo/TodoCore';
import { MAX_TITLE_LENGTH } from '../../lib/todo/TodoCore';
import { useTodoContext } from '../contexts/TodoContext';
import { useLongPress } from '../hooks/useLongPress';
import SaveConfirmBadge from './SaveConfirmBadge';
import EditHintText from './EditHintText';

interface TaskCardProps {
  todo: Todo;
}

interface TooltipState {
  visible: boolean;
  message: string;
}

const TaskCard: React.FC<TaskCardProps> = ({ todo }) => {
  const { editingId, setEditingId, updateTodoItem, toggleComplete } = useTodoContext();

  const isEditing = editingId === todo.id;

  // ─── ローカル状態 ──────────────────────────────────────────────────────────
  const [editText, setEditText] = useState(todo.title);
  const [isError, setIsError] = useState(false);
  const [showSaveBadge, setShowSaveBadge] = useState(false);
  const [isShaking, setIsShaking] = useState(false);
  const [tooltip, setTooltip] = useState<TooltipState>({ visible: false, message: '' });

  const inputRef = useRef<HTMLInputElement>(null);
  const tooltipTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const shakeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ─── 編集モード開始時にフォーカス・全選択 ─────────────────────────────────
  useEffect(() => {
    if (isEditing) {
      setEditText(todo.title);
      setIsError(false);
      requestAnimationFrame(() => {
        if (inputRef.current) {
          inputRef.current.focus();
          inputRef.current.select();
        }
      });
    }
  }, [isEditing, todo.title]);

  // ─── クリーンアップ ────────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      if (tooltipTimerRef.current) clearTimeout(tooltipTimerRef.current);
      if (shakeTimerRef.current) clearTimeout(shakeTimerRef.current);
    };
  }, []);

  // ─── シェイクアニメーション ────────────────────────────────────────────────
  const triggerShake = useCallback(() => {
    setIsShaking(true);
    if (shakeTimerRef.current) clearTimeout(shakeTimerRef.current);
    shakeTimerRef.current = setTimeout(() => setIsShaking(false), 350);
  }, []);

  // ─── ツールチップ表示 ──────────────────────────────────────────────────────
  const showTooltip = useCallback((message: string) => {
    setTooltip({ visible: true, message });
    if (tooltipTimerRef.current) clearTimeout(tooltipTimerRef.current);
    tooltipTimerRef.current = setTimeout(
      () => setTooltip({ visible: false, message: '' }),
      2000
    );
  }, []);

  // ─── 編集開始ロジック ──────────────────────────────────────────────────────
  const startEditing = useCallback(() => {
    if (todo.isCompleted) {
      triggerShake();
      showTooltip('完了済みのタスクです。編集するには完了を解除してください');
      return;
    }
    setEditingId(todo.id);
  }, [todo.isCompleted, todo.id, setEditingId, triggerShake, showTooltip]);

  // ─── 保存ロジック ──────────────────────────────────────────────────────────
  const commitEdit = useCallback(() => {
    const trimmed = editText.trim();
    if (!trimmed) {
      setIsError(true);
      triggerShake();
      // フォーカスを維持
      inputRef.current?.focus();
      return false;
    }
    if (trimmed !== todo.title) {
      updateTodoItem(todo.id, { title: trimmed });
    }
    setIsError(false);
    setEditingId(null);
    setShowSaveBadge(true);
    return true;
  }, [editText, todo.id, todo.title, updateTodoItem, setEditingId, triggerShake]);

  // ─── フォーカスアウト保存（空文字は静かにロールバック） ────────────────────
  const handleBlur = useCallback(() => {
    if (!isEditing) return;
    const trimmed = editText.trim();
    if (!trimmed) {
      // 空文字の場合は静かに元に戻す
      setEditText(todo.title);
      setIsError(false);
      setEditingId(null);
      return;
    }
    commitEdit();
  }, [isEditing, editText, todo.title, commitEdit, setEditingId]);

  // ─── キーボードイベント ────────────────────────────────────────────────────
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        commitEdit();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setEditText(todo.title);
        setIsError(false);
        setEditingId(null);
      }
    },
    [commitEdit, todo.title, setEditingId]
  );

  // ─── ダブルクリック ────────────────────────────────────────────────────────
  const handleDoubleClick = useCallback(() => {
    startEditing();
  }, [startEditing]);

  // ─── F2キーで編集起動（キーボードナビ用） ──────────────────────────────────
  const handleCardKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (e.key === 'F2' && !isEditing) {
        e.preventDefault();
        startEditing();
      }
    },
    [isEditing, startEditing]
  );

  // ─── 長押し（モバイル） ────────────────────────────────────────────────────
  const longPressHandlers = useLongPress({
    threshold: 300,
    onLongPress: startEditing,
  });

  // ─── 完了トグル ────────────────────────────────────────────────────────────
  const handleToggleComplete = useCallback(
    (e: React.MouseEvent | React.KeyboardEvent) => {
      e.stopPropagation();
      if (isEditing) return; // 編集中は無効（CSS pointer-events: none でも保護済み）
      toggleComplete(todo.id);
    },
    [isEditing, toggleComplete, todo.id]
  );

  // ─── CSS クラス構築 ────────────────────────────────────────────────────────
  const cardClasses = [
    'task-item',
    todo.isCompleted ? 'task-item--completed' : '',
    isEditing ? 'task-item--editing' : '',
    isError ? 'task-item--editing-error' : '',
    isShaking ? 'task-item--shaking' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      className={cardClasses}
      onKeyDown={handleCardKeyDown}
      tabIndex={0}
      role="listitem"
      aria-label={
        todo.isCompleted
          ? `完了済みタスク: ${todo.title}（編集するには完了を解除してください）`
          : `タスク: ${todo.title}`
      }
    >
      {/* ツールチップ */}
      {tooltip.visible && (
        <div className="task-item__tooltip" role="tooltip">
          {tooltip.message}
        </div>
      )}

      {/* チェックボックス */}
      <button
        className={`task-item__checkbox${isEditing ? ' task-item__checkbox--disabled' : ''}`}
        onClick={handleToggleComplete}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') handleToggleComplete(e);
        }}
        aria-checked={todo.isCompleted}
        aria-label={todo.isCompleted ? '完了を解除する' : 'タスクを完了にする'}
        aria-disabled={isEditing}
        tabIndex={isEditing ? -1 : 0}
        type="button"
      >
        {todo.isCompleted ? '✓' : ''}
      </button>

      {/* テキスト / 入力フィールド */}
      <div className="task-item__content">
        {isEditing ? (
          <>
            <input
              ref={inputRef}
              type="text"
              className="task-item__edit-input"
              value={editText}
              onChange={(e) => {
                setEditText(e.target.value);
                if (isError && e.target.value.trim()) setIsError(false);
              }}
              onKeyDown={handleKeyDown}
              onBlur={handleBlur}
              maxLength={MAX_TITLE_LENGTH}
              aria-label={`タスクを編集: ${todo.title}`}
              aria-invalid={isError}
              aria-describedby={`task-edit-hint-${todo.id}`}
              placeholder="タスクを入力してください"
            />
            <span id={`task-edit-hint-${todo.id}`}>
              <EditHintText isError={isError} />
            </span>
          </>
        ) : (
          <span
            className="task-item__title"
            onDoubleClick={handleDoubleClick}
            {...longPressHandlers}
            aria-label={
              todo.isCompleted
                ? undefined
                : 'ダブルクリックまたは長押しで編集'
            }
          >
            <span className="task-item__emoji">{todo.emoji}</span>
            {todo.title}
          </span>
        )}
      </div>

      {/* 保存成功バッジ */}
      <SaveConfirmBadge
        visible={showSaveBadge}
        onAnimationComplete={() => setShowSaveBadge(false)}
      />
    </div>
  );
};

export default React.memo(TaskCard);
