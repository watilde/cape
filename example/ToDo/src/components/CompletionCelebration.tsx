/**
 * CompletionCelebration コンポーネント
 * DA仕様: CSS keyframes + クリップパスのみ（ライブラリ不使用）
 * チェックボタン周辺にconfettiパーティクルを表示する
 */

import React, { useEffect, useRef } from 'react';

interface CompletionCelebrationProps {
  active: boolean;
  onComplete: () => void;
}

const CONFETTI_COLORS = ['#FF6B9D', '#D8A5E8', '#A8E6CF', '#FFD700'];
const PARTICLE_COUNT = 6;

export function CompletionCelebration({
  active,
  onComplete,
}: CompletionCelebrationProps): React.JSX.Element | null {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!active || !containerRef.current) return;

    const container = containerRef.current;
    const particles: HTMLSpanElement[] = [];

    // パーティクルを動的に生成（DA仕様: count=6, spread=60px）
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const particle = document.createElement('span');
      const angle = (360 / PARTICLE_COUNT) * i;
      const color = CONFETTI_COLORS[i % CONFETTI_COLORS.length];
      const size = 4 + Math.random() * 4; // 4〜8px（DA仕様）

      particle.className = 'confetti-particle';
      particle.style.setProperty('--angle', `${angle}deg`);
      particle.style.setProperty('--color', color);
      particle.style.setProperty('--size', `${size}px`);
      container.appendChild(particle);
      particles.push(particle);
    }

    // 600ms後にパーティクルをクリーンアップ（DA仕様: duration 600ms）
    const cleanupTimer = setTimeout(() => {
      particles.forEach((p) => {
        if (container.contains(p)) container.removeChild(p);
      });
      onComplete();
    }, 700);

    return () => {
      clearTimeout(cleanupTimer);
      particles.forEach((p) => {
        if (container.contains(p)) container.removeChild(p);
      });
    };
  }, [active, onComplete]);

  if (!active) return null;

  return (
    <div className="confetti-container" ref={containerRef} aria-hidden="true">
      <span className="confetti-message">やったね！ 🎉</span>
    </div>
  );
}
