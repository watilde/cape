/**
 * TaskInput コンポーネント
 * US-001対応: タスク作成エリア
 * DA仕様のshakeアニメーション・エラーフィードバック・フォーカス管理を実装
 */

import React, { useState, useRef, useCallback } from 'react';
import { useTodos } from '../hooks/useTodos';

export function TaskInput(): React.JSX.Element {
  const { addTodo } = useTodos();
  const [value, setValue] = useState('');
  const [isShaking, setIsShaking] = useState(false);
  const [showHelper, setShowHelper] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const helperTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const triggerShake = useCallback(() => {
    setIsShaking(true);
    setShowHelper(true);

    // shakeアニメーション終了後にクラスを外す（400ms）
    setTimeout(() => setIsShaking(false), 400);

    // ヘルパーテキストは2000ms後に非表示（DA仕様）
    if (helperTimerRef.current) clearTimeout(helperTimerRef.current);
    helperTimerRef.current = setTimeout(() => setShowHelper(false), 2000);
  }, []);

  const handleSubmit = useCallback(() => {
    const trimmed = value.trim();
    if (trimmed.length === 0) {
      // AC-001-2: 空入力の場合はかわいいフィードバック
      triggerShake();
      inputRef.current?.focus();
      return;
    }
    // AC-001-1: タスク追加成功
    addTodo(trimmed);
    setValue('');
    // 連続追加サポートのためフォーカスを維持
    inputRef.current?.focus();
  }, [value, addTodo, triggerShake]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        handleSubmit();
      }
    },
    [handleSubmit],
  );

  return (
    <div className="task-input">
      <div className={`task-input__container${isShaking ? ' task-input__container--shake' : ''}`}>
        <input
          ref={inputRef}
          className="task-input__field"
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="新しいタスクを入力..."
          maxLength={100}
          aria-label="新しいタスク名"
          autoComplete="off"
        />
        <button
          className="task-input__add-btn"
          onClick={handleSubmit}
          aria-label="タスクを追加する"
          type="button"
        >
          ＋ 追加
        </button>
      </div>
      {showHelper && (
        <p className="task-input__helper" role="alert" aria-live="polite">
          タスク名を入力してね 💕
        </p>
      )}
    </div>
  );
}
