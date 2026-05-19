/**
 * ConfettiOverlay.tsx — Effect-04: All Tasks Complete Confetti
 * 全タスク完了検知時にconfettiをトリガーするReactラッパー
 */
import React, { useCallback } from 'react';
import { useAllCompleteDetector, Todo } from '../hooks/useAllCompleteDetector';
import { triggerConfettiEffect } from '../lib/effects';

interface ConfettiOverlayProps {
  todos: Todo[];
}

export const ConfettiOverlay: React.FC<ConfettiOverlayProps> = React.memo(({ todos }) => {
  const handleAllComplete = useCallback(() => {
    triggerConfettiEffect();
  }, []);

  useAllCompleteDetector(todos, handleAllComplete);

  // このコンポーネント自体はDOMを持たない（confettiはbody直下にCanvas生成）
  return null;
});

ConfettiOverlay.displayName = 'ConfettiOverlay';
