/**
 * UiStateContext
 * トランジェントなUI状態（通知・Undoスタック）を管理
 * TodoContextと分離してセレクティブなサブスクリプションを実現
 */

import React, { createContext, useReducer, useCallback, useRef } from 'react';
import type { ReactNode } from 'react';
import type { UiNotification, UndoAction } from '../types/todo';

// --- State & Action Types ---

interface UiState {
  notification: UiNotification | null;
}

type UiAction =
  | { type: 'SHOW_NOTIFICATION'; payload: UiNotification }
  | { type: 'DISMISS_NOTIFICATION'; payload: string }; // notificationId

function uiReducer(state: UiState, action: UiAction): UiState {
  switch (action.type) {
    case 'SHOW_NOTIFICATION':
      return { ...state, notification: action.payload };
    case 'DISMISS_NOTIFICATION':
      if (state.notification?.id === action.payload) {
        return { ...state, notification: null };
      }
      return state;
    default:
      return state;
  }
}

// --- Context ---

interface UiStateContextValue {
  notification: UiNotification | null;
  showDeleteNotification: (undoAction: UndoAction) => void;
  dismissNotification: (id: string) => void;
}

export const UiStateContext = createContext<UiStateContextValue | null>(null);

// --- Provider ---

interface UiStateProviderProps {
  children: ReactNode;
}

export function UiStateProvider({ children }: UiStateProviderProps): React.JSX.Element {
  const [state, dispatch] = useReducer(uiReducer, { notification: null });
  // タイマー参照を保持（通知の重複表示を防ぐ）
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showDeleteNotification = useCallback((undoAction: UndoAction) => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    const notificationId = `notif-${Date.now()}`;
    dispatch({
      type: 'SHOW_NOTIFICATION',
      payload: {
        id: notificationId,
        message: 'タスクを削除しました',
        undoAction,
      },
    });
    // 3秒後に自動dismiss（DAのauto_dismiss: 3000ms）
    timerRef.current = setTimeout(() => {
      dispatch({ type: 'DISMISS_NOTIFICATION', payload: notificationId });
    }, 3000);
  }, []);

  const dismissNotification = useCallback((id: string) => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    dispatch({ type: 'DISMISS_NOTIFICATION', payload: id });
  }, []);

  return (
    <UiStateContext.Provider
      value={{
        notification: state.notification,
        showDeleteNotification,
        dismissNotification,
      }}
    >
      {children}
    </UiStateContext.Provider>
  );
}
