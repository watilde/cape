export const CONFETTI_PARTICLE_COUNT_SINGLE = 40;
export const CONFETTI_PARTICLE_COUNT_ALL = 80;

export const CONFETTI_DURATION_SINGLE = 1400;
export const CONFETTI_DURATION_ALL = 2100;
export const CONFETTI_BANNER_DURATION = 2400;
export const CONFETTI_CHECK_POP_DURATION = 400;

/**
 * DA仕様: Sweet Pink 30% / Lavender Purple 25% / Mint Green 25% / Soft Peach 20%
 * 割合に応じた配列サイズで確率分布を表現する
 */
export const CONFETTI_COLORS: readonly string[] = [
  '#FF6B9D', '#FF6B9D', '#FF6B9D', // 30%
  '#D8A5E8', '#D8A5E8',             // 25% (approx)
  '#A8E6CF', '#A8E6CF',             // 25% (approx)
  '#FFDCC7',                        // 20% (approx)
] as const;

// DA仕様: vx range −80〜+80, vy range (single: −200〜−350, all: −280〜−420)
export const VX_RANGE = { min: -80, max: 80 } as const;
export const VY_RANGE_SINGLE = { min: -350, max: -200 } as const;
export const VY_RANGE_ALL = { min: -420, max: -280 } as const;

export const ROT_RANGE = { min: 0, max: 360 } as const;
export const ROT_DELTA_RANGE = { min: 200, max: 520 } as const;
export const SCALE_RANGE = { min: 0.8, max: 1.2 } as const;
export const DELAY_RANGE = { min: 0, max: 200 } as const;

// 最長アニメーション終了後にDOMを削除するためのバッファ (ms)
export const DOM_CLEANUP_BUFFER = 200;
