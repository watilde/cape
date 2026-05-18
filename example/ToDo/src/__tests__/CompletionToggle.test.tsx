/**
 * CompletionToggleコンポーネントテスト
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CompletionToggle } from '../renderer/components/CompletionToggle';

const defaultProps = {
  isCompleted: false,
  todoId: 'test-todo-1',
  todoTitle: 'テストタスク',
  onToggle: jest.fn(),
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe('CompletionToggle — アクセシビリティ', () => {
  it('role="checkbox" が設定されている', () => {
    render(<CompletionToggle {...defaultProps} />);
    expect(screen.getByRole('checkbox')).toBeInTheDocument();
  });

  it('未完了時: aria-checked="false" が設定される', () => {
    render(<CompletionToggle {...defaultProps} isCompleted={false} />);
    expect(screen.getByRole('checkbox')).toHaveAttribute('aria-checked', 'false');
  });

  it('完了時: aria-checked="true" が設定される', () => {
    render(<CompletionToggle {...defaultProps} isCompleted={true} />);
    expect(screen.getByRole('checkbox')).toHaveAttribute('aria-checked', 'true');
  });

  it('未完了時: aria-label が完了を促す文言になっている', () => {
    render(<CompletionToggle {...defaultProps} isCompleted={false} />);
    expect(screen.getByRole('checkbox')).toHaveAttribute(
      'aria-label',
      'テストタスク を完了にする'
    );
  });

  it('完了時: aria-label が解除を促す文言になっている', () => {
    render(<CompletionToggle {...defaultProps} isCompleted={true} />);
    expect(screen.getByRole('checkbox')).toHaveAttribute(
      'aria-label',
      'テストタスク の完了を解除する'
    );
  });
});

describe('CompletionToggle — インタラクション', () => {
  it('クリックでonToggleが呼ばれる', async () => {
    const onToggle = jest.fn();
    render(<CompletionToggle {...defaultProps} onToggle={onToggle} />);
    await userEvent.click(screen.getByRole('checkbox'));
    expect(onToggle).toHaveBeenCalledWith('test-todo-1');
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it('SpaceキーでonToggleが呼ばれる', async () => {
    const onToggle = jest.fn();
    render(<CompletionToggle {...defaultProps} onToggle={onToggle} />);
    const checkbox = screen.getByRole('checkbox');
    checkbox.focus();
    await userEvent.keyboard(' ');
    expect(onToggle).toHaveBeenCalledWith('test-todo-1');
  });

  it('EnterキーでonToggleが呼ばれる', async () => {
    const onToggle = jest.fn();
    render(<CompletionToggle {...defaultProps} onToggle={onToggle} />);
    const checkbox = screen.getByRole('checkbox');
    checkbox.focus();
    await userEvent.keyboard('{Enter}');
    expect(onToggle).toHaveBeenCalledWith('test-todo-1');
  });

  it('disabled=true の場合クリックしてもonToggleが呼ばれない', async () => {
    const onToggle = jest.fn();
    render(
      <CompletionToggle {...defaultProps} onToggle={onToggle} disabled={true} />
    );
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toBeDisabled();
    await userEvent.click(checkbox);
    expect(onToggle).not.toHaveBeenCalled();
  });
});

describe('CompletionToggle — ビジュアル', () => {
  it('完了時にチェックマークSVGが表示される', () => {
    render(<CompletionToggle {...defaultProps} isCompleted={true} />);
    // SVGのパスが存在することを確認
    expect(
      document.querySelector('.completion-toggle__checkmark')
    ).toBeInTheDocument();
  });

  it('未完了時にチェックマークSVGが非表示になる', () => {
    render(<CompletionToggle {...defaultProps} isCompleted={false} />);
    expect(
      document.querySelector('.completion-toggle__checkmark')
    ).not.toBeInTheDocument();
  });

  it('完了時にcircle--checkedクラスが付与される', () => {
    render(<CompletionToggle {...defaultProps} isCompleted={true} />);
    expect(
      document.querySelector('.completion-toggle__circle--checked')
    ).toBeInTheDocument();
  });
});
