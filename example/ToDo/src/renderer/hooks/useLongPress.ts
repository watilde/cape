import { useCallback, useRef } from 'react';

interface UseLongPressOptions {
  onLongPress: () => void;
  threshold?: number; // ms, default 500
}

interface UseLongPressHandlers {
  onMouseDown: (e: React.MouseEvent) => void;
  onMouseUp: (e: React.MouseEvent) => void;
  onMouseLeave: (e: React.MouseEvent) => void;
  onTouchStart: (e: React.TouchEvent) => void;
  onTouchEnd: (e: React.TouchEvent) => void;
}

export function useLongPress({
  onLongPress,
  threshold = 500,
}: UseLongPressOptions): UseLongPressHandlers {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const start = useCallback(() => {
    timerRef.current = setTimeout(() => {
      onLongPress();
    }, threshold);
  }, [onLongPress, threshold]);

  const cancel = useCallback(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  return {
    onMouseDown: () => start(),
    onMouseUp: () => cancel(),
    onMouseLeave: () => cancel(),
    onTouchStart: () => start(),
    onTouchEnd: () => cancel(),
  };
}
