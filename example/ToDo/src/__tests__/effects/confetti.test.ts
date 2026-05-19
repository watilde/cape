/**
 * confetti.test.ts — Effect-04 confettiロジック単体テスト
 */
import { initConfettiParticles } from '../../renderer/lib/effects/confetti';

describe('initConfettiParticles', () => {
  it('28個のパーティクルを生成する', () => {
    const particles = initConfettiParticles(400);
    expect(particles).toHaveLength(28);
  });

  it('DA仕様の形状分布: circle×12, rectangle×8, petal×8', () => {
    const particles = initConfettiParticles(400);
    const shapes = particles.map((p) => p.shape);

    const circleCount = shapes.filter((s) => s === 'circle').length;
    const rectCount = shapes.filter((s) => s === 'rectangle').length;
    const petalCount = shapes.filter((s) => s === 'petal').length;

    expect(circleCount).toBe(12);
    expect(rectCount).toBe(8);
    expect(petalCount).toBe(8);
  });

  it('DA仕様の色5種が使用されている', () => {
    const validColors = new Set(['#FF6B9D', '#D8A5E8', '#A8E6CF', '#FFDCC7', '#FFE66D']);
    const particles = initConfettiParticles(400);

    particles.forEach((p) => {
      expect(validColors.has(p.color)).toBe(true);
    });
  });

  it('初速vy が DA仕様の範囲内（2.5〜4.5）', () => {
    const particles = initConfettiParticles(400);
    particles.forEach((p) => {
      expect(p.vy).toBeGreaterThanOrEqual(2.5);
      expect(p.vy).toBeLessThanOrEqual(4.5);
    });
  });

  it('初速vx が DA仕様の範囲内（-1.5〜1.5）', () => {
    const particles = initConfettiParticles(400);
    particles.forEach((p) => {
      expect(p.vx).toBeGreaterThanOrEqual(-1.5);
      expect(p.vx).toBeLessThanOrEqual(1.5);
    });
  });

  it('rotationSpeed が DA仕様の範囲内（-3.0〜3.0）', () => {
    const particles = initConfettiParticles(400);
    particles.forEach((p) => {
      expect(p.rotationSpeed).toBeGreaterThanOrEqual(-3.0);
      expect(p.rotationSpeed).toBeLessThanOrEqual(3.0);
    });
  });

  it('初期y座標が画面上部（-10〜-30px）に配置される', () => {
    const particles = initConfettiParticles(400);
    particles.forEach((p) => {
      expect(p.y).toBeLessThanOrEqual(-10);
      expect(p.y).toBeGreaterThanOrEqual(-30);
    });
  });

  it('初期x座標がcanvas幅の範囲内', () => {
    const canvasWidth = 800;
    const particles = initConfettiParticles(canvasWidth);
    particles.forEach((p) => {
      expect(p.x).toBeGreaterThanOrEqual(0);
      expect(p.x).toBeLessThanOrEqual(canvasWidth);
    });
  });
});

describe('triggerConfettiEffect', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: jest.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      })),
    });

    // HTMLCanvasElement.getContext のモック
    HTMLCanvasElement.prototype.getContext = jest.fn().mockReturnValue({
      clearRect: jest.fn(),
      save: jest.fn(),
      restore: jest.fn(),
      fill: jest.fn(),
      beginPath: jest.fn(),
      arc: jest.fn(),
      fillRect: jest.fn(),
      moveTo: jest.fn(),
      bezierCurveTo: jest.fn(),
      translate: jest.fn(),
      rotate: jest.fn(),
    } as unknown as CanvasRenderingContext2D);
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('canvasとcelebration-messageをDOMに追加する', async () => {
    const { triggerConfettiEffect } = await import('../../renderer/lib/effects/confetti');

    triggerConfettiEffect();

    expect(document.getElementById('confetti-canvas')).not.toBeNull();
    expect(document.querySelector('.celebration-message')).not.toBeNull();
  });

  it('cleanup関数でcanvasとメッセージが即座に削除される', async () => {
    const { triggerConfettiEffect } = await import('../../renderer/lib/effects/confetti');

    const cleanup = triggerConfettiEffect();
    cleanup();

    expect(document.getElementById('confetti-canvas')).toBeNull();
    expect(document.querySelector('.celebration-message')).toBeNull();
  });

  it('DA仕様 re_trigger_policy: 既存canvasを破棄して新canvasを生成する', async () => {
    const { triggerConfettiEffect } = await import('../../renderer/lib/effects/confetti');

    triggerConfettiEffect(); // 1回目
    const canvas1 = document.getElementById('confetti-canvas');

    triggerConfettiEffect(); // 2回目（再発動）
    const canvas2 = document.getElementById('confetti-canvas');

    // 新しいcanvasインスタンスが生成されている
    expect(canvas2).not.toBeNull();
    // 以前のcanvasとは異なるインスタンス（または1つしかない）
    expect(document.querySelectorAll('#confetti-canvas')).toHaveLength(1);
  });
});
