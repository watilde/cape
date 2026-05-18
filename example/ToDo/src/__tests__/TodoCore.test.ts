/**
 * TodoCore unit tests
 * Architecture reference: "Unit Test Coverage: TodoCore modules tested with 90%+ line coverage"
 */

import { describe, it, expect } from 'vitest'
import { createTodo, updateTodo, validateTodoData, TodoValidationError } from '@/lib/todo/TodoCore'
import type { Todo } from '@/types/todo'

describe('TodoCore', () => {
  describe('createTodo', () => {
    it('有効な入力からTodoオブジェクトを生成する', () => {
      const todo = createTodo({ title: 'デザイナーとのMTG', emoji: '💼' })

      expect(todo.id).toMatch(/^todo_\d+_[a-z0-9]+$/)
      expect(todo.title).toBe('デザイナーとのMTG')
      expect(todo.emoji).toBe('💼')
      expect(todo.status).toBe('active')
      expect(typeof todo.createdAt).toBe('number')
      expect(typeof todo.updatedAt).toBe('number')
      expect(todo.completedAt).toBeUndefined()
    })

    it('タイトルの前後空白をトリムする', () => {
      const todo = createTodo({ title: '  スペースあり  ', emoji: '📝' })
      expect(todo.title).toBe('スペースあり')
    })

    it('dueDateが指定された場合はフィールドに含める', () => {
      const dueDate = Date.now() + 86400000
      const todo = createTodo({ title: 'タスク', emoji: '📝', dueDate })
      expect(todo.dueDate).toBe(dueDate)
    })

    it('空タイトルでTodoValidationErrorをスローする', () => {
      expect(() => createTodo({ title: '', emoji: '📝' })).toThrow(TodoValidationError)
      expect(() => createTodo({ title: '   ', emoji: '📝' })).toThrow(TodoValidationError)
    })

    it('100文字超のタイトルでTodoValidationErrorをスローする', () => {
      const longTitle = 'あ'.repeat(101)
      expect(() => createTodo({ title: longTitle, emoji: '📝' })).toThrow(TodoValidationError)
    })

    it('100文字ちょうどのタイトルは有効', () => {
      const title = 'あ'.repeat(100)
      expect(() => createTodo({ title, emoji: '📝' })).not.toThrow()
    })

    it('空の絵文字でTodoValidationErrorをスローする', () => {
      expect(() => createTodo({ title: 'タスク', emoji: '' })).toThrow(TodoValidationError)
      expect(() => createTodo({ title: 'タスク', emoji: '  ' })).toThrow(TodoValidationError)
    })
  })

  describe('updateTodo', () => {
    function baseTodo(): Todo {
      const now = Date.now()
      return {
        id: 'todo_test_1',
        title: '元のタイトル',
        emoji: '📝',
        status: 'active',
        createdAt: now,
        updatedAt: now,
      }
    }

    it('タイトルを更新する', () => {
      const updated = updateTodo(baseTodo(), { title: '新しいタイトル' })
      expect(updated.title).toBe('新しいタイトル')
    })

    it('ステータスをcompletedに更新するとcompletedAtが設定される', () => {
      const updated = updateTodo(baseTodo(), { status: 'completed' })
      expect(updated.status).toBe('completed')
      expect(updated.completedAt).toBeDefined()
      expect(typeof updated.completedAt).toBe('number')
    })

    it('ステータスをactiveに戻すとcompletedAtが削除される', () => {
      const completed: Todo = {
        ...baseTodo(),
        status: 'completed',
        completedAt: Date.now(),
      }
      const reverted = updateTodo(completed, { status: 'active' })
      expect(reverted.status).toBe('active')
      expect(reverted.completedAt).toBeUndefined()
    })

    it('元のTodoオブジェクトを変更しない（イミュータブル）', () => {
      const original = baseTodo()
      const originalTitle = original.title
      updateTodo(original, { title: '変更後' })
      expect(original.title).toBe(originalTitle)
    })

    it('updatedAtが更新される', () => {
      const todo = baseTodo()
      const before = todo.updatedAt
      // Ensure time difference
      const updated = updateTodo(todo, { title: '新タイトル' })
      expect(updated.updatedAt).toBeGreaterThanOrEqual(before)
    })

    it('空タイトルへの更新でTodoValidationErrorをスローする', () => {
      expect(() => updateTodo(baseTodo(), { title: '' })).toThrow(TodoValidationError)
    })
  })

  describe('validateTodoData', () => {
    it('有効なTodoオブジェクトに対してtrueを返す', () => {
      const now = Date.now()
      const valid = {
        id: 'todo_123_abc',
        title: 'テスト',
        emoji: '📝',
        status: 'active',
        createdAt: now,
        updatedAt: now,
      }
      expect(validateTodoData(valid)).toBe(true)
    })

    it('nullに対してfalseを返す', () => {
      expect(validateTodoData(null)).toBe(false)
    })

    it('プリミティブ値に対してfalseを返す', () => {
      expect(validateTodoData('string')).toBe(false)
      expect(validateTodoData(42)).toBe(false)
      expect(validateTodoData(true)).toBe(false)
    })

    it('idが欠落している場合はfalseを返す', () => {
      const invalid = { title: 'test', emoji: '📝', status: 'active', createdAt: 1, updatedAt: 1 }
      expect(validateTodoData(invalid)).toBe(false)
    })

    it('statusが不正な値の場合はfalseを返す', () => {
      const invalid = {
        id: 'todo_1',
        title: 'test',
        emoji: '📝',
        status: 'pending', // invalid
        createdAt: 1,
        updatedAt: 1,
      }
      expect(validateTodoData(invalid)).toBe(false)
    })

    it('createdAtが数値でない場合はfalseを返す', () => {
      const invalid = {
        id: 'todo_1',
        title: 'test',
        emoji: '📝',
        status: 'active',
        createdAt: '2024-01-01', // string, not number
        updatedAt: 1,
      }
      expect(validateTodoData(invalid)).toBe(false)
    })
  })
})
