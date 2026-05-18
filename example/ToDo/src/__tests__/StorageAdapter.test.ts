/**
 * StorageAdapter unit tests
 * Architecture reference: "Unit Test Coverage: StorageAdapter modules tested with 90%+ line coverage"
 * Test structure: /src/__tests__/[module-name].test.ts
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { storageAdapter, StorageQuotaError } from '@/lib/storage/StorageAdapter'
import type { Todo } from '@/types/todo'
import { STORAGE_KEYS, CURRENT_STORAGE_VERSION } from '@/types/todo'

// Helper: create a minimal valid Todo
function makeTodo(overrides: Partial<Todo> = {}): Todo {
  const now = Date.now()
  return {
    id: `todo_${now}_test`,
    title: 'テストタスク',
    emoji: '📝',
    status: 'active',
    createdAt: now,
    updatedAt: now,
    ...overrides,
  }
}

describe('StorageAdapter', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  describe('initializeStorage', () => {
    it('新規インストール時にバージョンキーと空のTodo配列を作成する', () => {
      storageAdapter.initializeStorage()

      expect(localStorage.getItem(STORAGE_KEYS.STORAGE_VERSION)).toBe(CURRENT_STORAGE_VERSION)
      expect(localStorage.getItem(STORAGE_KEYS.TODOS)).toBe('[]')
    })

    it('既にバージョンキーが存在する場合は上書きしない', () => {
      localStorage.setItem(STORAGE_KEYS.STORAGE_VERSION, CURRENT_STORAGE_VERSION)
      localStorage.setItem(STORAGE_KEYS.TODOS, JSON.stringify([makeTodo()]))

      storageAdapter.initializeStorage()

      // todos should still have 1 item
      const raw = localStorage.getItem(STORAGE_KEYS.TODOS)
      const parsed = raw !== null ? (JSON.parse(raw) as unknown[]) : []
      expect(parsed).toHaveLength(1)
    })
  })

  describe('saveTodos / loadTodos', () => {
    it('Todoを保存して再読み込みできる', () => {
      const todos = [makeTodo({ title: 'First' }), makeTodo({ title: 'Second', id: 'todo_2_test' })]

      storageAdapter.saveTodos(todos)
      const loaded = storageAdapter.loadTodos()

      expect(loaded).toHaveLength(2)
      expect(loaded[0]?.title).toBe('First')
      expect(loaded[1]?.title).toBe('Second')
    })

    it('バックアップキーにも同時に保存される', () => {
      const todos = [makeTodo()]
      storageAdapter.saveTodos(todos)

      const backup = localStorage.getItem(STORAGE_KEYS.BACKUP)
      expect(backup).not.toBeNull()
      expect(backup).toBe(JSON.stringify(todos))
    })

    it('ストレージが空のとき空配列を返す', () => {
      const todos = storageAdapter.loadTodos()
      expect(todos).toEqual([])
    })

    it('不正なJSONが保存されていた場合はバックアップから復元する', () => {
      const validTodo = makeTodo()
      localStorage.setItem(STORAGE_KEYS.TODOS, 'INVALID_JSON{{{')
      localStorage.setItem(STORAGE_KEYS.BACKUP, JSON.stringify([validTodo]))

      const loaded = storageAdapter.loadTodos()
      expect(loaded).toHaveLength(1)
      expect(loaded[0]?.id).toBe(validTodo.id)
    })

    it('配列でないデータが保存されていた場合はバックアップから復元する', () => {
      const validTodo = makeTodo()
      localStorage.setItem(STORAGE_KEYS.TODOS, JSON.stringify({ not: 'array' }))
      localStorage.setItem(STORAGE_KEYS.BACKUP, JSON.stringify([validTodo]))

      const loaded = storageAdapter.loadTodos()
      expect(loaded).toHaveLength(1)
    })

    it('不正なTodoエントリはフィルタリングして有効なものだけ返す', () => {
      const validTodo = makeTodo()
      const invalidEntry = { notATodo: true }
      localStorage.setItem(STORAGE_KEYS.TODOS, JSON.stringify([validTodo, invalidEntry]))

      const loaded = storageAdapter.loadTodos()
      expect(loaded).toHaveLength(1)
      expect(loaded[0]?.id).toBe(validTodo.id)
    })

    it('ストレージクォータエラー時にStorageQuotaErrorをスローする', () => {
      const originalSetItem = localStorage.setItem.bind(localStorage)
      vi.spyOn(localStorage, 'setItem').mockImplementationOnce(() => {
        const error = new DOMException('QuotaExceededError')
        Object.defineProperty(error, 'name', { value: 'QuotaExceededError' })
        throw error
      })

      expect(() => storageAdapter.saveTodos([makeTodo()])).toThrow(StorageQuotaError)

      vi.restoreAllMocks()
      void originalSetItem
    })
  })

  describe('clearAllTodos', () => {
    it('プライマリとバックアップの両方をクリアして空配列を書き込む', () => {
      storageAdapter.saveTodos([makeTodo()])
      storageAdapter.clearAllTodos()

      expect(storageAdapter.loadTodos()).toEqual([])
      expect(localStorage.getItem(STORAGE_KEYS.BACKUP)).toBeNull()
    })
  })

  describe('getStorageStats', () => {
    it('used / available / usedPercentを返す', () => {
      storageAdapter.saveTodos([makeTodo()])
      const stats = storageAdapter.getStorageStats()

      expect(stats.used).toBeGreaterThan(0)
      expect(stats.available).toBeGreaterThanOrEqual(0)
      expect(stats.usedPercent).toBeGreaterThan(0)
      expect(stats.usedPercent).toBeLessThanOrEqual(100)
    })
  })
})
