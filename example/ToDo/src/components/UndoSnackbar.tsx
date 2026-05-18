/**
 * UndoSnackbar コンポーネント
 * US-003 / Trustworthy Reliability対応
 * DA仕様: fixed bottom 24px / auto-dismiss 3s / Undo付き
 */

import React, { useEffect, useState } from 'react';
import { useUiState } from '../hooks/useUiState';
import { useTodos } from '../hooks/useTodos';

export function UndoSnackbar(): React.JSX.Element | null {
  const { notification, dismissNotification } = useUiState();
  const { restoreTodo } = useTodos();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (notification) {
      setIsVisible(true);
    } else {
      // フェードアウトアニメーション（200ms）後に非表示
      const t = setTimeout(() => setIsVisible(false), 200);
      return () => clearTimeout(t);
    }
  }, [notification]);

  if (!isVisible && !notification) return null;

  const handleUndo = () => {
    if (notification?.undoAction) {
      const { todo, originalIndex } = notification.undoAction;
      restoreTodo(todo, originalIndex);
    }
    if (notification) {
      dismissNotification(notification.id);
    }
  };

  const handleDismiss = () => {
    if (notification) {
      dismissNotification(notification.id);
    }
  };

  const snackbarClass = ['undo-snackbar', notification ? 'undo-snackbar--visible' : 'undo-snackbar--hidden']
    .join(' ');

  return (
    <div className={snackbarClass} role="status" aria-live="polite">
      <span className="undo-snackbar__message">
        {notification?.message ?? 'タスクを削除しました'}
      </span>
      {notification?.undoAction && (
        <button
          className="undo-snackbar__undo-btn"
          onClick={handleUndo}
          type="button"
          aria-label="削除を元に戻す"
        >
          元に戻す
        </button>
      )}
      <button
        className="undo-snackbar__close-btn"
        onClick={handleDismiss}
        type="button"
        aria-label="通知を閉じる"
      >
        ✕
      </button>
    </div>
  );
}
