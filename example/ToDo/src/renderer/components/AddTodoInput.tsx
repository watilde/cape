import React, { useState, useRef, useCallback } from 'react';
import { useTodos } from '../hooks/useTodos';

interface AddTodoInputProps {
  onAdded?: (id: string) => void;
}

export const AddTodoInput: React.FC<AddTodoInputProps> = ({ onAdded }) => {
  const [value, setValue] = useState('');
  const [isShaking, setIsShaking] = useState(false);
  const [showEmptyHighlight, setShowEmptyHighlight] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { addTodo } = useTodos();

  const handleSubmit = useCallback(() => {
    if (value.trim() === '') {
      // AC-001-2: 空欄時の優しいフィードバック
      setIsShaking(true);
      setShowEmptyHighlight(true);
      inputRef.current?.focus();
      setTimeout(() => setIsShaking(false), 320);
      setTimeout(() => setShowEmptyHighlight(false), 600);
      return;
    }

    const todo = addTodo(value.trim());
    if (todo) {
      setValue('');
      inputRef.current?.focus();
      onAdded?.(todo.id);
    }
  }, [value, addTodo, onAdded]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit]
  );

  return (
    <div className="add-todo-input-area">
      <input
        ref={inputRef}
        type="text"
        className={[
          'todo-input',
          isShaking ? 'todo-input--shake' : '',
          showEmptyHighlight ? 'todo-input--empty-highlight' : '',
        ]
          .filter(Boolean)
          .join(' ')}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="タスクを入力してね..."
        maxLength={100}
        aria-label="新しいタスクを入力"
      />
      <button
        className="add-button"
        onClick={handleSubmit}
        aria-label="タスクを追加"
        type="button"
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </button>
    </div>
  );
};
