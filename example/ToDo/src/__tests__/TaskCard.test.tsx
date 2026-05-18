import React from 'react';
import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TaskCard from '../renderer/components/TaskCard';
import { TodoProvider } from '../renderer/contexts/TodoContext';
import { _resetCacheForTest } from '../lib/storage/TodoRepository';
import { Todo } from '../lib/todo/TodoCore';

// ─── localStorage モック ──────────────────────────────────────────────────────
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
    get length() { return Object.keys(store).length; },
    key: (i: number) => Object.keys(store)[i] ?? null,
  };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// ─── テストヘルパー ────────────────────────────────────────────────────────────
const baseTodo: Todo = {
  id: 'test-todo-1',
  title: 'テストタスク',
  emoji: '📝',
  isCompleted: false,
  createdAt: Date.now(),
};

const completedTodo: Todo = {
  ...baseTodo,
  id: 'test-todo-2',
  isCompleted: true,
  completedAt: Date.now(),
};

function renderWithProvider(todo: Todo) {
  return render(
    <TodoProvider>
      <TaskCard todo={todo} />
    </TodoProvider>
  );
}

beforeEach(() => {
  localStorageMock.clear();
  _resetCacheForTest();
});

// ─── 1. 通常表示 ──────────────────────────────────────────────────────────────
describe('TaskCard 通常表示', () => {
  test('タイトルとemojiが表示される', () => {
    renderWithProvider(baseTodo);
    expect(screen.getByText('テストタスク')).toBeInTheDocument();
    expect(screen.getByText('📝')).toBeInTheDocument();
  });

  test('未完了タスクにはline-throughが適用されない', () => {
    renderWithProvider(baseTodo);
    const card = screen.getByRole('listitem');
    expect(card.className).not.toContain('task-item--completed');
  });

  test('完了タスクにはtask-item--completedクラスが付与される', () => {
    renderWithProvider(completedTodo);
    const card = screen.getByRole('listitem');
    expect(card.className).toContain('task-item--completed');
  });
});

// ─── 2. 編集モード開始 ────────────────────────────────────────────────────────
describe('インライン編集 - 開始', () => {
  test('ダブルクリックで編集モードに入る', async () => {
    renderWithProvider(baseTodo);
    const titleEl = screen.getByText('テストタスク');
    fireEvent.dblClick(titleEl);
    const input = await screen.findByRole('textbox');
    expect(input).toBeInTheDocument();
    expect(input).toHaveValue('テストタスク');
  });

  test('編集モード開始時にカードにtask-item--editingクラスが付与される', async () => {
    renderWithProvider(baseTodo);
    fireEvent.dblClick(screen.getByText('テストタスク'));
    const card = await screen.findByRole('listitem');
    expect(card.className).toContain('task-item--editing');
  });

  test('編集モード中はチェックボックスがdisabledになる', async () => {
    renderWithProvider(baseTodo);
    fireEvent.dblClick(screen.getByText('テストタスク'));
    await screen.findByRole('textbox');
    const checkbox = screen.getByRole('button', { name: /タスクを完了にする/ });
    expect(checkbox).toHaveAttribute('aria-disabled', 'true');
  });
});

// ─── 3. 完了済みタスクの編集ロック ────────────────────────────────────────────
describe('完了済みタスク - 編集ロック', () => {
  test('完了済みタスクをダブルクリックしても編集モードに入らない', async () => {
    renderWithProvider(completedTodo);
    const titleEl = screen.getByText('テストタスク');
    fireEvent.dblClick(titleEl);
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  });

  test('完了済みタスクのダブルクリックでツールチップが表示される', async () => {
    renderWithProvider(completedTodo);
    fireEvent.dblClick(screen.getByText('テストタスク'));
    await screen.findByRole('tooltip');
    expect(screen.getByRole('tooltip')).toHaveTextContent(
      '完了済みのタスクです。編集するには完了を解除してください'
    );
  });
});

// ─── 4. Enter確定 ─────────────────────────────────────────────────────────────
describe('編集 - Enter確定', () => {
  test('Enterキーでテキスト変更が保存され表示モードに戻る', async () => {
    renderWithProvider(baseTodo);
    fireEvent.dblClick(screen.getByText('テストタスク'));
    const input = await screen.findByRole('textbox');
    await userEvent.clear(input);
    await userEvent.type(input, '更新されたタスク');
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });
    await waitFor(() => expect(screen.queryByRole('textbox')).not.toBeInTheDocument());
    expect(screen.getByText('更新されたタスク')).toBeInTheDocument();
  });

  test('空文字でEnterを押すとエラー状態になり編集モードを維持する', async () => {
    renderWithProvider(baseTodo);
    fireEvent.dblClick(screen.getByText('テストタスク'));
    const input = await screen.findByRole('textbox');
    await userEvent.clear(input);
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });
    expect(screen.getByRole('textbox')).toBeInTheDocument();
    const card = screen.getByRole('listitem');
    expect(card.className).toContain('task-item--editing-error');
    expect(screen.getByText('タスクは空にできません')).toBeInTheDocument();
  });
});

