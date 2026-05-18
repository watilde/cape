import { renderHook, act } from '@testing-library/react';
import { useLongPress } from '../renderer/hooks/useLongPress';

describe('useLongPress', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('300ms後にonLongPressが呼ばれる', () => {
    const onLongPress = jest.fn();
    const { result } = renderHook(() => useLongPress({ onLongPress, threshold: 300 }));

    act(() => {
      result.current.onTouchStart({
        touches: [{ clientX: 0, clientY: 0 }],
      } as unknown as React.TouchEvent);
    });

    expect(onLongPress).not.toHaveBeenCalled();

    act(() => {
      jest.advanceTimersByTime(300);
    });

    expect(onLongPress).toHaveBeenCalledTimes(1);
  });

  test('300ms未満でtouchEndするとonLongPressが呼ばれない', () => {
    const onLongPress = jest.fn();
    const { result } = renderHook(() => useLongPress({ onLongPress, threshold: 300 }));

    act(() => {
      result.current.onTouchStart({
        touches: [{ clientX: 0, clientY: 0 }],
      } as unknown as React.TouchEvent);
    });

    act(() => {
      jest.advanceTimersByTime(200);
      result.current.onTouchEnd();
    });

    act(() => {
      jest.advanceTimersByTime(200);
    });

    expect(onLongPress).not.toHaveBeenCalled();
  });

  test('touchmoveが移動閾値を超えるとキャンセルされる', () => {
    const onLongPress = jest.fn();
    const { result } = renderHook(() =>
      useLongPress({ onLongPress, threshold: 300, moveThreshold: 10 })
    );

    act(() => {
      result.current.onTouchStart({
        touches: [{ clientX: 0, clientY: 0 }],
      } as unknown as React.TouchEvent);
    });

    act(() => {
      jest.advanceTimersByTime(150);
      // 15px 移動（閾値10px超え）
      result.current.onTouchMove({
        touches: [{ clientX: 15, clientY: 0 }],
      } as unknown as React.TouchEvent);
    });

    act(() => {
      jest.advanceTimersByTime(200);
    });

    expect(onLongPress).not.toHaveBeenCalled();
  });

  test('touchmoveが移動閾値以内ならキャンセルされない', () => {
    const onLongPress = jest.fn();
    const { result } = renderHook(() =>
      useLongPress({ onLongPress, threshold: 300, moveThreshold: 10 })
    );

    act(() => {
      result.current.onTouchStart({
        touches: [{ clientX: 0, clientY: 0 }],
      } as unknown as React.TouchEvent);
    });

    act(() => {
      jest.advanceTimersByTime(150);
      // 5px 移動（閾値10px以内）
      result.current.onTouchMove({
        touches: [{ clientX: 5, clientY: 3 }],
      } as unknown as React.TouchEvent);
    });

    act(() => {
      jest.advanceTimersByTime(200);
    });

    expect(onLongPress).toHaveBeenCalledTimes(1);
  });

  test('カスタムthreshold値が正しく機能する', () => {
    const onLongPress = jest.fn();
    const { result } = renderHook(() => useLongPress({ onLongPress, threshold: 500 }));

    act(() => {
      result.current.onTouchStart({
        touches: [{ clientX: 0, clientY: 0 }],
      } as unknown as React.TouchEvent);
    });

    act(() => {
      jest.advanceTimersByTime(499);
    });

    expect(onLongPress).not.toHaveBeenCalled();

    act(() => {
      jest.advanceTimersByTime(1);
    });

    expect(onLongPress).toHaveBeenCalledTimes(1);
  });
});
