/**
 * TodoアプリのコアデータモデルとUI状態の型定義
 * Webアプリ完結設計（Electron依存なし）
 */

export interface Todo {
  id: string;
  title: string;
  completed: boolean;
  createdAt: number;
  completedAt: number | null;
}

export type AnimationState = 'idle' | 'entering' | 'exiting';

export interface UndoAction {
  type: 'DELETE';
  todo: Todo;
  originalIndex: number;
}

export interface UiNotification {
  id: string;
  message: string;
  undoAction?: UndoAction;
}

// StorageAdapter向けのスキーマバージョン管理
export const STORAGE_SCHEMA_VERSION = 1;
export const STORAGE_KEY = 'styletodo_v1_todos';
export const STORAGE_SCHEMA_KEY = 'styletodo_v1_schema';
