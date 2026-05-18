/**
 * TaskItemコンポーネントテスト
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TaskItem } from '../renderer/components/TaskItem';
import { Todo } from '../lib/types/todo';

const mockTodo: Todo = {
  id: 'task-001',
  title: 'テストタスク',
  emoji: '📝',
  isCompleted: false,
  createdAt: 1000000,
  completedAt: null,
};

const completedTodo: Todo = {
  ...mockTodo,
  id: 'task-002',
  isCompleted: true,
  completedAt: 1000100,
};

describe('TaskItem — クラスによる状態制御（DAハンドオフノート準拠）', () => {
  it('未完了タスクに task-item--completed クラスがない', () => {
    render(
      <TaskItem
        todo={mockTodo}
        onToggleCompletion={jest.fn()}
        onRemove={jest.fn()}
      />
    );
    const item = screen.getByTestId('task-item-task-001');
    expect(item).not.toHaveClass('task-item--completed');
  });

  it('完了済みタスクに task-item--completed クラスがある', () => {
    render(
      <TaskItem
        todo={completedTodo}
        onToggleCompletion={jest.fn()}
        onRemove={jest.fn()}
      />
    );
    const item = screen.getByTestId('task-item-task-002');
    expect(item).toHaveClass('task-item--completed');
  });
});

describe('TaskItem — インタラクション', () => {
  it('チェックボックスクリックでonToggleCompletionが呼ばれる', async () => {
    const onToggle = jest.fn();
    render(
      <TaskItem
        todo={mockTodo}
        onToggleCompletion={onToggle}
        onRemove={jest.fn()}
      />
    );
    await userEvent.click(
      screen.getByTestId('completion-toggle-task-001')
    );
    expect(onToggle).toHaveBeenCalledWith('task-001');
  });

  it('削除ボタンクリックでonRemoveが呼ばれる', async () => {
    const onRemove = jest.fn();
    render(
      <TaskItem
        todo={mockTodo}
        onToggleCompletion={jest.fn()}
        onRemove={onRemove}
      />
    );
    await userEvent.click(screen.getByTestId('delete-button-task-001'));
    expect(onRemove).toHaveBeenCalledWith('task-001');
  });
});

describe('TaskItem — コンテンツ表示', () => {
  it('タイトルが表示される', () => {
    render(
      <TaskItem
        todo={mockTodo}
        onToggleCompletion={jest.fn()}
        onRemove={jest.fn()}
      />
    );
    expect(screen.getByTestId('task-title-task-001')).toHaveTextContent(
      'テストタスク'
    );
  });

  it('絵文字が表示される', () => {
    render(
      <TaskItem
        todo={mockTodo}
        onToggleCompletion={jest.fn()}
        onRemove={jest.fn()}
      />
    );
    expect(screen.getByText('📝')).toBeInTheDocument();
  });
});

describe('TaskItem — スナップショット', () => {
  it('未完了タスクのスナップショット', () => {
    const { asFragment } = render(
      <TaskItem
        todo={mockTodo}
        onToggleCompletion={jest.fn()}
        onRemove={jest.fn()}
      />
    );
    expect(asFragment()).toMatchSnapshot();
  });

  it('完了済みタスクのスナップショット', () => {
    const { asFragment } = render(
      <TaskItem
        todo={completedTodo}
        onToggleCompletion={jest.fn()}
        onRemove={jest.fn()}
      />
    );
    expect(asFragment()).toMatchSnapshot();
  });
});
