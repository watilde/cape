import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useTodoEdit } from '../hooks/useTodoEdit';

// ---------------------------------------------------------------------------
// Mock TodoContext
// ---------------------------------------------------------------------------
const mockDispatch = vi.fn();
const mockUpdateTodoTitle = vi.fn();

vi.mock('../context/TodoContext', () => ({
  useTodoContext: () => ({
    state: { todos: [], editingId: null },
    dispatch: mockDispatch,
    updateTodoTitle: mockUpdateTodoTitle,
  }),
}));

beforeEach(() => {
  vi.clearAllMocks();
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function setupHook(initialTitle = 'テストタスク') {
  return renderHook(() =>
    useTodoEdit({ todoId: 'todo-001', initialTitle })
  );
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe('useTodoEdit', () => {
  describe('startEdit', () => {
    it('isEditingをtrueにする', () => {
      const { result } = setupHook();
      act(() => {
        result.current.startEdit();
      });
      expect(result.current.isEditing).toBe(true);
    });

    it('SET_EDITING_IDをdispatchする', () => {
      const { result } = setupHook();
      act(() => {
        result.current.startEdit();
      });
      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'SET_EDITING_ID',
        payload: 'todo-001',
      });
    });

    it('inputValueを初期タイトルにリセットする', () => {
      const { result } = setupHook('既存タスク');
      act(() => {
        result.current.handleInputChange('変更中テキスト');
      });
      act(() => {
        result.current.startEdit();
      });
      expect(result.current.inputValue).toBe('既存タスク');
    });
  });

  describe('cancelEdit', () => {
    it('isEditingをfalseにして元テキストを復元する (AC-EDIT-04)', () => {
      const { result } = setupHook('元のタイトル');
      act(() => result.current.startEdit());
      act(() => result.current.handleInputChange('変更後テキスト'));
      act(() => result.current.cancelEdit());

      expect(result.current.isEditing).toBe(false);
      expect(result.current.inputValue).toBe('元のタイトル');
    });

    it('SET_EDITING_ID nullをdispatchする', () => {
      const { result } = setupHook();
      act(() => result.current.startEdit());
      act(() => result.current.cancelEdit());
      expect(mockDispatch).toHaveBeenLastCalledWith({
        type: 'SET_EDITING_ID',
        payload: null,
      });
    });

    it('LocalStorageへの書き込みが発生しない', () => {
      const { result } = setupHook();
      act(() => result.current.startEdit());
      act(() => result.current.handleInputChange('変更後テキスト'));
      act(() => result.current.cancelEdit());
      expect(mockUpdateTodoTitle).not.toHaveBeenCalled();
    });
  });

  describe('commitEdit', () => {
    it('有効なテキストを保存する (AC-EDIT-03)', () => {
      const { result } = setupHook('古いタイトル');
      act(() => result.current.startEdit());
      act(() => result.current.handleInputChange('新しいタイトル'));
      act(() => result.current.commitEdit());

      expect(mockUpdateTodoTitle).toHaveBeenCalledWith('todo-001', '新しいタイトル');
      expect(result.current.isEditing).toBe(false);
    });

    it('前後の空白をトリムして保存する', () => {
      const { result } = setupHook();
      act(() => result.current.startEdit());
      act(() => result.current.handleInputChange('  スペースあり  '));
      act(() => result.current.commitEdit());
      expect(mockUpdateTodoTitle).toHaveBeenCalledWith('todo-001', 'スペースあり');
    });

    it('空文字の場合はエラー状態にして保存しない (AC-EDIT-06)', () => {
      const { result } = setupHook('元のタイトル');
      act(() => result.current.startEdit());
      act(() => result.current.handleInputChange(''));
      act(() => result.current.commitEdit());

      expect(mockUpdateTodoTitle).not.toHaveBeenCalled();
      expect(result.current.hasError).toBe(true);
      expect(result.current.errorMessage).toBe('タスク内容を入力してください');
      expect(result.current.isEditing).toBe(true);
    });

    it('スペースのみの場合もエラーとして扱う (AC-EDIT-06)', () => {
      const { result } = setupHook();
      act(() => result.current.startEdit());
      act(() => result.current.handleInputChange('   '));
      act(() => result.current.commitEdit());

      expect(result.current.hasError).toBe(true);
      expect(mockUpdateTodoTitle).not.toHaveBeenCalled();
    });
  });

  describe('handleKeyDown', () => {
    it('Enterキーでcommitを呼ぶ (AC-EDIT-03)', () => {
      const { result } = setupHook('タイトル');
      act(() => result.current.startEdit());
      act(() => {
        result.current.handleKeyDown({
          key: 'Enter',
          preventDefault: vi.fn(),
        } as unknown as React.KeyboardEvent<HTMLInputElement>);
      });
      expect(mockUpdateTodoTitle).toHaveBeenCalled();
    });

    it('Escapeキーでcancelを呼ぶ (AC-EDIT-04)', () => {
      const { result } = setupHook('タイトル');
      act(() => result.current.startEdit());
      act(() => result.current.handleInputChange('変更中'));
      act(() => {
        result.current.handleKeyDown({
          key: 'Escape',
          preventDefault: vi.fn(),
        } as unknown as React.KeyboardEvent<HTMLInputElement>);
      });
      expect(result.current.isEditing).toBe(false);
      expect(result.current.inputValue).toBe('タイトル');
      expect(mockUpdateTodoTitle).not.toHaveBeenCalled();
    });
  });

  describe('handleBlur', () => {
    it('有効なテキストでフォーカスアウトした場合に保存する (AC-EDIT-05)', () => {
      const { result } = setupHook('元のタイトル');
      act(() => result.current.startEdit());
      act(() => result.current.handleInputChange('更新後タイトル'));
      act(() => result.current.handleBlur());
      expect(mockUpdateTodoTitle).toHaveBeenCalledWith('todo-001', '更新後タイトル');
    });

    it('空文字でフォーカスアウトした場合は元テキストを復元する (AC-EDIT-06)', () => {
      const { result } = setupHook('元のタイトル');
      act(() => result.current.startEdit());
      act(() => result.current.handleInputChange(''));
      act(() => result.current.handleBlur());

      expect(mockUpdateTodoTitle).not.toHaveBeenCalled();
      expect(result.current.isEditing).toBe(false);
      expect(result.current.inputValue).toBe('元のタイトル');
    });
  });

  describe('handleInputChange', () => {
    it('エラー状態中に文字を入力するとエラーがクリアされる', () => {
      const { result } = setupHook();
      act(() => result.current.startEdit());
      act(() => result.current.handleInputChange(''));
      act(() => result.current.commitEdit()); // trigger error
      expect(result.current.hasError).toBe(true);

      act(() => result.current.handleInputChange('新しい文字'));
      expect(result.current.hasError).toBe(false);
    });
  });
});
