/**
 * sparkle.test.ts — Effect-01スパークルロジック単体テスト
 */
import { triggerSparkleEffect } from '../../renderer/lib/effects/sparkle';

// DOM環境のモック
beforeEach(() => {
  document.body.innerHTML = '';
  // window.matchMedia のモック
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation((query: string) => ({
      matches: false, // prefers-reduced-motion: no-preference
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  });
});

afterEach(() => {
  jest.useRealTimers();
  document.body.innerHTML = '';
});

describe('triggerSparkleEffect', () => {
  it('8個のパーティクルを生成してDOMに追加する', () => {
    jest.useFakeTimers();

    triggerSparkleEffect({ originX: 100, originY: 200 });

    // 0.05s後にパーティクルが生成される
    jest.advanceTimersByTime(60);

    const particles = document.querySelectorAll('.sparkle-particle');
    expect(particles).toHaveLength(8);
  });

  it('各パーティクルに正しいCSS変数が設定されている', () => {
    jest.useFakeTimers();

    triggerSparkleEffect({ originX: 100, originY: 200 });
    jest.advanceTimersByTime(60);

    const particles = document.querySelectorAll('.sparkle-particle');
    particles.forEach((p) => {
      const el = p as HTMLElement;
      // CSS変数が設定されていることを確認
      expect(el.style.getPropertyValue('--tx-20')).toBeTruthy();
      expect(el.style.getPropertyValue('--ty-20')).toBeTruthy();
      expect(el.style.getPropertyValue('--tx-60')).toBeTruthy();
      expect(el.style.getPropertyValue('--ty-60')).toBeTruthy();
      expect(el.style.getPropertyValue('--tx-100')).toBeTruthy();
      expect(el.style.getPropertyValue('--ty-100')).toBeTruthy();
    });
  });

  it('DA仕様の色分布: SweetPink×4, Lavender×2, SoftGold×2', () => {
    jest.useFakeTimers();

    triggerSparkleEffect({ originX: 100, colorY: 200 } as any);
    jest.advanceTimersByTime(60);

    const particles = Array.from(
      document.querySelectorAll('.sparkle-particle'),
    ) as HTMLElement[];

    const colorCounts: Record<string, number> = {};
    particles.forEach((p) => {
      const color = p.style.backgroundColor || p.style.getPropertyValue('background-color');
      // CSSではRGBに変換される場合があるのでbackgroundColorで確認
      // 直接style.backgroundColorを確認
      const rawColor = p.getAttribute('style') || '';
      if (rawColor.includes('FF6B9D') || rawColor.includes('ff6b9d')) {
        colorCounts['#FF6B9D'] = (colorCounts['#FF6B9D'] || 0) + 1;
      } else if (rawColor.includes('D8A5E8') || rawColor.includes('d8a5e8')) {
        colorCounts['#D8A5E8'] = (colorCounts['#D8A5E8'] || 0) + 1;
      } else if (rawColor.includes('FFE66D') || rawColor.includes('ffe66d')) {
        colorCounts['#FFE66D'] = (colorCounts['#FFE66D'] || 0) + 1;
      }
    });

    expect(colorCounts['#FF6B9D']).toBe(4);
    expect(colorCounts['#D8A5E8']).toBe(2);
    expect(colorCounts['#FFE66D']).toBe(2);
  });

  it('0.75s後にパーティクルがDOMから削除される（メモリリーク防止）', () => {
    jest.useFakeTimers();

    triggerSparkleEffect({ originX: 100, originY: 200 });
    jest.advanceTimersByTime(60); // パーティクル生成

    expect(document.querySelectorAll('.sparkle-particle')).toHaveLength(8);

    jest.advanceTimersByTime(760); // 0.75s後

    expect(document.querySelectorAll('.sparkle-particle')).toHaveLength(0);
  });

  it('prefers-reduced-motionがtrueの場合、パーティクルを生成しない', () => {
    jest.useFakeTimers();

    // reduced-motion を有効化
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: jest.fn().mockImplementation((query: string) => ({
        matches: query.includes('prefers-reduced-motion'),
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      })),
    });

    triggerSparkleEffect({ originX: 100, originY: 200 });
    jest.advanceTimersByTime(200);

    const particles = document.querySelectorAll('.sparkle-particle');
    expect(particles).toHaveLength(0);
  });

  it('cleanup関数を呼ぶとパーティクルが即座に削除される', () => {
    jest.useFakeTimers();

    const cleanup = triggerSparkleEffect({ originX: 100, originY: 200 });
    jest.advanceTimersByTime(60);

    expect(document.querySelectorAll('.sparkle-particle')).toHaveLength(8);

    cleanup();

    expect(document.querySelectorAll('.sparkle-particle')).toHaveLength(0);
  });
});
