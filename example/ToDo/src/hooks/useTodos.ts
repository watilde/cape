/**
 * useTodos カスタムフック
 * TodoContextへの型安全なアクセスを提供
 */

import { useContext } from 'react';
import { TodoContext } from '../contexts/TodoContext';

export function useTodos() {
  const ctx = useContext(TodoContext);
  if (!ctx) {
    throw new Error('useTodos は TodoProvider の内側で使用してください');
  }
  return ctx;
}
