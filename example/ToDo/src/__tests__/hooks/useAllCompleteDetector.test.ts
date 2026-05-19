/**
 * useAllCompleteDetector.test.ts
 * 全タスク完了検知フック単体テスト
 */
import { renderHook } from '@testing-library/react';
import { useAllCompleteDetector } from '../../renderer/hooks/useAllCompleteDetector';
import type { Todo } from '../../renderer/hooks/useAllCompleteDetector';

const makeTodo = (id: string, completed: boolean): Todo => ({
  id,
  title: `Task ${id}`,
  completed,
});

describe('useAllCompleteDetector', () => {
  it('全タスクが完了したときにonAllCompleteが呼ばれる', () => {
    const onAllComplete = jest.fn();
    const todos: Todo[] = [makeTodo('1', true), makeTodo('2', true)];

    renderHook(() => useAllCompleteDetector(todos, onAllComplete));

    // 初回renderで全完了状態 → コールバック呼ばれる
    expect(onAllComplete).toHaveBeenCalledTimes(1);
  });

  it('未完了タスクが残っている場合はonAllCompleteが呼ばれない', () => {
    const onAllComplete = jest.fn();
    const todos: Todo[] = [makeTodo('1', true), makeTodo('2', false)];

    renderHook(() => useAllCompleteDetector(todos, onAllComplete));

    expect(onAllComplete).not.toHaveBeenCalled();
  });

  it('0件のtodosではonAllCompleteが呼ばれない', () => {
    const onAllComplete = jest.fn();
    const todos: Todo[] = [];

    renderHook(() => useAllCompleteDetector(todos, onAllComplete));

    expect(onAllComplete).not.toHaveBeenCalled();
  });

  it('未完了→全完了への変化でonAllCompleteが呼ばれる', () => {
    const onAllComplete = jest.fn();

    const { rerender } = renderHook(
      ({ todos }: { todos: Todo[] }) => useAllCompleteDetector(todos, onAllComplete),
      { initialProps: { todos: [makeTodo('1', false), makeTodo('2', false)] } },
    );

    expect(onAllComplete).not.toHaveBeenCalled();

    // 全完了状態に更新
    rerender({ todos: [makeTodo('1', true), makeTodo('2', true)] });

    expect(onAllComplete).toHaveBeenCalledTimes(1);
  });

  it('DA仕様 re_trigger_policy: 再度全完了になったときにも発動する', () => {
    const onAllComplete = jest.fn();

    const { rerender } = renderHook(
      ({ todos }: { todos: Todo[] }) => useAllCompleteDetector(todos, onAllComplete),
      { initialProps: { todos: [makeTodo('1', true)] } },
    );

    expect(onAllComplete).toHaveBeenCalledTimes(1);

    // タスク追加（未完了が含まれる状態）
    rerender({ todos: [makeTodo('1', true), makeTodo('2', false)] });
    expect(onAllComplete).toHaveBeenCalledTimes(1); // 増えていない

    // 再び全完了
    rerender({ todos: [makeTodo('1', true), makeTodo('2', true)] });
    expect(onAllComplete).toHaveBeenCalledTimes(2); // 再発動
  });

  it('全完了→全完了の連続rerenderでonAllCompleteが重複呼び出しされない', () => {
    const onAllComplete = jest.fn();

    const allCompletedTodos = [makeTodo('1', true), makeTodo('2', true)];

    const { rerender } = renderHook(
      ({ todos }: { todos: Todo[] }) => useAllCompleteDetector(todos, onAllComplete),
      { initialProps: { todos: allCompletedTodos } },
    );

    expect(onAllComplete).toHaveBeenCalledTimes(1);

    // 同じ全完了状態で再レンダー（例：他のstateが変化した場合）
    rerender({ todos: allCompletedTodos });
    expect(onAllComplete).toHaveBeenCalledTimes(1); // 重複呼び出しなし
  });
});
