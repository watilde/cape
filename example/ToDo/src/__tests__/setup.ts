/**
 * Vitestセットアップファイル
 * localStorage モック・@testing-library/jest-dom の設定
 */

import '@testing-library/jest-dom';
import { afterEach, vi } from 'vitest';
import { setStorageEngine } from '../lib/storage';

// テスト間でlocalStorageモックをリセット
function createMockStorage(): Storage & { _store: Record<string, string> } {
  const store: Record<string, string> = {};
  return {
    _store: store,
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      Object.keys(store).forEach((k) => delete store[k]);
    }),
    get length() {
      return Object.keys(store).length;
    },
    key: vi.fn((index: number) => Object.keys(store)[index] ?? null),
  };
}

let mockStorage = createMockStorage();

// 各テスト後にストレージをリセット
afterEach(() => {
  mockStorage = createMockStorage();
  setStorageEngine(mockStorage);
});

// テスト開始時にストレージエンジンを差し替え
setStorageEngine(mockStorage);

export { mockStorage, createMockStorage };
