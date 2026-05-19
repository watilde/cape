import { useState, useCallback, useRef } from 'react';
import { useTodoContext } from '../context/TodoContext';

export interface UseTodoEditOptions {
  todoId: string;
  initialTitle: string;
}

export interface UseTodoEditReturn {
  isEditing: boolean;
  inputValue: string;
  hasError: boolean;
  errorMessage: string;
  inputRef: React.RefObject<HTMLInputElement>;
  startEdit: () => void;
  cancelEdit: () => void;
  commitEdit: () => void;
  handleInputChange: (value: string) => void;
  handleKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  handleBlur: () => void;
}

export function useTodoEdit({
  todoId,
  initialTitle,
}: UseTodoEditOptions): UseTodoEditReturn {
  const { dispatch, updateTodoTitle } = useTodoContext();
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState(initialTitle);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  // Snapshot of title at edit-start for cancel/restore
  const originalTitle = useRef(initialTitle);
  // Guard: prevent double-commit on blur after Enter
  const isCommittingRef = useRef(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // ------------------------------------------------------------------
  // Start editing
  // ------------------------------------------------------------------
  const startEdit = useCallback(() => {
    originalTitle.current = initialTitle;
    setInputValue(initialTitle);
    setHasError(false);
    setErrorMessage('');
    setIsEditing(true);
    dispatch({ type: 'SET_EDITING_ID', payload: todoId });

    // Focus after paint
    requestAnimationFrame(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    });
  }, [dispatch, initialTitle, todoId]);

  // ------------------------------------------------------------------
  // Cancel: restore original
  // ------------------------------------------------------------------
  const cancelEdit = useCallback(() => {
    setInputValue(originalTitle.current);
    setHasError(false);
    setErrorMessage('');
    setIsEditing(false);
    dispatch({ type: 'SET_EDITING_ID', payload: null });
  }, [dispatch]);

  // ------------------------------------------------------------------
  // Validate
  // ------------------------------------------------------------------
  const validate = useCallback((value: string): boolean => {
    if (value.trim() === '') {
      setHasError(true);
      setErrorMessage('タスク内容を入力してください');
      // Re-focus for error state (AC-EDIT-06)
      requestAnimationFrame(() => inputRef.current?.focus());
      return false;
    }
    return true;
  }, []);

  // ------------------------------------------------------------------
  // Commit: save to context + storage
  // ------------------------------------------------------------------
  const commitEdit = useCallback(() => {
    if (!isEditing) return;
    const trimmed = inputValue.trim();
    if (!validate(trimmed)) return;

    isCommittingRef.current = true;
    updateTodoTitle(todoId, trimmed);
    setHasError(false);
    setErrorMessage('');
    setIsEditing(false);
    dispatch({ type: 'SET_EDITING_ID', payload: null });

    // Reset guard after current event loop
    requestAnimationFrame(() => {
      isCommittingRef.current = false;
    });
  }, [dispatch, inputValue, isEditing, todoId, updateTodoTitle, validate]);

  // ------------------------------------------------------------------
  // Input change: clear error on typing
  // ------------------------------------------------------------------
  const handleInputChange = useCallback((value: string) => {
    setInputValue(value);
    if (hasError && value.trim() !== '') {
      setHasError(false);
      setErrorMessage('');
    }
  }, [hasError]);

  // ------------------------------------------------------------------
  // Keyboard handler (AC-EDIT-03, AC-EDIT-04)
  // ------------------------------------------------------------------
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        commitEdit();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        cancelEdit();
      }
    },
    [cancelEdit, commitEdit]
  );

  // ------------------------------------------------------------------
  // Blur handler (AC-EDIT-05, AC-EDIT-06 for empty on blur)
  // ------------------------------------------------------------------
  const handleBlur = useCallback(() => {
    if (isCommittingRef.current) return;
    if (!isEditing) return;

    const trimmed = inputValue.trim();
    if (trimmed === '') {
      // AC-EDIT-06: on blur with empty value, restore original text
      setInputValue(originalTitle.current);
      setHasError(false);
      setErrorMessage('');
      setIsEditing(false);
      dispatch({ type: 'SET_EDITING_ID', payload: null });
      return;
    }

    commitEdit();
  }, [commitEdit, dispatch, inputValue, isEditing]);

  return {
    isEditing,
    inputValue,
    hasError,
    errorMessage,
    inputRef,
    startEdit,
    cancelEdit,
    commitEdit,
    handleInputChange,
    handleKeyDown,
    handleBlur,
  };
}
