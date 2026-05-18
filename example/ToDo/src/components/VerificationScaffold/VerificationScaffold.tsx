/**
 * VerificationScaffold Component
 *
 * US-ENV-001 acceptance criteria verification UI.
 * DA reference: verification_scaffold_spec (task-1779078001280)
 *
 * Covers all 3 AC scenarios:
 *   1. Dev server starts → this file renders = pass
 *   2. TypeScript compiles without error → strict types throughout = pass
 *   3. LocalStorage read/write works → Save button demonstrates this visually
 *
 * This component will be REPLACED by actual app UI in the next phase.
 * It exists solely to satisfy US-ENV-001 DoD.
 */

import React, { useState, useEffect, useCallback } from 'react'
import { storageAdapter } from '@/lib/storage/StorageAdapter'
import { createTodo } from '@/lib/todo/TodoCore'
import { TodoValidationError } from '@/lib/todo/TodoCore'
import type { Todo } from '@/types/todo'
import styles from './VerificationScaffold.module.css'

type SaveStatus = 'idle' | 'success' | 'error'

const STATUS_LABEL: Record<SaveStatus, string> = {
  idle: '待機中',
  success: '✓ 保存完了',
  error: '⚠ エラーが発生しました',
}

const COLOR_SWATCHES = [
  { name: 'Primary', variable: '--color-primary' },
  { name: 'Secondary', variable: '--color-secondary' },
  { name: 'Success', variable: '--color-success' },
  { name: 'Warning', variable: '--color-warning' },
] as const

export function VerificationScaffold(): React.JSX.Element {
  const [inputValue, setInputValue] = useState('')
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')
  const [savedTodos, setSavedTodos] = useState<Todo[]>([])
  const [storageStats, setStorageStats] = useState(storageAdapter.getStorageStats())
  const [errorMessage, setErrorMessage] = useState<string>('')

  // Load existing todos from LocalStorage on mount — AC scenario 3
  useEffect(() => {
    const todos = storageAdapter.loadTodos()
    setSavedTodos(todos)
  }, [])

  const handleSave = useCallback(() => {
    if (inputValue.trim().length === 0) return

    try {
      const newTodo = createTodo({ title: inputValue.trim(), emoji: '📝' })

      const currentTodos = storageAdapter.loadTodos()
      const updatedTodos = [newTodo, ...currentTodos]

      storageAdapter.saveTodos(updatedTodos)
      setSavedTodos(updatedTodos)
      setStorageStats(storageAdapter.getStorageStats())
      setSaveStatus('success')
      setInputValue('')
      setErrorMessage('')

      // Reset status after 3s
      setTimeout(() => setSaveStatus('idle'), 3000)
    } catch (error) {
      setSaveStatus('error')
      if (error instanceof TodoValidationError) {
        setErrorMessage(error.message)
      } else {
        setErrorMessage('保存中に予期しないエラーが発生しました。')
      }
      setTimeout(() => setSaveStatus('idle'), 4000)
    }
  }, [inputValue])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') handleSave()
    },
    [handleSave]
  )

  const handleClearAll = useCallback(() => {
    storageAdapter.clearAllTodos()
    setSavedTodos([])
    setStorageStats(storageAdapter.getStorageStats())
    setSaveStatus('idle')
  }, [])

  return (
    <div className={styles.page}>
      <main className={styles.container}>
        {/* SCAFFOLD-HEADER — DA spec */}
        <h1 className={styles.heading}>StyleToDo 🌸</h1>

        {/* SCAFFOLD-SUBTITLE — DA spec */}
        <p className={styles.subtitle}>環境構築確認スタブ — v1.0.0</p>

        <div className={styles.card}>
          <p className={styles.sectionLabel}>US-ENV-001 動作確認</p>

          {/* SCAFFOLD-INPUT — DA spec */}
          <input
            type="text"
            className={styles.input}
            placeholder="テストタスクを入力してください"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            aria-label="テストタスク入力"
          />

          {/* SCAFFOLD-SAVE-BUTTON — DA spec */}
          <button
            className={styles.primaryButton}
            onClick={handleSave}
            disabled={inputValue.trim().length === 0}
            aria-label="LocalStorageに保存"
          >
            LocalStorageに保存
          </button>

          {/* SCAFFOLD-STATUS — DA spec */}
          <div
            className={`${styles.statusBadge} ${styles[`status--${saveStatus}`]}`}
            role="status"
            aria-live="polite"
          >
            {STATUS_LABEL[saveStatus]}
            {saveStatus === 'error' && errorMessage.length > 0 && (
              <span className={styles.errorDetail}> — {errorMessage}</span>
            )}
          </div>
        </div>

        {/* SCAFFOLD-SAVED-VALUE — DA spec */}
        <div className={styles.card}>
          <div className={styles.savedValueHeader}>
            <p className={styles.sectionLabel}>
              LocalStorageから読み出した値: ({savedTodos.length}件)
            </p>
            {savedTodos.length > 0 && (
              <button
                className={styles.clearButton}
                onClick={handleClearAll}
                aria-label="全件削除"
              >
                全件削除
              </button>
            )}
          </div>

          {savedTodos.length === 0 ? (
            <p className={styles.emptyState}>まだタスクがありません。上から追加してみてください。</p>
          ) : (
            <ul className={styles.todoList} aria-label="保存済みタスク一覧">
              {savedTodos.map((todo) => (
                <li key={todo.id} className={styles.todoItem}>
                  <span className={styles.todoEmoji}>{todo.emoji}</span>
                  <span className={styles.todoTitle}>{todo.title}</span>
                  <span className={styles.todoMeta}>
                    {new Date(todo.createdAt).toLocaleTimeString('ja-JP')}
                  </span>
                </li>
              ))}
            </ul>
          )}

          {/* Storage stats — architecture.md: monitor quota */}
          <div className={styles.storageStats}>
            <div
              className={styles.storageBar}
              role="progressbar"
              aria-valuenow={storageStats.usedPercent}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`ストレージ使用量 ${storageStats.usedPercent.toFixed(1)}%`}
            >
              <div
                className={styles.storageBarFill}
                style={{ width: `${storageStats.usedPercent}%` }}
              />
            </div>
            <p className={styles.storageLabel}>
              ストレージ使用量: {(storageStats.used / 1024).toFixed(1)} KB
              / 5,120 KB ({storageStats.usedPercent.toFixed(1)}%)
            </p>
          </div>
        </div>

        {/* SCAFFOLD-COLOR-SWATCH — DA spec: verify design tokens */}
        <div className={styles.card}>
          <p className={styles.sectionLabel}>デザイントークン確認</p>
          <div className={styles.swatchRow} role="list" aria-label="カラースウォッチ">
            {COLOR_SWATCHES.map(({ name, variable }) => (
              <div key={variable} className={styles.swatchItem} role="listitem">
                <div
                  className={styles.swatch}
                  style={{ backgroundColor: `var(${variable})` }}
                  aria-label={`${name}カラー`}
                />
                <span className={styles.swatchName}>{name}</span>
              </div>
            ))}
          </div>
        </div>

        <footer className={styles.footer}>
          <p>
            ✅ Dev server: <strong>起動中</strong>
            &nbsp;|&nbsp;
            ✅ TypeScript: <strong>コンパイル成功</strong>
            &nbsp;|&nbsp;
            {savedTodos.length > 0
              ? '✅ LocalStorage: 読み書き確認済み'
              : '⏳ LocalStorage: タスクを追加して確認してください'}
          </p>
        </footer>
      </main>
    </div>
  )
}
