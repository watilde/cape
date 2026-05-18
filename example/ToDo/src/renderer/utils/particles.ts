/**
 * パーティクルエフェクトをDOMに動的生成するユーティリティ
 * DA仕様: ハート♥・星★・キラキラ✨が3〜5個、放射状に出現・上昇・フェードアウト
 * aria-hidden="true" を付与してスクリーンリーダーから隠す
 */

const PARTICLE_EMOJIS = ['♥', '★', '✨', '🌟', '💫'];
const PARTICLE_COLORS = ['#FF6B9D', '#B197FC', '#D8A5E8'];

interface ParticleOptions {
  anchorElement: HTMLElement;
  count?: number;
}

function randomBetween(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

export function spawnParticles({ anchorElement, count = 5 }: ParticleOptions): void {
  // prefers-reduced-motion の場合はパーティクルを出さない
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReduced) return;

  const rect = anchorElement.getBoundingClientRect();
  const originX = rect.left + rect.width / 2;
  const originY = rect.top + rect.height / 2;

  for (let i = 0; i < count; i++) {
    const el = document.createElement('span');
    el.setAttribute('aria-hidden', 'true');
    el.className = 'particle';
    el.textContent = PARTICLE_EMOJIS[Math.floor(Math.random() * PARTICLE_EMOJIS.length)];

    const color = PARTICLE_COLORS[Math.floor(Math.random() * PARTICLE_COLORS.length)];
    const size = randomBetween(12, 18);
    const angle = randomBetween(0, 360);
    const distance = randomBetween(30, 70);
    const dx = Math.cos((angle * Math.PI) / 180) * distance;
    const dy = Math.sin((angle * Math.PI) / 180) * distance - 30; // 少し上方向にバイアス
    const delay = i * 40; // stagger 40ms

    Object.assign(el.style, {
      position: 'fixed',
      left: `${originX}px`,
      top: `${originY}px`,
      fontSize: `${size}px`,
      color,
      pointerEvents: 'none',
      zIndex: '9999',
      userSelect: 'none',
      transform: 'translate(-50%, -50%) scale(0)',
      opacity: '1',
    });

    document.body.appendChild(el);

    // Web Animations API で GPU加速アニメーション
    const anim = el.animate(
      [
        {
          transform: 'translate(-50%, -50%) scale(0)',
          opacity: '1',
        },
        {
          transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(1.2)`,
          opacity: '1',
          offset: 0.4,
        },
        {
          transform: `translate(calc(-50% + ${dx * 1.3}px), calc(-50% + ${dy * 1.5}px)) scale(0.8)`,
          opacity: '0',
        },
      ],
      {
        duration: 600,
        delay,
        easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
        fill: 'forwards',
      }
    );

    anim.onfinish = () => {
      el.remove();
    };
  }
}
