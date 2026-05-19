/**
 * confetti.ts — Effect-04: All Tasks Complete Confetti
 * DA仕様 task-1779177098685 準拠
 * Canvas APIによるバニラJS実装（ライブラリ不使用）
 * CSS Math Functions不使用
 */

type ParticleShape = 'circle' | 'rectangle' | 'petal';

interface ConfettiParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;
  rotationSpeed: number;
  color: string;
  shape: ParticleShape;
  opacity: number;
}

// DA仕様の定義
const CONFETTI_COLORS = ['#FF6B9D', '#D8A5E8', '#A8E6CF', '#FFDCC7', '#FFE66D'] as const;
const PARTICLE_COUNT = 28;
const TOTAL_DURATION_MS = 2500;
const FADE_START_MS = 2000;
const GRAVITY = 0.12;
const MAX_VY = 6.0;
const AIR_RESISTANCE = 0.99;

// DA仕様: circle 12個、rectangle 8個、petal 8個
const SHAPE_DISTRIBUTION: ParticleShape[] = [
  ...Array(12).fill('circle'),
  ...Array(8).fill('rectangle'),
  ...Array(8).fill('petal'),
];

export function initConfettiParticles(canvasWidth: number): ConfettiParticle[] {
  return Array.from({ length: PARTICLE_COUNT }, (_, i) => {
    // 色をランダム均等割り当て（5色 × 5〜6個）
    const color = CONFETTI_COLORS[i % CONFETTI_COLORS.length];
    const shape = SHAPE_DISTRIBUTION[i];

    return {
      x: Math.random() * canvasWidth,
      y: -10 - Math.random() * 20, // 画面上部 -10〜-30px
      vx: -1.5 + Math.random() * 3.0, // DA仕様: -1.5〜1.5
      vy: 2.5 + Math.random() * 2.0, // DA仕様: 2.5〜4.5
      rotation: Math.random() * 360,
      rotationSpeed: -3.0 + Math.random() * 6.0, // DA仕様: -3.0〜3.0
      color,
      shape,
      opacity: 1.0,
    };
  });
}

function drawParticle(ctx: CanvasRenderingContext2D, p: ConfettiParticle): void {
  ctx.save();
  ctx.globalAlpha = p.opacity;
  ctx.fillStyle = p.color;
  ctx.translate(p.x, p.y);
  ctx.rotate((p.rotation * Math.PI) / 180);

  switch (p.shape) {
    case 'circle':
      ctx.beginPath();
      ctx.arc(0, 0, 3, 0, Math.PI * 2);
      ctx.fill();
      break;

    case 'rectangle':
      ctx.fillRect(-2, -4, 4, 8);
      break;

    case 'petal':
      // 花びら形: bezierCurveで楕円を描く
      ctx.beginPath();
      ctx.moveTo(0, -6);
      ctx.bezierCurveTo(4, -3, 4, 3, 0, 6);
      ctx.bezierCurveTo(-4, 3, -4, -3, 0, -6);
      ctx.fill();
      break;
  }

  ctx.restore();
}

/**
 * confettiアニメーションを開始する
 * @returns cleanup関数（早期終了用）
 */
export function triggerConfettiEffect(): () => void {
  // prefers-reduced-motion チェック
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // 祝福メッセージは常に表示（reduced-motionでもテキストは表示）
  const messageEl = createCelebrationMessage(prefersReducedMotion);
  document.body.appendChild(messageEl);

  if (prefersReducedMotion) {
    // DA仕様 reduced-motion fallback: confetti非表示・メッセージのみ
    messageEl.style.opacity = '1';
    const removeTimer = setTimeout(() => {
      if (messageEl.parentNode) {
        messageEl.parentNode.removeChild(messageEl);
      }
    }, 2500);
    return () => {
      clearTimeout(removeTimer);
      if (messageEl.parentNode) {
        messageEl.parentNode.removeChild(messageEl);
      }
    };
  }

  // 既存canvasを破棄（DA仕様 re_trigger_policy）
  const existingCanvas = document.getElementById('confetti-canvas');
  if (existingCanvas && existingCanvas.parentNode) {
    existingCanvas.parentNode.removeChild(existingCanvas);
  }

  // Canvas生成
  const canvas = document.createElement('canvas');
  canvas.id = 'confetti-canvas';
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  canvas.style.position = 'fixed';
  canvas.style.top = '0';
  canvas.style.left = '0';
  canvas.style.zIndex = '200';
  canvas.style.pointerEvents = 'none'; // DA仕様: タスクリスト操作をブロックしない
  document.body.appendChild(canvas);

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    return () => {};
  }

  const particles = initConfettiParticles(canvas.width);
  const startTime = performance.now();
  let animationFrameId: number;
  let isCleanedUp = false;

  function animate(now: number): void {
    if (isCleanedUp) return;

    const elapsed = now - startTime;
    ctx!.clearRect(0, 0, canvas.width, canvas.height);

    // フェードフェーズ計算 (DA仕様: 2000ms〜2500ms)
    let globalOpacity = 1.0;
    if (elapsed > FADE_START_MS) {
      globalOpacity = 1.0 - (elapsed - FADE_START_MS) / (TOTAL_DURATION_MS - FADE_START_MS);
      globalOpacity = Math.max(0, Math.min(1, globalOpacity));
    }

    particles.forEach((p) => {
      // 重力適用 (DA仕様)
      p.vy = Math.min(p.vy + GRAVITY, MAX_VY);
      p.vx *= AIR_RESISTANCE;
      p.vy *= AIR_RESISTANCE;
      p.x += p.vx;
      p.y += p.vy;
      p.rotation += p.rotationSpeed;
      p.opacity = globalOpacity;
      drawParticle(ctx!, p);
    });

    if (elapsed < TOTAL_DURATION_MS) {
      animationFrameId = requestAnimationFrame(animate);
    } else {
      // DA仕様: 2500ms後にcanvasとメッセージをDOMから削除
      cleanup();
    }
  }

  function cleanup(): void {
    isCleanedUp = true;
    cancelAnimationFrame(animationFrameId);
    if (canvas.parentNode) {
      canvas.parentNode.removeChild(canvas);
    }
    if (messageEl.parentNode) {
      messageEl.parentNode.removeChild(messageEl);
    }
  }

  animationFrameId = requestAnimationFrame(animate);

  return cleanup;
}

function createCelebrationMessage(immediate: boolean): HTMLDivElement {
  const el = document.createElement('div');
  el.className = 'celebration-message';
  el.textContent = '全部完了！今日もよくがんばった🎉';

  if (immediate) {
    // reduced-motion: アニメーションなしで即時表示
    el.style.animationName = 'none';
    el.style.opacity = '0';
  }

  return el;
}
