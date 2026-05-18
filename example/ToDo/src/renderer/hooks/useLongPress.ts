import { useCallback, useRef } from 'react';

interface UseLongPressOptions {
  threshold?: number; // ms（デフォルト 300ms）
  onLongPress: () => void;
  /** スクロール判定: touchmove がこのピクセル以上動いたらキャンセル */
  moveThreshold?: number;
}

interface UseLongPressResult {
  onTouchStart: (e: React.TouchEvent) => void;
  onTouchEnd: () => void;
  onTouchMove: (e: React.TouchEvent) => void;
}

/**
 * モバイル長押し検出カスタムフック。
 * スクロール（touchmove）と競合しないよう、移動量でキャンセル判定を行う。
 */
export function useLongPress({
  threshold = 300,
  onLongPress,
  moveThreshold = 10,
}: UseLongPressOptions): UseLongPressResult {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startPositionRef = useRef<{ x: number; y: number } | null>(null);
  const firedRef = useRef(false);

  const clear = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    startPositionRef.current = null;
  }, []);

  const onTouchStart = useCallback(
    (e: React.TouchEvent) => {
      firedRef.current = false;
      const touch = e.touches[0];
      startPositionRef.current = { x: touch.clientX, y: touch.clientY };
      timerRef.current = setTimeout(() => {
        firedRef.current = true;
        onLongPress();
        clear();
      }, threshold);
    },
    [threshold, onLongPress, clear]
  );

  const onTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!startPositionRef.current) return;
      const touch = e.touches[0];
      const dx = Math.abs(touch.clientX - startPositionRef.current.x);
      const dy = Math.abs(touch.clientY - startPositionRef.current.y);
      if (dx > moveThreshold || dy > moveThreshold) {
        clear();
      }
    },
    [moveThreshold, clear]
  );

  const onTouchEnd = useCallback(() => {
    clear();
  }, [clear]);

  return { onTouchStart, onTouchEnd, onTouchMove };
}
