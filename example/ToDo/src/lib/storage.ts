/**
 * StorageAdapter Module
 * LocalStorage操作を抽象化——他のモジュールはこのモジュールを通じてのみStorageにアクセスする
 * Webアプリ完結設計（ipcRenderer等のElectron依存は一切含まない）
 */

import { STORAGE_KEY, STORAGE_SCHEMA_KEY, STORAGE_SCHEMA_VERSION } from '../types/todo';
import type { Todo } from '../types/todo';
import { validateTodoArray } from './todoCore';

/**
 * StorageAdapterのストレージ実装インターフェース
 * テスト時にモック実装に差し替え可能
 */
export interface StorageEngine {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

// デフォルトはブラウザのlocalStorage
let storageEngine: StorageEngine = window.localStorage;

/**
 * テスト用にストレージエンジンを差し替える
 * プロダクションコードからは呼ばない
 */
export function setStorageEngine(engine: StorageEngine): void {
  storageEngine = engine;
}

/**
 * ストレージスキーマの初期化・バージョン確認
 * アプリ起動時に一度だけ呼び出す
 */
export function initializeStorage(): void {
  try {
    const storedVersion = storageEngine.getItem(STORAGE_SCHEMA_KEY);
    if (storedVersion === null) {
      // 初回起動：スキーマバージョンを書き込む
      storageEngine.setItem(STORAGE_SCHEMA_KEY, String(STORAGE_SCHEMA_VERSION));
    }
    // 将来のマイグレーションはここにバージョン比較ロジックを追加
  } catch {
    // Storageへのアクセスエラーはサイレントに処理——アプリは起動し続ける
  }
}

/**
 * LocalStorageにTodo配列を保存する
 * AC-001-3 / AC-002-3 / AC-003-1 / AC-004-1: 全操作後に即時書き込み
 */
export function saveTodos(todos: Todo[]): void {
  try {
    storageEngine.setItem(STORAGE_KEY, JSON.stringify(todos));
  } catch (error) {
    // StorageQuotaExceededError等——ユーザーデータは失わないが書き込み失敗をコンソールに記録
    console.warn('[StorageAdapter] saveTodos failed:', error);
  }
}

/**
 * LocalStorageからTodo配列を読み込む
 * AC-004-2: パース失敗時は空配列でフォールバック（コンソールエラー抑制）
 */
export function loadTodos(): Todo[] {
  try {
    const raw = storageEngine.getItem(STORAGE_KEY);
    if (raw === null) return [];
    const parsed: unknown = JSON.parse(raw);
    return validateTodoArray(parsed);
  } catch {
    // JSON.parseエラーや壊れたデータ——空配列でフォールバック
    return [];
  }
}

/**
 * 全Todoを削除する
 */
export function clearAllTodos(): void {
  try {
    storageEngine.removeItem(STORAGE_KEY);
  } catch {
    // サイレントに処理
  }
}

/**
 * ストレージ使用状況を返す（将来のクォータ警告に使用）
 */
export function getStorageStats(): { usedBytes: number; keyCount: number } {
  try {
    let usedBytes = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        usedBytes += (localStorage.getItem(key) ?? '').length * 2; // UTF-16
      }
    }
    return { usedBytes, keyCount: localStorage.length };
  } catch {
    return { usedBytes: 0, keyCount: 0 };
  }
}
