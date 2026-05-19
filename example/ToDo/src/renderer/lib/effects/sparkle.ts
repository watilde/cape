/**
 * sparkle.ts — Effect-01: Task Complete Sparkle
 * DA仕様 task-1779177098685 準拠
 * CSS Math Functions不使用 / Math.cos・Math.sinで計算しCSS変数として渡す
 */

export interface SparkleParticleConfig {
  /** チェックボックス中心のviewport座標 */
  originX: number;
  originY: number;
}

interface ParticleVector {
  tx20: number;
  ty20: number;
  tx60: number;
  ty60: number;
  tx100: number;
  ty100: number;
}

// DA仕様の8方向ベクトル（角度45deg刻み・半径: 14px / 26px / 32px）
const SPREAD_RADII = { r20: 14, r60: 26, r100: 32 } as const;

// DA仕様の色定義
const SPARKLE_COLORS = [
  '#FF6B9D', // Sweet Pink × 4
  '#FF6B9D',
  '#FF6B9D',
  '#FF6B9D',
  '#D8A5E8', // Lavender × 2
  '#D8A5E8',
  '#FFE66D', // Soft Gold × 2
  '#FFE66D',
] as const;

/**
 * 8個のパーティクルのCSS変数ベクトルを計算する
 * DA仕様の具体値（angle 0/45/90/135/180/225/270/315 deg）に準拠
 */
function calculateParticleVectors(): ParticleVector[] {
  const angles = [0, 45, 90, 135, 180, 225, 270, 315];
  return angles.map((angleDeg) => {
    const rad = (angleDeg * Math.PI) / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);
    return {
      // 上方向をマイナスYとするため sinにマイナス（SVG座標系合わせ）
      tx20: Math.round(cos * SPREAD_RADII.r20),
      ty20: Math.round(sin * SPREAD_RADII.r20),
      tx60: Math.round(cos * SPREAD_RADII.r60),
      ty60: Math.round(sin * SPREAD_RADII.r60),
      tx100: Math.round(cos * SPREAD_RADII.r100),
      ty100: Math.round(sin * SPREAD_RADII.r100),
    };
  });
}

/**
 * スパークルパーティクルを生成してDOMに追加する
 * DA仕様: チェックマーク確定後 0.05s ディレイで開始
 * @returns cleanup関数（タイマークリア用）
 */
export function triggerSparkleEffect(config: SparkleParticleConfig): () => void {
  // prefers-reduced-motion チェック
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReducedMotion) {
    return () => {};
  }

  const vectors = calculateParticleVectors();
  const particles: HTMLElement[] = [];

  const startTimer = setTimeout(() => {
    vectors.forEach((vec, i) => {
      const particle = document.createElement('div');
      particle.className = 'sparkle-particle';

      // サイズのランダムバリエーション: 6px〜10px (基本8px ± 2px)
      const size = 6 + Math.random() * 4;
      particle.style.width = `${size}px`;
      particle.style.height = `${size}px`;

      // 色を設定
      particle.style.backgroundColor = SPARKLE_COLORS[i];

      // 方向ベクトルをCSS変数として注入
      particle.style.setProperty('--tx-20', `${vec.tx20}px`);
      particle.style.setProperty('--ty-20', `${vec.ty20}px`);
      particle.style.setProperty('--tx-60', `${vec.tx60}px`);
      particle.style.setProperty('--ty-60', `${vec.ty60}px`);
      particle.style.setProperty('--tx-100', `${vec.tx100}px`);
      particle.style.setProperty('--ty-100', `${vec.ty100}px`);

      // 原点をチェックボックス中心に配置
      particle.style.left = `${config.originX - size / 2}px`;
      particle.style.top = `${config.originY - size / 2}px`;

      document.body.appendChild(particle);
      particles.push(particle);
    });

    // DA仕様: 0.75s後にパーティクルDOM削除（メモリリーク防止）
    const cleanupTimer = setTimeout(() => {
      particles.forEach((p) => {
        if (p.parentNode) {
          p.parentNode.removeChild(p);
        }
      });
    }, 750);

    return cleanupTimer;
  }, 50); // DA仕様: 0.05s delay

  return () => {
    clearTimeout(startTimer);
    particles.forEach((p) => {
      if (p.parentNode) {
        p.parentNode.removeChild(p);
      }
    });
  };
}
