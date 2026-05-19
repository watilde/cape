import type { ParticleShape } from './types';

interface PooledParticle {
  element: HTMLSpanElement;
  inUse: boolean;
}

/**
 * Object Pool パターンによるパーティクル要素管理
 * DA仕様: DOM再利用でメモリリークとGC負荷を抑制
 * 最大80個（全完了時）のspan要素をプール管理する
 */
export class ParticlePool {
  private static instance: ParticlePool | null = null;
  private pool: PooledParticle[] = [];
  private readonly maxSize: number;

  private constructor(maxSize: number) {
    this.maxSize = maxSize;
  }

  static getInstance(maxSize = 80): ParticlePool {
    if (!ParticlePool.instance) {
      ParticlePool.instance = new ParticlePool(maxSize);
    }
    return ParticlePool.instance;
  }

  acquire(shape: ParticleShape): HTMLSpanElement {
    // プールから未使用の要素を探す
    const available = this.pool.find((p) => !p.inUse);
    if (available) {
      available.inUse = true;
      available.element.className = `confetti-particle confetti-particle--${shape}`;
      available.element.removeAttribute('style');
      return available.element;
    }

    // プールに空きがない場合は新規作成（上限超過時も動作を保証）
    const el = document.createElement('span');
    el.className = `confetti-particle confetti-particle--${shape}`;

    if (this.pool.length < this.maxSize) {
      this.pool.push({ element: el, inUse: true });
    }

    return el;
  }

  release(element: HTMLSpanElement): void {
    const pooled = this.pool.find((p) => p.element === element);
    if (pooled) {
      pooled.inUse = false;
    }
  }

  releaseAll(): void {
    this.pool.forEach((p) => {
      p.inUse = false;
    });
  }
}
