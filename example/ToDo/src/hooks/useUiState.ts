/**
 * useUiState カスタムフック
 * UiStateContextへの型安全なアクセスを提供
 */

import { useContext } from 'react';
import { UiStateContext } from '../contexts/UiStateContext';

export function useUiState() {
  const ctx = useContext(UiStateContext);
  if (!ctx) {
    throw new Error('useUiState は UiStateProvider の内側で使用してください');
  }
  return ctx;
}
