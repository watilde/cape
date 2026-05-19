import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TaskItem } from '../renderer/components/TaskItem/TaskItem';
import { TodoProvider } from '../renderer/context/TodoContext';
import { Todo } from '../renderer/types/todo';

// ---------------------------------------------------------------------------
// Mock localStorage
// ---------------------------------------------------------------------------
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, val: string) => { store[key] = val; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
  };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------
function makeTodo(overrides: Partial<Todo> = {}): Todo {
  return {
    id: 'todo-test-1',
    title: 'テストタスク',
    emoji: '📝',
    completed: false,
    createdAt: Date.now(),
    ...overrides,
  };
}

function renderWithProvider(todo: Todo) {
  return render(
    <TodoProvider>
      <TaskItem todo={todo} />
    </TodoProvider>,
  );
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe('TaskItem', () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  // ----- View mode -----
  it('タスクタイトルが表示される', () => {
    renderWithProvider(makeTodo());
    expect(screen.getByText('テストタスク')).toBeInTheDocument();
  });

  // ----- Double-click → editing mode -----
  it('ダブルクリックで編集モードに切り替わり入力フィールドが表示される', async () => {
    renderWithProvider(makeTodo());
    const container = screen.getByRole('listitem');
    await userEvent.dblClick(container);
    expect(screen.getByRole('textbox', { name: 'タスクタイトルを編集' })).toBeInTheDocument();
    expect(screen.getByText('編集中')).toBeInTheDocument();
  });

  // ----- Enter to save -----
  it('Enter確定でonSaveが呼ばれ入力フィールドが消える', async () => {
    renderWithProvider(makeTodo({ title: '元のタスク' }));
    const container = screen.getByRole('listitem');
    await userEvent.dblClick(container);
    const input = screen.getByRole('textbox', { name: 'タスクタイトルを編集' });
    await userEvent.clear(input);
    await userEvent.type(input, '新しいタスク');
    fireEvent.keyDown(input, { key: 'Enter' });
    await waitFor(() => {
      expect(screen.queryByRole('textbox', { name: 'タスクタイトルを編集' })).not.toBeInTheDocument();
      expect(screen.getByText('新しいタスク')).toBeInTheDocument();
    });
  });

  // ----- Esc to cancel -----
  it('Escキーで変更がキャンセルされ元のテキストが表示される', async () => {
    renderWithProvider(makeTodo({ title: '元のタスク' }));
    const container = screen.getByRole('listitem');
    await userEvent.dblClick(container);
    const input = screen.getByRole('textbox', { name: 'タスクタイトルを編集' });
    await userEvent.clear(input);
    await userEvent.type(input, '変更後のタスク');
    fireEvent.keyDown(input, { key: 'Escape' });
    await waitFor(() => {
      expect(screen.queryByRole('textbox', { name: 'タスクタイトルを編集' })).not.toBeInTheDocument();
      expect(screen.getByText('元のタスク')).toBeInTheDocument();
    });
  });

  // ----- Empty validation -----
  it('空文字でEnterを押すとバリデーションエラーが表示され編集モードが継続する', async () => {
    renderWithProvider(makeTodo());
    const container = screen.getByRole('listitem');
    await userEvent.dblClick(container);
    const input = screen.getByRole('textbox', { name: 'タスクタイトルを編集' });
    await userEvent.clear(input);
    fireEvent.keyDown(input, { key: 'Enter' });
    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('タスク名を入力してください');
      expect(screen.getByRole('textbox', { name: 'タスクタイトルを編集' })).toBeInTheDocument();
    });
  });

  // ----- Char counter -----
  it('編集中に文字数カウンターが表示される', async () => {
    renderWithProvider(makeTodo({ title: 'abc' }));
    const container = screen.getByRole('listitem');
    await userEvent.dblClick(container);
    await waitFor(() => {
      expect(screen.getByText('3/100')).toBeInTheDocument();
    });
  });

  // ----- Completed task lock -----
  it('完了済みタスクはダブルクリックしても編集モードにならない', async () => {
    renderWithProvider(makeTodo({ completed: true }));
    const container = screen.getByRole('listitem');
    await userEvent.dblClick(container);
    expect(screen.queryByRole('textbox', { name: 'タスクタイトルを編集' })).not.toBeInTheDocument();
  });

  it('完了済みタスクのダブルクリック時にロックツールチップが表示される', async () => {
    renderWithProvider(makeTodo({ completed: true }));
    const container = screen.getByRole('listitem');
    await userEvent.dblClick(container);
    await waitFor(() => {
      expect(screen.getByRole('tooltip')).toHaveTextContent('完了済みタスクは編集できません');
    });
  });

  // ----- aria attributes -----
  it('aria-invalid: バリデーションエラー時にtextboxのaria-invalidがtrueになる', async () => {
    renderWithProvider(makeTodo());
    const container = screen.getByRole('listitem');
    await userEvent.dblClick(container);
    const input = screen.getByRole('textbox', { name: 'タスクタイトルを編集' });
    await userEvent.clear(input);
    fireEvent.keyDown(input, { key: 'Enter' });
    await waitFor(() => {
      expect(input).toHaveAttribute('aria-invalid', 'true');
    });
  });

  // ----- F2 key -----
  it('F2キーでタスクコンテナにフォーカスがある場合に編集モードに入る', async () => {
    renderWithProvider(makeTodo());
    const container = screen.getByRole('listitem');
    act(() => container.focus());
    fireEvent.keyDown(container, { key: 'F2' });
    await waitFor(() => {
      expect(screen.getByRole('textbox', { name: 'タスクタイトルを編集' })).toBeInTheDocument();
    });
  });

  // ----- LocalStorage persistence -----
  it('編集確定後にLocalStorageに新しいタイトルが保存される', async () => {
    renderWithProvider(makeTodo({ title: '元タスク' }));
    const container = screen.getByRole('listitem');
    await userEvent.dblClick(container);
    const input = screen.getByRole('textbox', { name: 'タスクタイトルを編集' });
    await userEvent.clear(input);
    await userEvent.type(input, '保存タスク');
    fireEvent.keyDown(input, { key: 'Enter' });
    await waitFor(() => {
      const stored = JSON.parse(localStorageMock.getItem('todoapp_v1_todos') || '[]') as Todo[];
      const saved = stored.find((t) => t.id === 'todo-test-1');
      expect(saved?.title).toBe('保存タスク');
    });
  });

  // ----- Delete button -----
  it('削除ボタンクリックでタスクが削除される', async () => {
    renderWithProvider(makeTodo());
    const deleteBtn = screen.getByRole('button', { name: /タスクを削除/ });
    await userEvent.click(deleteBtn);
    await waitFor(() => {
      expect(screen.queryByText('テストタスク')).not.toBeInTheDocument();
    });
  });
});
