import { ParticlePool } from '../../lib/confetti/ParticlePool';

describe('ParticlePool', () => {
  beforeEach(() => {
    // インスタンスリセット
    (
      ParticlePool as unknown as { instance: ParticlePool | null }
    ).instance = null;
  });

  it('シングルトンインスタンスを返す', () => {
    const pool1 = ParticlePool.getInstance();
    const pool2 = ParticlePool.getInstance();
    expect(pool1).toBe(pool2);
  });

  it('acquireでspan要素を返す', () => {
    const pool = ParticlePool.getInstance();
    const el = pool.acquire('rect');
    expect(el).toBeInstanceOf(HTMLSpanElement);
    expect(el.className).toContain('confetti-particle--rect');
  });

  it('acquireでcircle形状のspan要素を返す', () => {
    const pool = ParticlePool.getInstance();
    const el = pool.acquire('circle');
    expect(el.className).toContain('confetti-particle--circle');
  });

  it('releaseしたあとreacquireすると同じ要素を再利用する', () => {
    const pool = ParticlePool.getInstance();
    const el1 = pool.acquire('rect');
    pool.release(el1);
    const el2 = pool.acquire('rect');
    // プール内で再利用される
    expect(el2).toBe(el1);
  });

  it('releaseAllで全要素が再利用可能になる', () => {
    const pool = ParticlePool.getInstance(5);
    const elements = [
      pool.acquire('rect'),
      pool.acquire('circle'),
      pool.acquire('rect'),
    ];

    pool.releaseAll();

    // 解放後に再取得できる
    const reacquired = pool.acquire('circle');
    expect(elements).toContain(reacquired);
  });

  it('maxSizeを超える場合も新規要素を返す（プール上限超過保護）', () => {
    const pool = ParticlePool.getInstance(2);
    const el1 = pool.acquire('rect'); // pool: [el1]
    const el2 = pool.acquire('rect'); // pool: [el1, el2]
    const el3 = pool.acquire('rect'); // 上限超過: 新規作成、プールには追加しない

    expect(el3).toBeInstanceOf(HTMLSpanElement);
    expect(el3).not.toBe(el1);
    expect(el3).not.toBe(el2);
  });
});
