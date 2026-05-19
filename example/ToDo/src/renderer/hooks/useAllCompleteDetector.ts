/**
 * useAllCompleteDetector.ts
 * 全タスク完了を検知するカスタムフック
 * DA仕様 effect-04 trigger条件準拠:
 *   - リストに1件以上のタスクが存在
 *   - 最後の未完了タスクが完了状態になった瞬間
 *   - 同一セッション内で再完了時も再発動
 */
import { useEffect, useRef } from 'react';

export interface Todo {
  id: string;
  title: string;
  completed: boolean;
}

/**
 * @param todos — 現在のtodos配列
 * @param onAllComplete — 全完了達成時に呼ばれるコールバック
 */
export function useAllCompleteDetector(
  todos: Todo[],
  onAllComplete: () => void,
): void {
  // 前回のrender時に「全完了状態だったか」を記録
  const wasAllCompletedRef = useRef<boolean>(false);

  useEffect(() => {
    if (todos.length === 0) {
      wasAllCompletedRef.current = false;
      return;
    }

    const allCompleted = todos.every((t) => t.completed);

    // 「前回は全完了でなく、今回全完了になった」瞬間にのみ発動
    if (allCompleted && !wasAllCompletedRef.current) {
      onAllComplete();
    }

    wasAllCompletedRef.current = allCompleted;
  }, [todos, onAllComplete]);
}
