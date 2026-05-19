import {
  useState,
  useRef,
  useCallback,
  useEffect,
  KeyboardEvent,
  ChangeEvent,
} from 'react';

export const TITLE_MAX_LENGTH = 100;

export type ValidationError = 'empty' | 'over_limit' | null;

interface UseInlineEditOptions {
  todoId: string;
  initialTitle: string;
  isCompleted: boolean;
  editingId: string | null;
  onSave: (id: string, newTitle: string) => void;
  onStartEdit: (id: string) => void;
  onCancelEdit: () => void;
}

interface UseInlineEditReturn {
  isEditing: boolean;
  inputValue: string;
  validationError: ValidationError;
  charCount: number;
  charCountState: 'normal' | 'warning' | 'limit';
  isShaking: boolean;
  inputRef: React.RefObject<HTMLTextAreaElement>;
  startEditing: () => void;
  handleChange: (e: ChangeEvent<HTMLTextAreaElement>) => void;
  handleKeyDown: (e: KeyboardEvent<HTMLTextAreaElement>) => void;
  handleBlur: () => void;
  handleContainerKeyDown: (e: KeyboardEvent<HTMLDivElement>) => void;
  handleDoubleClick: () => void;
  handleShakeEnd: () => void;
}

export function useInlineEdit({
  todoId,
  initialTitle,
  isCompleted,
  editingId,
  onSave,
  onStartEdit,
  onCancelEdit,
}: UseInlineEditOptions): UseInlineEditReturn {
  const isEditing = editingId === todoId;

  const [inputValue, setInputValue] = useState(initialTitle);
  const [validationError, setValidationError] = useState<ValidationError>(null);
  const [isShaking, setIsShaking] = useState(false);

  const inputRef = useRef<HTMLTextAreaElement>(null);
  // Track whether blur was triggered by a keyboard-initiated save (Tab key)
  // to avoid double-save / double-cancel
  const skipBlurRef = useRef(false);

  // Sync inputValue when a different todo's title changes externally
  // or when editing is cancelled from outside (editingId changed away)
  useEffect(() => {
    if (!isEditing) {
      setInputValue(initialTitle);
      setValidationError(null);
    }
  }, [isEditing, initialTitle]);

  // Auto-focus when editing starts
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      // Place cursor at end
      const len = inputRef.current.value.length;
      inputRef.current.setSelectionRange(len, len);
    }
  }, [isEditing]);

  // ---------------------------------------------------------------------------
  // Validation
  // ---------------------------------------------------------------------------
  function validate(value: string): ValidationError {
    if (value.trim().length === 0) return 'empty';
    if (value.length > TITLE_MAX_LENGTH) return 'over_limit';
    return null;
  }

  // ---------------------------------------------------------------------------
  // Character count state
  // ---------------------------------------------------------------------------
  const charCount = inputValue.length;
  const charCountState: 'normal' | 'warning' | 'limit' =
    charCount >= TITLE_MAX_LENGTH
      ? 'limit'
      : charCount >= TITLE_MAX_LENGTH - 20
      ? 'warning'
      : 'normal';

  // ---------------------------------------------------------------------------
  // Actions
  // ---------------------------------------------------------------------------
  const startEditing = useCallback(() => {
    if (isCompleted) {
      setIsShaking(true);
      return;
    }
    setInputValue(initialTitle);
    setValidationError(null);
    onStartEdit(todoId);
  }, [isCompleted, initialTitle, todoId, onStartEdit]);

  const attemptSave = useCallback(() => {
    const error = validate(inputValue);
    if (error) {
      setValidationError(error);
      // Re-focus the input after validation failure
      setTimeout(() => inputRef.current?.focus(), 0);
      return false;
    }
    onSave(todoId, inputValue.trim());
    setValidationError(null);
    return true;
  }, [inputValue, todoId, onSave]);

  const cancelEdit = useCallback(() => {
    setInputValue(initialTitle);
    setValidationError(null);
    onCancelEdit();
  }, [initialTitle, onCancelEdit]);

  // ---------------------------------------------------------------------------
  // Event handlers
  // ---------------------------------------------------------------------------
  const handleChange = useCallback((e: ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    // Prevent input beyond max length
    if (val.length > TITLE_MAX_LENGTH) {
      setValidationError('over_limit');
      // Truncate to max — the input is still controlled so we just reject
      return;
    }
    setInputValue(val);
    // Clear error as user types (re-validate live only for empty case)
    if (val.trim().length > 0) {
      setValidationError(null);
    }
  }, []);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        attemptSave();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        cancelEdit();
      } else if (e.key === 'Tab') {
        // Save and let focus move naturally
        const saved = attemptSave();
        if (!saved) {
          // Prevent tab if validation fails — keep user in the field
          e.preventDefault();
        } else {
          skipBlurRef.current = true;
        }
      }
    },
    [attemptSave, cancelEdit],
  );

  const handleBlur = useCallback(() => {
    if (skipBlurRef.current) {
      skipBlurRef.current = false;
      return;
    }
    if (!isEditing) return;
    // On blur: save if valid, otherwise keep editing mode but show error
    const error = validate(inputValue);
    if (error) {
      setValidationError(error);
      // Don't cancel — AC-EDIT-04: editing mode continues on error
      return;
    }
    onSave(todoId, inputValue.trim());
    setValidationError(null);
  }, [isEditing, inputValue, todoId, onSave]);

  // Container-level key handler for F2 (when task item has focus but not input)
  const handleContainerKeyDown = useCallback(
    (e: KeyboardEvent<HTMLDivElement>) => {
      if (e.key === 'F2' && !isEditing) {
        e.preventDefault();
        startEditing();
      }
    },
    [isEditing, startEditing],
  );

  const handleDoubleClick = useCallback(() => {
    if (!isEditing) {
      startEditing();
    }
  }, [isEditing, startEditing]);

  const handleShakeEnd = useCallback(() => {
    setIsShaking(false);
  }, []);

  return {
    isEditing,
    inputValue,
    validationError,
    charCount,
    charCountState,
    isShaking,
    inputRef,
    startEditing,
    handleChange,
    handleKeyDown,
    handleBlur,
    handleContainerKeyDown,
    handleDoubleClick,
    handleShakeEnd,
  };
}
