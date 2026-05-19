import React, { useRef, useState, useEffect, memo, KeyboardEvent } from 'react';
import { Todo } from '../../types/todo';
import { useLongPress } from '../../hooks/useLongPress';
import { useInlineEdit, TITLE_MAX_LENGTH } from '../../hooks/useInlineEdit';
import { useTodoContext } from '../../context/TodoContext';
import './TaskItem.css';

interface TaskItemProps {
  todo: Todo;
}

const VALIDATION_MESSAGES: Record<NonNullable<ReturnType<typeof useInlineEdit>['validationError']>, string> = {
  empty: 'タスク名を入力してください',
  over_limit: `${TITLE_MAX_LENGTH}文字以内で入力してください`,
};

function TaskItemInner({ todo }: TaskItemProps) {
  const { editingId, setEditingId, updateTodo, deleteTodo } = useTodoContext();

  // -------------------------------------------------------------------------
  // aria-live ref for screen reader announcements
  // -------------------------------------------------------------------------
  const ariaLiveRef = useRef<HTMLSpanElement>(null);

  const announce = (message: string) => {
    if (ariaLiveRef.current) {
      ariaLiveRef.current.textContent = '';
      // Force re-read by resetting then setting
      requestAnimationFrame(() => {
        if (ariaLiveRef.current) ariaLiveRef.current.textContent = message;
      });
    }
  };

  // -------------------------------------------------------------------------
  // Save flash animation state
  // -------------------------------------------------------------------------
  const [isSaveFlashing, setIsSaveFlashing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // -------------------------------------------------------------------------
  // Lock tooltip state (shown briefly on attempted edit of completed todo)
  // -------------------------------------------------------------------------
  const [showLockTooltip, setShowLockTooltip] = useState(false);
  const lockTooltipTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // -------------------------------------------------------------------------
  // Inline edit hook
  // -------------------------------------------------------------------------
  const {
    isEditing,
    inputValue,
    validationError,
    charCount,
    charCountState,
    isShaking,
    inputRef,
    startEditing,
    handleChange,
    handleKeyDown,
    handleBlur,
    handleContainerKeyDown,
    handleDoubleClick,
    handleShakeEnd,
  } = useInlineEdit({
    todoId: todo.id,
    initialTitle: todo.title,
    isCompleted: todo.completed,
    editingId,
    onSave: (id, newTitle) => {
      updateTodo(id, { title: newTitle });
      setEditingId(null);
      announce('編集を保存しました');
      // Trigger saveFlash animation
      setIsSaveFlashing(true);
    },
    onStartEdit: (id) => {
      setEditingId(id);
      announce('編集モードになりました');
    },
    onCancelEdit: () => {
      setEditingId(null);
      announce('編集をキャンセルしました');
    },
  });

  // Remove save flash class after animation completes (400ms)
  useEffect(() => {
    if (!isSaveFlashing) return;
    const timer = setTimeout(() => setIsSaveFlashing(false), 400);
    return () => clearTimeout(timer);
  }, [isSaveFlashing]);

  // Show lock tooltip and auto-dismiss (1800ms per DA spec)
  const triggerLockTooltip = () => {
    setShowLockTooltip(true);
    if (lockTooltipTimerRef.current) clearTimeout(lockTooltipTimerRef.current);
    lockTooltipTimerRef.current = setTimeout(() => setShowLockTooltip(false), 1800);
  };

  useEffect(() => {
    return () => {
      if (lockTooltipTimerRef.current) clearTimeout(lockTooltipTimerRef.current);
    };
  }, []);

  // When a completed todo is attempted to be edited, show shake + tooltip
  const handleLockedInteraction = () => {
    if (todo.completed) {
      triggerLockTooltip();
      // startEditing internally calls setIsShaking for completed todos
      startEditing();
    }
  };

  // -------------------------------------------------------------------------
  // Long press handlers
  // -------------------------------------------------------------------------
  const longPressHandlers = useLongPress({
    onLongPress: () => {
      if (todo.completed) {
        handleLockedInteraction();
      } else {
        startEditing();
      }
    },
    threshold: 500,
  });

  // -------------------------------------------------------------------------
  // Toggle completion
  // -------------------------------------------------------------------------
  const handleToggle = () => {
    if (isEditing) {
      setEditingId(null);
    }
    updateTodo(todo.id, {
      completed: !todo.completed,
      completedAt: !todo.completed ? Date.now() : undefined,
    });
  };

  // -------------------------------------------------------------------------
  // Delete
  // -------------------------------------------------------------------------
  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    deleteTodo(todo.id);
  };

  // -------------------------------------------------------------------------
  // Auto-grow textarea height
  // -------------------------------------------------------------------------
  useEffect(() => {
    if (isEditing && inputRef.current) {
      const el = inputRef.current;
      el.style.height = 'auto';
      el.style.height = `${Math.min(el.scrollHeight, 72)}px`;
    }
  }, [isEditing, inputValue, inputRef]);

  // -------------------------------------------------------------------------
  // Build class names
  // -------------------------------------------------------------------------
  const containerClasses = [
    'task-item',
    todo.completed ? 'task-item--completed task-item--locked' : '',
    isEditing ? 'task-item--editing' : '',
    isEditing && validationError ? 'task-item--error' : '',
    isShaking ? 'task-item--shake' : '',
    isSaveFlashing ? 'task-item--save-flash' : '',
  ]
    .filter(Boolean)
    .join(' ');

  // -------------------------------------------------------------------------
  // Double-click guard: only fire startEditing if not completed
  // -------------------------------------------------------------------------
  const onDoubleClick = () => {
    if (todo.completed) {
      handleLockedInteraction();
    } else {
      handleDoubleClick();
    }
  };

  return (
    <div
      ref={containerRef}
      className={containerClasses}
      role="listitem"
      aria-label={
        todo.completed
          ? `タスク: ${todo.title}（完了済み・編集不可）`
          : `タスク: ${todo.title}`
      }
      aria-disabled={todo.completed ? true : undefined}
      tabIndex={0}
      onKeyDown={handleContainerKeyDown as unknown as React.KeyboardEventHandler<HTMLDivElement>}
      onDoubleClick={onDoubleClick}
      onAnimationEnd={isShaking ? handleShakeEnd : undefined}
      {...(!isEditing ? longPressHandlers : {})}
    >
      {/* Screen reader live region */}
      <span
        ref={ariaLiveRef}
        aria-live="assertive"
        aria-atomic="true"
        style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0,0,0,0)', whiteSpace: 'nowrap' }}
      />

      {/* Hover hint (view mode, non-completed) */}
      {!isEditing && !todo.completed && (
        <span className="task-item__edit-hint" aria-hidden="true">
          長押し or ダブルクリックで編集
        </span>
      )}

      {/* Editing label */}
      {isEditing && (
        <span className="task-item__editing-label" aria-hidden="true">
          編集中
        </span>
      )}

      {/* Lock tooltip */}
      {showLockTooltip && (
        <div
          className="task-item__lock-tooltip"
          role="tooltip"
          id={`lock-tooltip-${todo.id}`}
        >
          完了済みタスクは編集できません
        </div>
      )}

      {/* Main row */}
      <div className="task-item__row">
        {/* Checkbox */}
        <input
          type="checkbox"
          className="task-item__checkbox"
          checked={todo.completed}
          onChange={handleToggle}
          aria-label={`タスクを${todo.completed ? '未完了に戻す' : '完了にする'}: ${todo.title}`}
          tabIndex={0}
        />

        {/* Title or editing input */}
        {isEditing ? (
          <textarea
            ref={inputRef}
            className="task-item__input"
            value={inputValue}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onBlur={handleBlur}
            rows={1}
            role="textbox"
            aria-label="タスクタイトルを編集"
            aria-multiline={false}
            aria-required={true}
            aria-invalid={validationError !== null ? true : undefined}
            aria-describedby={`task-validation-${todo.id} task-counter-${todo.id}`}
          />
        ) : (
          <span className="task-item__title">{todo.title}</span>
        )}

        {/* Delete button */}
        {!isEditing && (
          <button
            className="task-item__delete-btn"
            onClick={handleDelete}
            aria-label={`タスクを削除: ${todo.title}`}
            tabIndex={0}
            type="button"
          >
            🗑
          </button>
        )}
      </div>

      {/* Footer: validation message + char counter (editing mode only) */}
      {isEditing && (
        <div className="task-item__footer">
          {/* Validation message */}
          {validationError ? (
            <p
              id={`task-validation-${todo.id}`}
              className="task-item__validation-msg"
              role="alert"
              aria-live="assertive"
            >
              <span className="task-item__validation-msg__icon" aria-hidden="true">
                ⚠️
              </span>
              {VALIDATION_MESSAGES[validationError]}
            </p>
          ) : (
            /* Reserve space so counter doesn't jump */
            <span id={`task-validation-${todo.id}`} />
          )}

          {/* Character counter */}
          <span
            id={`task-counter-${todo.id}`}
            className={[
              'task-item__char-counter',
              charCountState === 'warning' ? 'task-item__char-counter--warning' : '',
              charCountState === 'limit' ? 'task-item__char-counter--limit' : '',
            ]
              .filter(Boolean)
              .join(' ')}
            aria-live="polite"
            aria-atomic="true"
            aria-label="文字数カウンター"
          >
            {charCount}/{TITLE_MAX_LENGTH}
          </span>
        </div>
      )}
    </div>
  );
}

export const TaskItem = memo(TaskItemInner);
