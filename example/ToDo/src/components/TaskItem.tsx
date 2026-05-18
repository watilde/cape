/**
 * TaskItem コンポーネント
 * US-001〜003対応: 個別タスクカード
 * DA仕様: default/completed/hover/deletingの4ステート
 * touch-action: pan-y をスクロール競合防止のため適用（モバイルタッチハンドオフ仕様）
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import type { Todo } from '../types/todo';
import { useTodos } from '../hooks/useTodos';
import { useUiState } from '../hooks/useUiState';
import { CompletionCelebration } from './CompletionCelebration';

interface TaskItemProps {
  todo: Todo;
  isNew?: boolean;
}

export function TaskItem({ todo, isNew = false }: TaskItemProps): React.JSX.Element {
  const { toggleTodo, deleteTodo } = useTodos();
  const { showDeleteNotification } = useUiState();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEntering, setIsEntering] = useState(isNew);
  const [showCelebration, setShowCelebration] = useState(false);
  const prevCompletedRef = useRef(todo.completed);

  // 新規アイテムのenteringアニメーション（DA仕様: slideDown + fadeIn 300ms）
  useEffect(() => {
    if (isEntering) {
      const t = setTimeout(() => setIsEntering(false), 300);
      return () => clearTimeout(t);
    }
  }, [isEntering]);

  // 完了状態変化時にconfettiをトリガー
  useEffect(() => {
    if (todo.completed && !prevCompletedRef.current) {
      setShowCelebration(true);
    }
    prevCompletedRef.current = todo.completed;
  }, [todo.completed]);

  const handleToggle = useCallback(() => {
    toggleTodo(todo.id);
  }, [toggleTodo, todo.id]);

  const handleDelete = useCallback(() => {
    setIsDeleting(true);
    // DA仕様: deleteアニメーション280ms後にContextから削除
    setTimeout(() => {
      const result = deleteTodo(todo.id);
      if (result) {
        showDeleteNotification({
          type: 'DELETE',
          todo: result.todo,
          originalIndex: result.originalIndex,
        });
      }
    }, 280);
  }, [deleteTodo, showDeleteNotification, todo.id]);

  const handleCelebrationComplete = useCallback(() => {
    setShowCelebration(false);
  }, []);

  const containerClass = [
    'task-item',
    todo.completed ? 'task-item--completed' : '',
    isDeleting ? 'task-item--deleting' : '',
    isEntering ? 'task-item--entering' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <li className={containerClass} role="listitem">
      <div className="task-item__check-wrapper">
        <button
          className={`task-item__check-toggle${todo.completed ? ' task-item__check-toggle--checked' : ''}`}
          onClick={handleToggle}
          aria-label="タスクを完了にする"
          aria-pressed={todo.completed}
          type="button"
        >
          {todo.completed && <span className="task-item__check-icon" aria-hidden="true">✓</span>}
        </button>
        <CompletionCelebration active={showCelebration} onComplete={handleCelebrationComplete} />
      </div>

      <span className={`task-item__title${todo.completed ? ' task-item__title--completed' : ''}`}>
        {todo.title}
      </span>

      <button
        className="task-item__delete-btn"
        onClick={handleDelete}
        aria-label="タスクを削除する"
        type="button"
        disabled={isDeleting}
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <polyline points="3 6 5 6 21 6" />
          <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
          <path d="M10 11v6M14 11v6" />
          <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" />
        </svg>
      </button>
    </li>
  );
}
