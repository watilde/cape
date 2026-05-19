import React, { useEffect, useRef, useState } from 'react';
import styles from './TodoItem.module.css';
import { Todo } from '../../types/todo';
import { useTodoEdit } from '../../hooks/useTodoEdit';
import { useTodoContext } from '../../context/TodoContext';

// ---------------------------------------------------------------------------
// Edit icon (inline SVG — Feather edit-2)
// ---------------------------------------------------------------------------
const EditIcon: React.FC = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
  </svg>
);

// Delete icon (inline SVG — Feather trash-2)
const DeleteIcon: React.FC = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6l-1 14H6L5 6" />
    <path d="M10 11v6" />
    <path d="M14 11v6" />
    <path d="M9 6V4h6v2" />
  </svg>
);

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------
interface TodoItemProps {
  todo: Todo;
  onDelete: (id: string) => void;
  onToggleComplete: (id: string) => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export const TodoItem: React.FC<TodoItemProps> = ({
  todo,
  onDelete,
  onToggleComplete,
}) => {
  const { state } = useTodoContext();
  const isGlobalEditing = state.editingId !== null && state.editingId !== todo.id;

  const {
    isEditing,
    inputValue,
    hasError,
    errorMessage,
    inputRef,
    startEdit,
    cancelEdit,
    commitEdit,
    handleInputChange,
    handleKeyDown,
    handleBlur,
  } = useTodoEdit({ todoId: todo.id, initialTitle: todo.title });

  // Save-success animation: after editing ends, briefly apply exit animation
  const [isSaveSuccess, setIsSaveSuccess] = useState(false);
  const prevIsEditing = useRef(isEditing);

  useEffect(() => {
    if (prevIsEditing.current && !isEditing) {
      // Transitioned from editing → not editing
      setIsSaveSuccess(true);
      const timer = setTimeout(() => setIsSaveSuccess(false), 200);
      return () => clearTimeout(timer);
    }
    prevIsEditing.current = isEditing;
  }, [isEditing]);

  // Determine container class
  const containerClasses = [
    styles.todoItem,
    todo.status === 'completed' ? styles.todoItemCompleted : '',
    isEditing ? styles.todoItemEditing : '',
    isEditing && hasError ? styles.todoItemError : '',
    isSaveSuccess && !isEditing ? styles.todoItemSaveSuccess : '',
  ]
    .filter(Boolean)
    .join(' ');

  // AC-EDIT-01: double-click on title starts edit (desktop)
  const handleTitleDoubleClick = () => {
    if (!isEditing) {
      startEdit();
    }
  };

  const handleEditButtonClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isEditing) {
      startEdit();
    }
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(todo.id);
  };

  const handleCheckboxChange = () => {
    if (isEditing) {
      // If editing, commit first then toggle
      commitEdit();
    }
    onToggleComplete(todo.id);
  };

  const isCompleted = todo.status === 'completed';

  return (
    <li className={containerClasses} data-testid={`todo-item-${todo.id}`}>
      {/* Screen reader live region for editing mode announcement */}
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {isEditing ? '編集モードに切り替わりました' : ''}
      </div>

      <div className={styles.todoItemRow}>
        {/* Checkbox */}
        <input
          type="checkbox"
          className={styles.checkbox}
          checked={isCompleted}
          onChange={handleCheckboxChange}
          aria-label={`${todo.title}を${isCompleted ? '未完了' : '完了'}にする`}
          data-testid={`todo-checkbox-${todo.id}`}
        />

        {/* Emoji */}
        {todo.emoji && (
          <span className={styles.emojiBadge} aria-hidden="true">
            {todo.emoji}
          </span>
        )}

        {/* Display mode: task title */}
        {!isEditing && (
          <span
            className={`${styles.taskTitle} ${isCompleted ? styles.taskTitleCompleted : ''}`}
            onDoubleClick={handleTitleDoubleClick}
            data-testid={`todo-title-${todo.id}`}
            title="ダブルクリックで編集"
          >
            {todo.title}
          </span>
        )}

        {/* Editing mode: input field */}
        {isEditing && (
          <input
            ref={inputRef}
            type="text"
            className={styles.editInput}
            value={inputValue}
            onChange={(e) => handleInputChange(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={handleBlur}
            placeholder="タスク内容を入力"
            maxLength={100}
            aria-label="タスクを編集"
            aria-invalid={hasError}
            aria-describedby={hasError ? `error-${todo.id}` : undefined}
            data-testid={`todo-edit-input-${todo.id}`}
            // Prevent other items' blur logic from firing when switching items
            onMouseDown={(e) => e.stopPropagation()}
          />
        )}

        {/* Action buttons (hidden while editing via CSS) */}
        {!isEditing && (
          <div className={styles.actions}>
            <button
              className={`${styles.actionButton} ${styles.editButton}`}
              onClick={handleEditButtonClick}
              aria-label="タスクを編集"
              title="クリックして編集（またはダブルクリック）"
              data-testid={`todo-edit-btn-${todo.id}`}
              disabled={isGlobalEditing}
            >
              <EditIcon />
            </button>
            <button
              className={`${styles.actionButton} ${styles.deleteButton}`}
              onClick={handleDeleteClick}
              aria-label="タスクを削除"
              data-testid={`todo-delete-btn-${todo.id}`}
            >
              <DeleteIcon />
            </button>
          </div>
        )}
      </div>

      {/* Editing sub-row: label + action hints */}
      {isEditing && (
        <div>
          <span className={styles.editingLabel}>編集中</span>
          <div className={styles.actionHints} aria-hidden="true">
            <span className={styles.actionHint}>
              <span className={styles.actionHintKey}>Enter</span>保存
            </span>
            <span className={styles.actionHint}>
              <span className={styles.actionHintKey}>Esc</span>キャンセル
            </span>
          </div>
        </div>
      )}

      {/* Validation error message */}
      {isEditing && hasError && (
        <p
          id={`error-${todo.id}`}
          className={styles.errorMessage}
          role="alert"
          aria-live="assertive"
        >
          {errorMessage}
        </p>
      )}
    </li>
  );
};
