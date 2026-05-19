import { useCallback } from 'react';
import { fireCheckPop, fireConfetti } from '../lib/confetti/confettiEngine';
import type { ConfettiMode } from '../lib/confetti/types';

interface UseConfettiReturn {
  /**
   * タスク完了時にエフェクトを発火する
   * @param checkboxElement チェックボックスのDOM要素（エピセンター取得 + check-pop用）
   * @param remainingActiveCount 完了操作後の残アクティブタスク数
   */
  triggerCompletion: (
    checkboxElement: HTMLElement,
    remainingActiveCount: number,
  ) => void;
}

/**
 * タスク完了エフェクトフック
 *
 * DA仕様トリガーロジック:
 * - remainingActiveCount > 0 → 単一完了エフェクト（confetti-fly × 40個）
 * - remainingActiveCount === 0 → 全完了特別演出（confetti-fly-grand × 80個 + AllDoneBanner）
 * - confetti-fly と confetti-fly-grand は同時発火しない（DA仕様厳守）
 */
export function useConfetti(): UseConfettiReturn {
  const triggerCompletion = useCallback(
    (checkboxElement: HTMLElement, remainingActiveCount: number): void => {
      const mode: ConfettiMode = remainingActiveCount === 0 ? 'all' : 'single';

      // check-popを先に発火（既存チェックアニメーションと並列）
      fireCheckPop(checkboxElement);

      // confettiエフェクト発火
      fireConfetti({
        epicenterElement: checkboxElement,
        mode,
      });
    },
    [],
  );

  return { triggerCompletion };
}