// ─── 5. Escapeキャンセル ──────────────────────────────────────────────────────
describe('編集 - Escapeキャンセル', () => {
  test('Escapeキーで変更が破棄され元のテキストが表示される', async () => {
    renderWithProvider(baseTodo);
    fireEvent.dblClick(screen.getByText('テストタスク'));
    const input = await screen.findByRole('textbox');
    await userEvent.clear(input);
    await userEvent.type(input, '破棄されるテキスト');
    fireEvent.keyDown(input, { key: 'Escape', code: 'Escape' });
    await waitFor(() => expect(screen.queryByRole('textbox')).not.toBeInTheDocument());
    expect(screen.getByText('テストタスク')).toBeInTheDocument();
    expect(screen.queryByText('破棄されるテキスト')).not.toBeInTheDocument();
  });
});

// ─── 6. フォーカスアウト ──────────────────────────────────────────────────────
describe('編集 - フォーカスアウト', () => {
  test('フォーカスアウトで変更が保存される', async () => {
    renderWithProvider(baseTodo);
    fireEvent.dblClick(screen.getByText('テストタスク'));
    const input = await screen.findByRole('textbox');
    await userEvent.clear(input);
    await userEvent.type(input, 'フォーカスアウト保存');
    fireEvent.blur(input);
    await waitFor(() => expect(screen.queryByRole('textbox')).not.toBeInTheDocument());
    expect(screen.getByText('フォーカスアウト保存')).toBeInTheDocument();
  });

  test('フォーカスアウト時に空文字の場合は静かに元のテキストに戻る（エラー表示なし）', async () => {
    renderWithProvider(baseTodo);
    fireEvent.dblClick(screen.getByText('テストタスク'));
    const input = await screen.findByRole('textbox');
    await userEvent.clear(input);
    fireEvent.blur(input);
    await waitFor(() => expect(screen.queryByRole('textbox')).not.toBeInTheDocument());
    expect(screen.getByText('テストタスク')).toBeInTheDocument();
    expect(screen.queryByText('タスクは空にできません')).not.toBeInTheDocument();
  });
});

// ─── 7. 完了トグル ────────────────────────────────────────────────────────────
describe('完了トグル', () => {
  test('チェックボックスクリックでisCompletedがトグルされる', async () => {
    renderWithProvider(baseTodo);
    const checkbox = screen.getByRole('button', { name: /タスクを完了にする/ });
    fireEvent.click(checkbox);
    await waitFor(() => {
      const card = screen.getByRole('listitem');
      expect(card.className).toContain('task-item--completed');
    });
  });

  test('完了状態のタスクのチェックボックスをクリックすると未完了に戻る', async () => {
    renderWithProvider(completedTodo);
    const checkbox = screen.getByRole('button', { name: /完了を解除する/ });
    fireEvent.click(checkbox);
    await waitFor(() => {
      const card = screen.getByRole('listitem');
      expect(card.className).not.toContain('task-item--completed');
    });
  });

  test('編集モード中はチェックボックスがクリックできない', async () => {
    renderWithProvider(baseTodo);
    fireEvent.dblClick(screen.getByText('テストタスク'));
    await screen.findByRole('textbox');
    const checkbox = screen.getByRole('button', { name: /タスクを完了にする/ });
    // pointer-events: none はJSDOMで検証困難なので aria-disabled で確認
    expect(checkbox).toHaveAttribute('aria-disabled', 'true');
  });
});

// ─── 8. LocalStorage永続化 ────────────────────────────────────────────────────
describe('LocalStorage永続化', () => {
  test('テキスト変更確定後にlocalStorageにデータが書き込まれる', async () => {
    renderWithProvider(baseTodo);
    fireEvent.dblClick(screen.getByText('テストタスク'));
    const input = await screen.findByRole('textbox');
    await userEvent.clear(input);
    await userEvent.type(input, '永続化テスト');
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });
    await waitFor(() => expect(screen.queryByRole('textbox')).not.toBeInTheDocument());
    const stored = JSON.parse(localStorageMock.getItem('todoapp_v1_todos') ?? '[]') as Todo[];
    const updatedTodo = stored.find((t: Todo) => t.id === baseTodo.id);
    expect(updatedTodo?.title).toBe('永続化テスト');
  });
});

// ─── 9. F2キーで編集起動 ──────────────────────────────────────────────────────
describe('キーボードナビゲーション', () => {
  test('F2キーで編集モードに入る', async () => {
    renderWithProvider(baseTodo);
    const card = screen.getByRole('listitem');
    fireEvent.keyDown(card, { key: 'F2', code: 'F2' });
    const input = await screen.findByRole('textbox');
    expect(input).toBeInTheDocument();
  });
});
