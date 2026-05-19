import { fireCheckPop, fireConfetti } from '../../lib/confetti/confettiEngine';
import { ParticlePool } from '../../lib/confetti/ParticlePool';
import {
  CONFETTI_PARTICLE_COUNT_ALL,
  CONFETTI_PARTICLE_COUNT_SINGLE,
} from '../../lib/confetti/constants';

// ---------------------------------------------------------------------------
// モックセットアップ
// ---------------------------------------------------------------------------

// matchMedia モック（prefers-reduced-motion: no-preference をデフォルトとする）
const mockMatchMedia = (prefersReduced: boolean): void => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation((query: string) => ({
      matches:
        query === '(prefers-reduced-motion: reduce)' ? prefersReduced : false,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  });
};

// getBoundingClientRect モック
const mockBoundingClientRect = (x = 100, y = 200): void => {
  Element.prototype.getBoundingClientRect = jest.fn().mockReturnValue({
    left: x - 12,
    top: y - 12,
    width: 24,
    height: 24,
    right: x + 12,
    bottom: y + 12,
    toJSON: jest.fn(),
  });
};

// ---------------------------------------------------------------------------
// テストスイート
// ---------------------------------------------------------------------------

describe('confettiEngine', () => {
  let epicenterEl: HTMLButtonElement;

  beforeEach(() => {
    // DOM クリーンアップ
    document.body.innerHTML = '';

    // ParticlePool をリセット（プライベートアクセスのため型アサーション）
    (
      ParticlePool as unknown as { instance: ParticlePool | null }
    ).instance = null;

    // タイマーモック
    jest.useFakeTimers();

    mockMatchMedia(false); // デフォルト: reduced-motion OFF
    mockBoundingClientRect(100, 200);

    epicenterEl = document.createElement('button');
    document.body.appendChild(epicenterEl);
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  // -------------------------------------------------------------------------
  // AC-03: prefers-reduced-motion
  // -------------------------------------------------------------------------
  describe('prefers-reduced-motion: reduce が有効な場合', () => {
    beforeEach(() => {
      mockMatchMedia(true);
    });

    it('fireConfetti: DOMへのパーティクル挿入をスキップする（single）', () => {
      fireConfetti({ epicenterElement: epicenterEl, mode: 'single' });
      expect(document.body.querySelectorAll('.confetti-overlay')).toHaveLength(
        0,
      );
    });

    it('fireConfetti: DOMへのパーティクル挿入をスキップする（all）', () => {
      fireConfetti({ epicenterElement: epicenterEl, mode: 'all' });
      expect(document.body.querySelectorAll('.confetti-overlay')).toHaveLength(
        0,
      );
      expect(document.body.querySelectorAll('.all-done-banner')).toHaveLength(
        0,
      );
    });

    it('fireCheckPop: チェックボックスへのクラス付与をスキップする', () => {
      fireCheckPop(epicenterEl);
      expect(epicenterEl.classList.contains('check-pop')).toBe(false);
    });
  });

  // -------------------------------------------------------------------------
  // AC-01: 単一タスク完了エフェクト
  // -------------------------------------------------------------------------
  describe('単一タスク完了（mode: single）', () => {
    it(`パーティクルを ${CONFETTI_PARTICLE_COUNT_SINGLE} 個生成してbody直下のoverlayに挿入する`, () => {
      fireConfetti({ epicenterElement: epicenterEl, mode: 'single' });

      const overlay = document.body.querySelector('.confetti-overlay');
      expect(overlay).not.toBeNull();
      expect(overlay?.parentElement).toBe(document.body);
      expect(overlay?.querySelectorAll('.confetti-particle')).toHaveLength(
        CONFETTI_PARTICLE_COUNT_SINGLE,
      );
    });

    it('ConfettiOverlayにpointer-events: noneが設定されている', () => {
      fireConfetti({ epicenterElement: epicenterEl, mode: 'single' });

      const overlay = document.body.querySelector<HTMLDivElement>(
        '.confetti-overlay',
      );
      expect(overlay?.style.pointerEvents).toBe('none');
    });

    it('AllDoneBannerは表示されない', () => {
      fireConfetti({ epicenterElement: epicenterEl, mode: 'single' });
      expect(document.body.querySelectorAll('.all-done-banner')).toHaveLength(
        0,
      );
    });

    it('アニメーション終了後にDOMからオーバーレイが削除される', () => {
      fireConfetti({ epicenterElement: epicenterEl, mode: 'single' });

      // cleanup timer: CONFETTI_DURATION_SINGLE(1400) + DELAY_RANGE.max(200) + BUFFER(200) = 1800ms
      jest.advanceTimersByTime(1800);

      expect(document.body.querySelectorAll('.confetti-overlay')).toHaveLength(
        0,
      );
    });
  });

  // -------------------------------------------------------------------------
  // AC-02: 全タスク完了特別演出
  // -------------------------------------------------------------------------
  describe('全タスク完了（mode: all）', () => {
    it(`パーティクルを ${CONFETTI_PARTICLE_COUNT_ALL} 個生成する`, () => {
      fireConfetti({ epicenterElement: epicenterEl, mode: 'all' });

      const overlay = document.body.querySelector('.confetti-overlay');
      expect(overlay?.querySelectorAll('.confetti-particle')).toHaveLength(
        CONFETTI_PARTICLE_COUNT_ALL,
      );
    });

    it('AllDoneBannerがbody直下に表示される', () => {
      fireConfetti({ epicenterElement: epicenterEl, mode: 'all' });

      const banner = document.body.querySelector('.all-done-banner');
      expect(banner).not.toBeNull();
      expect(banner?.parentElement).toBe(document.body);
      expect(banner?.textContent).toContain('🎉 全部完了！最高だよ！');
    });

    it('AllDoneBannerのz-indexが10000である', () => {
      fireConfetti({ epicenterElement: epicenterEl, mode: 'all' });

      const banner = document.body.querySelector<HTMLDivElement>(
        '.all-done-banner',
      );
      expect(banner?.style.zIndex).toBe('10000');
    });

    it('アニメーション終了後にDOMからオーバーレイとバナーが削除される', () => {
      fireConfetti({ epicenterElement: epicenterEl, mode: 'all' });

      // cleanup timer: CONFETTI_DURATION_ALL(2100) + DELAY_RANGE.max(200) + BUFFER(200) = 2500ms
      jest.advanceTimersByTime(2500);

      expect(document.body.querySelectorAll('.confetti-overlay')).toHaveLength(
        0,
      );
      expect(document.body.querySelectorAll('.all-done-banner')).toHaveLength(
        0,
      );
    });
  });

  // -------------------------------------------------------------------------
  // AC-04: 既存アニメーションとの共存
  // -------------------------------------------------------------------------
  describe('check-pop アニメーション', () => {
    it('check-pop クラスが付与される', () => {
      fireCheckPop(epicenterEl);
      expect(epicenterEl.classList.contains('check-pop')).toBe(true);
    });

    it('animationend イベント後にcheck-popクラスが除去される', () => {
      fireCheckPop(epicenterEl);
      const event = new Event('animationend');
      epicenterEl.dispatchEvent(event);
      expect(epicenterEl.classList.contains('check-pop')).toBe(false);
    });

    it('フォールバックタイマーでcheck-popクラスが除去される', () => {
      fireCheckPop(epicenterEl);
      // 400ms + 100ms buffer
      jest.advanceTimersByTime(500);
      expect(epicenterEl.classList.contains('check-pop')).toBe(false);
    });
  });

  // -------------------------------------------------------------------------
  // パーティクル形状・スタイル検証
  // -------------------------------------------------------------------------
  describe('パーティクル形状の生成比率', () => {
    it('rectとcircleのパーティクルが混在している（40個中）', () => {
      fireConfetti({ epicenterElement: epicenterEl, mode: 'single' });

      const rects = document.body.querySelectorAll(
        '.confetti-particle--rect',
      ).length;
      const circles = document.body.querySelectorAll(
        '.confetti-particle--circle',
      ).length;

      // 確率的テスト: 40個で完全に片方だけになることはほぼない
      expect(rects + circles).toBe(CONFETTI_PARTICLE_COUNT_SINGLE);
      expect(rects).toBeGreaterThan(0);
      expect(circles).toBeGreaterThan(0);
    });
  });

  // -------------------------------------------------------------------------
  // DA仕様: confetti-flyとconfetti-fly-grandの同時発火禁止
  // -------------------------------------------------------------------------
  describe('アニメーションクラスの排他制御', () => {
    it('mode: single のパーティクルはconfetti-flyアニメーションを使用する', () => {
      fireConfetti({ epicenterElement: epicenterEl, mode: 'single' });

      const particles =
        document.body.querySelectorAll<HTMLSpanElement>('.confetti-particle');
      particles.forEach((p) => {
        expect(p.style.animation).toContain('confetti-fly ');
        expect(p.style.animation).not.toContain('confetti-fly-grand');
      });
    });

    it('mode: all のパーティクルはconfetti-fly-grandアニメーションを使用する', () => {
      fireConfetti({ epicenterElement: epicenterEl, mode: 'all' });

      const particles =
        document.body.querySelectorAll<HTMLSpanElement>('.confetti-particle');
      particles.forEach((p) => {
        expect(p.style.animation).toContain('confetti-fly-grand');
        expect(p.style.animation).not.toMatch(/confetti-fly [^-]/);
      });
    });
  });
});
