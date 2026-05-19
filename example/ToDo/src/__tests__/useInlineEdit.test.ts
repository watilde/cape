import { renderHook, act } from '@testing-library/react';
import { useInlineEdit, TITLE_MAX_LENGTH } from '../renderer/hooks/useInlineEdit';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function makeOptions(overrides: Partial<Parameters<typeof useInlineEdit>[0]> = {}) {
  const onSave = jest.fn();
  const onStartEdit = jest.fn();
  const onCancelEdit = jest.fn();
  return {
    options: {
      todoId: 'todo-1',
      initialTitle: 'テストタスク',
      isCompleted: false,
      editingId: null as string | null,
      onSave,
      onStartEdit,
      onCancelEdit,
      ...overrides,
    },
    onSave,
    onStartEdit,
    onCancelEdit,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe('useInlineEdit', () => {
  // --- Initial state ---
  it('初期状態: isEditing=false・validationError=null', () => {
    const { options } = makeOptions();
    const { result } = renderHook(() => useInlineEdit(options));
    expect(result.current.isEditing).toBe(false);
    expect(result.current.validationError).toBeNull();
    expect(result.current.charCount).toBe('テストタスク'.length);
  });

  // --- startEditing ---
  it('startEditing: 非完了タスクでonStartEditが呼ばれる', () => {
    const { options, onStartEdit } = makeOptions();
    const { result } = renderHook(() => useInlineEdit(options));
    act(() => result.current.startEditing());
    expect(onStartEdit).toHaveBeenCalledWith('todo-1');
  });

  it('startEditing: 完了済みタスクではonStartEditは呼ばれずisShaking=trueになる', () => {
    const { options, onStartEdit } = makeOptions({ isCompleted: true });
    const { result } = renderHook(() => useInlineEdit(options));
    act(() => result.current.startEditing());
    expect(onStartEdit).not.toHaveBeenCalled();
    expect(result.current.isShaking).toBe(true);
  });

  // --- isEditing derived from editingId ---
  it('editingIdが自分のIDと一致するときisEditing=true', () => {
    const { options } = makeOptions({ editingId: 'todo-1' });
    const { result } = renderHook(() => useInlineEdit(options));
    expect(result.current.isEditing).toBe(true);
  });

  it('editingIdが別IDならisEditing=false', () => {
    const { options } = makeOptions({ editingId: 'todo-99' });
    const { result } = renderHook(() => useInlineEdit(options));
    expect(result.current.isEditing).toBe(false);
  });

  // --- handleChange ---
  it('handleChange: 通常入力でinputValueが更新される', () => {
    const { options } = makeOptions({ editingId: 'todo-1' });
    const { result } = renderHook(() => useInlineEdit(options));
    act(() => {
      result.current.handleChange({
        target: { value: '新しいタスク' },
      } as React.ChangeEvent<HTMLTextAreaElement>);
    });
    expect(result.current.inputValue).toBe('新しいタスク');
  });

  it('handleChange: 101文字入力はrejectされinputValueが変わらない', () => {
    const { options } = makeOptions({ editingId: 'todo-1', initialTitle: '' });
    const { result } = renderHook(() => useInlineEdit(options));
    const over = 'a'.repeat(TITLE_MAX_LENGTH + 1);
    act(() => {
      result.current.handleChange({
        target: { value: over },
      } as React.ChangeEvent<HTMLTextAreaElement>);
    });
    expect(result.current.inputValue).toBe('');
    expect(result.current.validationError).toBe('over_limit');
  });

  // --- handleKeyDown: Enter ---
  it('Enterキー: 有効な文字列でonSaveが呼ばれる', () => {
    const { options, onSave } = makeOptions({
      editingId: 'todo-1',
      initialTitle: '有効なタスク',
    });
    const { result } = renderHook(() => useInlineEdit(options));
    act(() => {
      result.current.handleKeyDown({
        key: 'Enter',
        preventDefault: jest.fn(),
      } as unknown as React.KeyboardEvent<HTMLTextAreaElement>);
    });
    expect(onSave).toHaveBeenCalledWith('todo-1', '有効なタスク');
  });

  it('Enterキー: 空文字でvalidationError=emptyになりonSaveは呼ばれない', () => {
    const { options, onSave } = makeOptions({
      editingId: 'todo-1',
      initialTitle: '',
    });
    const { result } = renderHook(() => useInlineEdit({ ...options, initialTitle: '' }));
    act(() => {
      result.current.handleKeyDown({
        key: 'Enter',
        preventDefault: jest.fn(),
      } as unknown as React.KeyboardEvent<HTMLTextAreaElement>);
    });
    expect(onSave).not.toHaveBeenCalled();
    expect(result.current.validationError).toBe('empty');
  });

  // --- handleKeyDown: Escape ---
  it('Escキー: onCancelEditが呼ばれinputValueが初期値に戻る', () => {
    const { options, onCancelEdit } = makeOptions({
      editingId: 'todo-1',
      initialTitle: '元のタスク',
    });
    const { result } = renderHook(() => useInlineEdit(options));
    // Change value first
    act(() => {
      result.current.handleChange({
        target: { value: '変更後' },
      } as React.ChangeEvent<HTMLTextAreaElement>);
    });
    act(() => {
      result.current.handleKeyDown({
        key: 'Escape',
        preventDefault: jest.fn(),
      } as unknown as React.KeyboardEvent<HTMLTextAreaElement>);
    });
    expect(onCancelEdit).toHaveBeenCalled();
    expect(result.current.inputValue).toBe('元のタスク');
  });

  // --- Char count states ---
  it('charCountState: 0〜79文字でnormal', () => {
    const { options } = makeOptions({
      editingId: 'todo-1',
      initialTitle: 'あ'.repeat(50),
    });
    const { result } = renderHook(() => useInlineEdit(options));
    expect(result.current.charCountState).toBe('normal');
  });

  it('charCountState: 80〜99文字でwarning', () => {
    const { options } = makeOptions({
      editingId: 'todo-1',
      initialTitle: 'あ'.repeat(85),
    });
    const { result } = renderHook(() => useInlineEdit(options));
    expect(result.current.charCountState).toBe('warning');
  });

  it('charCountState: 100文字でlimit', () => {
    const { options } = makeOptions({
      editingId: 'todo-1',
      initialTitle: 'あ'.repeat(TITLE_MAX_LENGTH),
    });
    const { result } = renderHook(() => useInlineEdit(options));
    expect(result.current.charCountState).toBe('limit');
  });

  // --- handleBlur ---
  it('handleBlur: 有効な値でonSaveが呼ばれる', () => {
    const { options, onSave } = makeOptions({
      editingId: 'todo-1',
      initialTitle: '保存されるタスク',
    });
    const { result } = renderHook(() => useInlineEdit(options));
    act(() => result.current.handleBlur());
    expect(onSave).toHaveBeenCalledWith('todo-1', '保存されるタスク');
  });

  it('handleBlur: 空文字でvalidationErrorが設定されonSaveは呼ばれない', () => {
    const { options, onSave } = makeOptions({
      editingId: 'todo-1',
      initialTitle: '',
    });
    const { result } = renderHook(() => useInlineEdit(options));
    act(() => result.current.handleBlur());
    expect(onSave).not.toHaveBeenCalled();
    expect(result.current.validationError).toBe('empty');
  });

  // --- handleContainerKeyDown: F2 ---
  it('F2キー: 非編集中にstartEditingが発火する', () => {
    const { options, onStartEdit } = makeOptions({ editingId: null });
    const { result } = renderHook(() => useInlineEdit(options));
    act(() => {
      result.current.handleContainerKeyDown({
        key: 'F2',
        preventDefault: jest.fn(),
      } as unknown as React.KeyboardEvent<HTMLDivElement>);
    });
    expect(onStartEdit).toHaveBeenCalled();
  });

  it('F2キー: 編集中は何もしない', () => {
    const { options, onStartEdit } = makeOptions({ editingId: 'todo-1' });
    const { result } = renderHook(() => useInlineEdit(options));
    act(() => {
      result.current.handleContainerKeyDown({
        key: 'F2',
        preventDefault: jest.fn(),
      } as unknown as React.KeyboardEvent<HTMLDivElement>);
    });
    expect(onStartEdit).not.toHaveBeenCalled();
  });

  // --- handleShakeEnd ---
  it('handleShakeEnd: isShakingがfalseになる', () => {
    const { options } = makeOptions({ isCompleted: true });
    const { result } = renderHook(() => useInlineEdit(options));
    act(() => result.current.startEditing()); // triggers shake
    expect(result.current.isShaking).toBe(true);
    act(() => result.current.handleShakeEnd());
    expect(result.current.isShaking).toBe(false);
  });

  // --- Boundary: exactly 100 chars ---
  it('100文字ちょうどの入力はacceptされvalidationErrorなし', () => {
    const { options } = makeOptions({ editingId: 'todo-1', initialTitle: '' });
    const { result } = renderHook(() => useInlineEdit(options));
    const exact = 'a'.repeat(TITLE_MAX_LENGTH);
    act(() => {
      result.current.handleChange({
        target: { value: exact },
      } as React.ChangeEvent<HTMLTextAreaElement>);
    });
    expect(result.current.inputValue).toBe(exact);
    expect(result.current.validationError).toBeNull();
  });
});
