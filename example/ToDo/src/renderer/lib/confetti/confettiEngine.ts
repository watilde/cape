import {
  CONFETTI_COLORS,
  CONFETTI_DURATION_ALL,
  CONFETTI_DURATION_SINGLE,
  CONFETTI_PARTICLE_COUNT_ALL,
  CONFETTI_PARTICLE_COUNT_SINGLE,
  CONFETTI_BANNER_DURATION,
  CONFETTI_CHECK_POP_DURATION,
  DELAY_RANGE,
  DOM_CLEANUP_BUFFER,
  ROT_DELTA_RANGE,
  ROT_RANGE,
  SCALE_RANGE,
  VX_RANGE,
  VY_RANGE_ALL,
  VY_RANGE_SINGLE,
} from './constants';
import { ParticlePool } from './ParticlePool';
import type { ConfettiMode, ConfettiTriggerOptions, ParticleConfig } from './types';

// ---------------------------------------------------------------------------
// ユーティリティ
// ---------------------------------------------------------------------------

function randomBetween(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

function randomItem<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * prefers-reduced-motion チェック（JS側保護）
 * DA仕様: エフェクト発火関数の先頭でチェックし、trueの場合即時return
 */
function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

// ---------------------------------------------------------------------------
// エピセンター座標取得
// ---------------------------------------------------------------------------

function getEpicenter(element: HTMLElement): { x: number; y: number } {
  const rect = element.getBoundingClientRect();
  return {
    x: rect.left + rect.width / 2,
    y: rect.top + rect.height / 2,
  };
}

// ---------------------------------------------------------------------------
// パーティクル設定生成
// ---------------------------------------------------------------------------

function buildParticleConfig(
  epicenterX: number,
  epicenterY: number,
  mode: ConfettiMode,
): ParticleConfig {
  const vyRange = mode === 'all' ? VY_RANGE_ALL : VY_RANGE_SINGLE;
  const rot = randomBetween(ROT_RANGE.min, ROT_RANGE.max);
  const rotDelta = randomBetween(ROT_DELTA_RANGE.min, ROT_DELTA_RANGE.max);

  return {
    x: epicenterX,
    y: epicenterY,
    vx: randomBetween(VX_RANGE.min, VX_RANGE.max),
    vy: randomBetween(vyRange.min, vyRange.max),
    rot,
    rotEnd: rot + rotDelta,
    scale: randomBetween(SCALE_RANGE.min, SCALE_RANGE.max),
    color: randomItem(CONFETTI_COLORS),
    delay: randomBetween(DELAY_RANGE.min, DELAY_RANGE.max),
    shape: Math.random() < 0.6 ? 'rect' : 'circle',
    mode,
  };
}

// ---------------------------------------------------------------------------
// DA差分1: CSS変数calc()ネスト問題の代替実装
// JS側で最終到達値を直接計算し、CSS keyframeはシンプルな変数のみ使用する
// ---------------------------------------------------------------------------

function applyParticleStyles(
  el: HTMLSpanElement,
  config: ParticleConfig,
): void {
  const duration =
    config.mode === 'all' ? CONFETTI_DURATION_ALL : CONFETTI_DURATION_SINGLE;
  const animationName =
    config.mode === 'all' ? 'confetti-fly-grand' : 'confetti-fly';

  // DA仕様: rect 6×10px, circle 7×7px
  const isRect = config.shape === 'rect';
  const width = isRect ? '6px' : '7px';
  const height = isRect ? '10px' : '7px';
  const borderRadius = isRect ? '2px' : '50%';

  // DA差分1: 最終到達座標をJS側で計算
  // 100%時点: translate(x+vx, y+vy+fallPx)
  const fallPx = config.mode === 'all' ? 240 : 180;
  const finalX = config.x + config.vx;
  const finalY = config.y + config.vy + fallPx;

  // 50%中間点
  const midXOffset = config.mode === 'all' ? 0.55 : 0.5;
  const midYOffset = config.mode === 'all' ? 0.55 : 0.5;
  const midFallPx = config.mode === 'all' ? 50 : 40;
  const midX = config.x + config.vx * midXOffset;
  const midY = config.y + config.vy * midYOffset + midFallPx;
  const midRot = config.rot + (config.rotEnd - config.rot) * midXOffset;

  // 10%/8%時点（burst point）
  const burstPct = config.mode === 'all' ? 0.08 : 0.1;
  const burstX = config.x + config.vx * burstPct;
  const burstY = config.y + config.vy * burstPct;
  const burstRotDelta = config.mode === 'all' ? 25 : 20;
  const burstRot = config.rot + burstRotDelta;
  const burstScale = config.mode === 'all' ? 1.4 : config.scale;

  const finalScaleMultiplier = config.mode === 'all' ? 0.5 : 0.6;

  el.style.cssText = `
    position: absolute;
    width: ${width};
    height: ${height};
    background-color: ${config.color};
    border-radius: ${borderRadius};
    top: 0;
    left: 0;
    will-change: transform, opacity;
    --p-x0: ${config.x}px;
    --p-y0: ${config.y}px;
    --p-burst-x: ${burstX}px;
    --p-burst-y: ${burstY}px;
    --p-burst-rot: ${burstRot}deg;
    --p-burst-scale: ${burstScale};
    --p-mid-x: ${midX}px;
    --p-mid-y: ${midY}px;
    --p-mid-rot: ${midRot}deg;
    --p-mid-scale: ${config.scale};
    --p-final-x: ${finalX}px;
    --p-final-y: ${finalY}px;
    --p-final-rot: ${config.rotEnd}deg;
    --p-final-scale: ${config.scale * finalScaleMultiplier};
    animation: ${animationName} ${duration}ms ${config.delay}ms cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
  `.trim();
}

// ---------------------------------------------------------------------------
// オーバーレイコンテナ生成
// ---------------------------------------------------------------------------

function createOverlay(): HTMLDivElement {
  const overlay = document.createElement('div');
  overlay.className = 'confetti-overlay';
  overlay.setAttribute('aria-hidden', 'true');
  // DA仕様: body直下, pointer-events: none, z-index: 9999
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    pointer-events: none;
    z-index: 9999;
    overflow: hidden;
  `.trim();
  return overlay;
}

// ---------------------------------------------------------------------------
// AllDoneバナー生成（AC-02 / DA仕様準拠）
// ---------------------------------------------------------------------------

function createAllDoneBanner(): HTMLDivElement {
  const banner = document.createElement('div');
  banner.className = 'all-done-banner';
  banner.setAttribute('aria-hidden', 'true');
  banner.textContent = '🎉 全部完了！最高だよ！';
  // DA仕様: top:72px, center, gradient, Quicksand, z-index: 10000
  banner.style.cssText = `
    position: fixed;
    top: 72px;
    left: 50%;
    transform: translateX(-50%);
    background: linear-gradient(135deg, #FF6B9D 0%, #D8A5E8 100%);
    color: #FFFFFF;
    font-family: 'Quicksand', sans-serif;
    font-size: 18px;
    font-weight: 700;
    padding: 12px 28px;
    border-radius: 999px;
    box-shadow: 0 8px 32px rgba(255,107,157,0.35);
    white-space: nowrap;
    z-index: 10000;
    pointer-events: none;
    animation: all-done-banner ${CONFETTI_BANNER_DURATION}ms ease forwards;
  `.trim();
  return banner;
}

// ---------------------------------------------------------------------------
// メイン発火関数
// ---------------------------------------------------------------------------

export function fireConfetti(options: ConfettiTriggerOptions): void {
  // DA仕様: prefers-reduced-motion JS判定を先頭に配置
  if (prefersReducedMotion()) {
    return;
  }

  const { epicenterElement, mode } = options;
  const { x: epicenterX, y: epicenterY } = getEpicenter(epicenterElement);

  const particleCount =
    mode === 'all'
      ? CONFETTI_PARTICLE_COUNT_ALL
      : CONFETTI_PARTICLE_COUNT_SINGLE;

  const duration =
    mode === 'all' ? CONFETTI_DURATION_ALL : CONFETTI_DURATION_SINGLE;

  // オーバーレイ生成 → body直下に挿入（DA仕様厳守）
  const overlay = createOverlay();
  document.body.appendChild(overlay);

  // バナー（全完了時のみ）
  let banner: HTMLDivElement | null = null;
  if (mode === 'all') {
    banner = createAllDoneBanner();
    document.body.appendChild(banner);
  }

  // パーティクル生成
  const pool = ParticlePool.getInstance();
  const particles: HTMLSpanElement[] = [];

  for (let i = 0; i < particleCount; i++) {
    const config = buildParticleConfig(epicenterX, epicenterY, mode);
    const el = pool.acquire(config.shape);
    applyParticleStyles(el, config);
    overlay.appendChild(el);
    particles.push(el);
  }

  // クリーンアップ: 最長アニメーション終了後にDOMから削除
  const maxDelay = DELAY_RANGE.max;
  const cleanupDelay = duration + maxDelay + DOM_CLEANUP_BUFFER;

  const cleanupTimer = window.setTimeout(() => {
    // パーティクルをプールに返却
    particles.forEach((p) => pool.release(p));

    // オーバーレイ削除
    if (overlay.parentNode) {
      overlay.parentNode.removeChild(overlay);
    }

    // バナー削除（全完了時）
    if (banner && banner.parentNode) {
      banner.parentNode.removeChild(banner);
    }
  }, cleanupDelay);

  // ページ遷移等での緊急クリーンアップ用にタイマーIDを返す（将来的な利用）
  // 現時点ではフック側でuseEffectのcleanupで呼ばれる可能性を考慮
  (overlay as HTMLDivElement & { __cleanupTimer?: number }).__cleanupTimer =
    cleanupTimer;
}

/**
 * check-popアニメーションをチェックボックス要素に付与
 * DA差分3: transitionEndでクラスを除去し既存アニメーションへの干渉を防ぐ
 */
export function fireCheckPop(checkboxElement: HTMLElement): void {
  if (prefersReducedMotion()) {
    return;
  }

  checkboxElement.classList.add('check-pop');

  const handleAnimationEnd = (): void => {
    checkboxElement.classList.remove('check-pop');
    checkboxElement.removeEventListener('animationend', handleAnimationEnd);
  };

  checkboxElement.addEventListener('animationend', handleAnimationEnd);

  // フォールバック: animationendが発火しない場合の保険
  window.setTimeout(() => {
    checkboxElement.classList.remove('check-pop');
    checkboxElement.removeEventListener('animationend', handleAnimationEnd);
  }, CONFETTI_CHECK_POP_DURATION + 100);
}
