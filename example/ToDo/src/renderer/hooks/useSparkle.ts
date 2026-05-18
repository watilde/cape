/**
 * useSparkleフック
 * - 完了時のスパークルパーティクルエフェクト
 * - DOMに動的に追加し、animationend後に自動削除
 */
import { useCallback, useRef } from 'react';

interface SparkleConfig {
  colors?: string[];
  count?: number;
}

const DEFAULT_COLORS = ['#FF6B9D', '#D8A5E8', '#A8E6CF', '#FFD700'];
const DEFAULT_COUNT = 5;

/**
 * パーティクル1個のスタイルをランダム生成
 */
function createParticleStyle(index: number, count: number): Partial<CSSStyleDeclaration> {
  const angle = (360 / count) * index + Math.random() * 30 - 15;
  const distance = 24 + Math.random() * 16; // 24px〜40px
  const size = 4 + Math.random() * 4; // 4px〜8px
  const duration = 350 + Math.random() * 100; // 350ms〜450ms

  return {
    position: 'absolute',
    width: `${size}px`,
    height: `${size}px`,
    borderRadius: '50%',
    pointerEvents: 'none',
    willChange: 'transform, opacity',
    animation: `sparkle-fly ${duration}ms ease-out forwards`,
    '--sparkle-angle': `${angle}deg`,
    '--sparkle-distance': `${distance}px`,
  } as Partial<CSSStyleDeclaration>;
}

export function useSparkle(config: SparkleConfig = {}) {
  const {
    colors = DEFAULT_COLORS,
    count = DEFAULT_COUNT,
  } = config;

  const containerRef = useRef<HTMLElement | null>(null);

  const triggerSparkle = useCallback(
    (targetElement: HTMLElement): void => {
      const rect = targetElement.getBoundingClientRect();
      const parent = document.body;

      // チェックボックスの中央座標
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      for (let i = 0; i < count; i++) {
        const particle = document.createElement('span');
        particle.className = 'sparkle-particle';

        // スタイル適用
        const style = createParticleStyle(i, count);
        Object.assign(particle.style, style);

        // ランダムカラー
        particle.style.backgroundColor =
          colors[Math.floor(Math.random() * colors.length)];

        // 絶対座標でbodyに配置
        particle.style.left = `${centerX}px`;
        particle.style.top = `${centerY}px`;
        particle.style.transform = 'translate(-50%, -50%)';
        particle.style.zIndex = '9999';

        parent.appendChild(particle);

        // animationend後に削除（メモリリーク防止）
        particle.addEventListener(
          'animationend',
          () => {
            particle.remove();
          },
          { once: true }
        );
      }
    },
    [colors, count]
  );

  return { triggerSparkle, containerRef };
}
