import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { useConfetti } from '../../hooks/useConfetti';

// ---------------------------------------------------------------------------
// テスト用コンポーネント
// ---------------------------------------------------------------------------

interface TestProps {
  remainingActiveCount: number;
  onTrigger?: () => void;
}

const TestComponent: React.FC<TestProps> = ({
  remainingActiveCount,
  onTrigger,
}) => {
  const { triggerCompletion } = useConfetti();
  const ref = React.useRef<HTMLButtonElement>(null);

  return (
    <button
      ref={ref}
      onClick={() => {
        if (ref.current) {
          triggerCompletion(ref.current, remainingActiveCount);
          onTrigger?.();
        }
      }}
      data-testid="trigger-btn"
    >
      完了
    </button>
  );
};

// ---------------------------------------------------------------------------
// モックセットアップ
// ---------------------------------------------------------------------------

// confettiEngineをモック化してDOM副作用を排除
jest.mock('../../lib/confetti/confettiEngine', () => ({
  fireConfetti: jest.fn(),
  fireCheckPop: jest.fn(),
}));

import { fireConfetti, fireCheckPop } from '../../lib/confetti/confettiEngine';

const mockFireConfetti = fireConfetti as jest.MockedFunction<
  typeof fireConfetti
>;
const mockFireCheckPop = fireCheckPop as jest.MockedFunction<
  typeof fireCheckPop
>;

// ---------------------------------------------------------------------------
// テストスイート
// ---------------------------------------------------------------------------

describe('useConfetti', () => {
  beforeEach(() => {
    mockFireConfetti.mockClear();
    mockFireCheckPop.mockClear();
  });

  it('残アクティブタスクが1以上の場合、mode: single でfireConfettiを呼び出す', () => {
    render(<TestComponent remainingActiveCount={3} />);
    fireEvent.click(screen.getByTestId('trigger-btn'));

    expect(mockFireConfetti).toHaveBeenCalledTimes(1);
    expect(mockFireConfetti).toHaveBeenCalledWith(
      expect.objectContaining({ mode: 'single' }),
    );
  });

  it('残アクティブタスクが0の場合、mode: all でfireConfettiを呼び出す', () => {
    render(<TestComponent remainingActiveCount={0} />);
    fireEvent.click(screen.getByTestId('trigger-btn'));

    expect(mockFireConfetti).toHaveBeenCalledTimes(1);
    expect(mockFireConfetti).toHaveBeenCalledWith(
      expect.objectContaining({ mode: 'all' }),
    );
  });

  it('fireCheckPopが必ずエピセンター要素と共に呼び出される', () => {
    render(<TestComponent remainingActiveCount={2} />);
    fireEvent.click(screen.getByTestId('trigger-btn'));

    expect(mockFireCheckPop).toHaveBeenCalledTimes(1);
    expect(mockFireCheckPop).toHaveBeenCalledWith(expect.any(HTMLButtonElement));
  });

  it('confetti-flyとconfetti-fly-grandが同時発火しない（mode排他制御）', () => {
    const { rerender } = render(<TestComponent remainingActiveCount={1} />);
    fireEvent.click(screen.getByTestId('trigger-btn'));

    const firstCall = mockFireConfetti.mock.calls[0][0];
    expect(firstCall.mode).toBe('single');

    mockFireConfetti.mockClear();

    rerender(<TestComponent remainingActiveCount={0} />);
    fireEvent.click(screen.getByTestId('trigger-btn'));

    const secondCall = mockFireConfetti.mock.calls[0][0];
    expect(secondCall.mode).toBe('all');

    // 各呼び出しでmodeは一つのみ
    expect(mockFireConfetti).toHaveBeenCalledTimes(1);
  });

  it('epicenterElementとしてチェックボックスのrefが渡される', () => {
    render(<TestComponent remainingActiveCount={1} />);
    const btn = screen.getByTestId('trigger-btn');
    fireEvent.click(btn);

    expect(mockFireConfetti).toHaveBeenCalledWith(
      expect.objectContaining({ epicenterElement: btn }),
    );
  });
});
