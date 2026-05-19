import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TodoItem } from '../components/TodoItem/TodoItem';
import { Todo } from '../types/todo';

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

// ---------------------------------------------------------------------------
// Mock LocalStorage
// ---------------------------------------------------------------------------
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
  };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// ---------------------------------------------------------------------------
// Test fixtures
// ---------------------------------------------------------------------------
const activeTodo: Todo = {
  id: 'todo-001',
  title: 'テスト用タスク',
  emoji: '📝',
  status: 'active',
  createdAt: Date.now(),
};

const completedTodo: Todo = {
  ...activeTodo,
  id: 'todo-002',
  status: 'completed',
  completedAt: Date.now(),
};

const defaultProps = {
  todo: activeTodo,
  onDelete: vi.fn(),
  onToggleComplete: vi.fn(),
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function renderTodoItem(props = defaultProps) {
  return render(<TodoItem {...props} />);
}

beforeEach(() => {
  vi.clearAllMocks();
  localStorageMock.clear();
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe('TodoItem', () => {
  describe('表示モード（default state）', () => {
    it('タイトルが表示される', () => {
      renderTodoItem();
      expect(screen.getByTestId('todo-title-todo-001')).toHaveTextContent('テスト用タスク');
    });

    it('絵文字バッジが表示される', () => {
      renderTodoItem();
      expect(screen.getByText('📝')).toBeInTheDocument();
    });

    it('削除ボタンが存在する', () => {
      renderTodoItem();
      expect(screen.getByTestId('todo-delete-btn-todo-001')).toBeInTheDocument();
    });

    it('完了済みタスクにstrike-throughスタイルが適用される', () => {
      renderTodoItem({ ...defaultProps, todo: completedTodo });
      const title = screen.getByTestId('todo-title-todo-002');
      expect(title.className).toMatch(/taskTitleCompleted/);
    });
  });

  describe('編集モード開始', () => {
    it('テキストのダブルクリックで編集モードに入る (AC-EDIT-01)', async () => {
      renderTodoItem();
      const title = screen.getByTestId('todo-title-todo-001');
      fireEvent.dblClick(title);
      expect(screen.getByTestId('todo-edit-input-todo-001')).toBeInTheDocument();
    });

    it('編集ボタンのクリックで編集モードに入る (AC-EDIT-02)', async () => {
      renderTodoItem();
      const editBtn = screen.getByTestId('todo-edit-btn-todo-001');
      fireEvent.click(editBtn);
      expect(screen.getByTestId('todo-edit-input-todo-001')).toBeInTheDocument();
    });

    it('編集モード開始時にinputに既存テキストが表示される', () => {
      renderTodoItem();
      fireEvent.dblClick(screen.getByTestId('todo-title-todo-001'));
      const input = screen.getByTestId('todo-edit-input-todo-001') as HTMLInputElement;
      expect(input.value).toBe('テスト用タスク');
    });

    it('「編集中」ラベルが表示される (AC-EDIT-07)', () => {
      renderTodoItem();
      fireEvent.dblClick(screen.getByTestId('todo-title-todo-001'));
      expect(screen.getByText('編集中')).toBeInTheDocument();
    });

    it('スクリーンリーダー向けlive regionが更新される (AC-EDIT-07)', () => {
      renderTodoItem();
      fireEvent.dblClick(screen.getByTestId('todo-title-todo-001'));
      expect(screen.getByText('編集モードに切り替わりました')).toBeInTheDocument();
    });
  });

  describe('編集内容の保存', () => {
    it('Enterキーで保存され表示モードに戻る (AC-EDIT-03)', async () => {
      renderTodoItem();
      fireEvent.dblClick(screen.getByTestId('todo-title-todo-001'));
      const input = screen.getByTestId('todo-edit-input-todo-001');
      await userEvent.clear(input);
      await userEvent.type(input, '更新後タスク');
      fireEvent.keyDown(input, { key: 'Enter' });

      expect(mockUpdateTodoTitle).toHaveBeenCalledWith('todo-001', '更新後タスク');
      await waitFor(() => {
        expect(screen.queryByTestId('todo-edit-input-todo-001')).not.toBeInTheDocument();
      });
    });

    it('フォーカスアウトで保存される (AC-EDIT-05)', async () => {
      renderTodoItem();
      fireEvent.dblClick(screen.getByTestId('todo-title-todo-001'));
      const input = screen.getByTestId('todo-edit-input-todo-001');
      await userEvent.clear(input);
      await userEvent.type(input, 'フォーカスアウト保存');
      fireEvent.blur(input);

      expect(mockUpdateTodoTitle).toHaveBeenCalledWith('todo-001', 'フォーカスアウト保存');
    });
  });

  describe('編集キャンセル', () => {
    it('Escキーで編集をキャンセルし元テキストが復元される (AC-EDIT-04)', async () => {
      renderTodoItem();
      fireEvent.dblClick(screen.getByTestId('todo-title-todo-001'));
      const input = screen.getByTestId('todo-edit-input-todo-001');
      await userEvent.clear(input);
      await userEvent.type(input, '変更後テキスト');
      fireEvent.keyDown(input, { key: 'Escape' });

      expect(mockUpdateTodoTitle).not.toHaveBeenCalled();
      await waitFor(() => {
        expect(screen.getByTestId('todo-title-todo-001')).toHaveTextContent('テスト用タスク');
      });
    });
  });

  describe('空文字バリデーション', () => {
    it('空文字でEnterを押すとエラーメッセージが表示される (AC-EDIT-06)', async () => {
      renderTodoItem();
      fireEvent.dblClick(screen.getByTestId('todo-title-todo-001'));
      const input = screen.getByTestId('todo-edit-input-todo-001');
      await userEvent.clear(input);
      fireEvent.keyDown(input, { key: 'Enter' });

      expect(screen.getByText('タスク内容を入力してください')).toBeInTheDocument();
      expect(mockUpdateTodoTitle).not.toHaveBeenCalled();
    });

    it('空文字エラー時にaria-invalidがtrueになる', async () => {
      renderTodoItem();
      fireEvent.dblClick(screen.getByTestId('todo-title-todo-001'));
      const input = screen.getByTestId('todo-edit-input-todo-001');
      await userEvent.clear(input);
      fireEvent.keyDown(input, { key: 'Enter' });
      expect(input).toHaveAttribute('aria-invalid', 'true');
    });

    it('空文字でフォーカスアウトした場合は元テキストに戻る (AC-EDIT-06)', async () => {
      renderTodoItem();
      fireEvent.dblClick(screen.getByTestId('todo-title-todo-001'));
      const input = screen.getByTestId('todo-edit-input-todo-001');
      await userEvent.clear(input);
      fireEvent.blur(input);

      expect(mockUpdateTodoTitle).not.toHaveBeenCalled();
      await waitFor(() => {
        expect(screen.queryByTestId('todo-edit-input-todo-001')).not.toBeInTheDocument();
      });
    });
  });

  describe('アクセシビリティ', () => {
    it('inputにaria-labelが付与されている', () => {
      renderTodoItem();
      fireEvent.dblClick(screen.getByTestId('todo-title-todo-001'));
      expect(screen.getByLabelText('タスクを編集')).toBeInTheDocument();
    });

    it('編集ボタンにaria-labelが付与されている', () => {
      renderTodoItem();
      expect(screen.getByTestId('todo-edit-btn-todo-001')).toHaveAttribute(
        'aria-label',
        'タスクを編集'
      );
    });

    it('エラー時にaria-describedbyでエラーメッセージが関連付けられる', async () => {
      renderTodoItem();
      fireEvent.dblClick(screen.getByTestId('todo-title-todo-001'));
      const input = screen.getByTestId('todo-edit-input-todo-001');
      await userEvent.clear(input);
      fireEvent.keyDown(input, { key: 'Enter' });
      expect(input).toHaveAttribute('aria-describedby', 'error-todo-001');
    });
  });

  describe('スナップショット', () => {
    it('通常状態のスナップショット', () => {
      const { container } = renderTodoItem();
      expect(container.firstChild).toMatchSnapshot();
    });

    it('編集モードのスナップショット', () => {
      const { container } = renderTodoItem();
      fireEvent.dblClick(screen.getByTestId('todo-title-todo-001'));
      expect(container.firstChild).toMatchSnapshot();
    });

    it('エラー状態のスナップショット', async () => {
      const { container } = renderTodoItem();
      fireEvent.dblClick(screen.getByTestId('todo-title-todo-001'));
      const input = screen.getByTestId('todo-edit-input-todo-001');
      await userEvent.clear(input);
      fireEvent.keyDown(input, { key: 'Enter' });
      expect(container.firstChild).toMatchSnapshot();
    });
  });
});
