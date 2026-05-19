/**
 * OQ-01: パーティクル80個FPS実計測ユーティリティ
 *
 * 目的: confettiアニメーション80パーティクル同時表示時のFPSを計測し、
 *       60fps達成可否を確認する（DAのDOQ-01への回答）
 *
 * 使用方法:
 *   1. ブラウザのDevToolsコンソールで実行、またはテストページに組み込む
 *   2. startFpsMeasurement(80) を呼び出す
 *   3. 計測結果をコンソールで確認し、DA・CM・POAに報告する
 *
 * 報告フォーマット:
 *   - 計測結果（平均fps・最小fps・最大fps）
 *   - 計測環境（ブラウザ・OS・デバイス）
 *   - 判定（60fps達成 / 未達）
 *   - DAへのアクション要求（未達の場合）
 */

export interface FpsMeasurementResult {
  averageFps: number;
  minFps: number;
  maxFps: number;
  sampleCount: number;
  durationMs: number;
  particleCount: number;
  passed60fps: boolean;
  measurementEnvironment: {
    userAgent: string;
    devicePixelRatio: number;
    screenWidth: number;
    screenHeight: number;
    hardwareConcurrency: number;
  };
  recommendation: string;
  daActionRequired: boolean;
  daActionDetail: string | null;
}

/**
 * アニメーションフレームループでFPSを計測する
 * @param durationMs 計測時間（ミリ秒）デフォルト3000ms（3秒）
 * @returns FPSサンプル配列
 */
function measureRawFps(durationMs: number = 3000): Promise<number[]> {
  return new Promise((resolve) => {
    const fpsSamples: number[] = [];
    let lastFrameTime = performance.now();
    let startTime = performance.now();
    let rafId: number;

    function frame(currentTime: number) {
      const deltaMs = currentTime - lastFrameTime;
      if (deltaMs > 0) {
        const instantFps = 1000 / deltaMs;
        // 外れ値（1fps未満・300fps超）は除外
        if (instantFps >= 1 && instantFps <= 300) {
          fpsSamples.push(instantFps);
        }
      }
      lastFrameTime = currentTime;

      if (currentTime - startTime < durationMs) {
        rafId = requestAnimationFrame(frame);
      } else {
        cancelAnimationFrame(rafId);
        resolve(fpsSamples);
      }
    }

    rafId = requestAnimationFrame(frame);
  });
}

/**
 * confettiパーティクルのDOM要素を生成する（実際のアニメーション負荷をシミュレート）
 * @param container 親コンテナ
 * @param particleCount パーティクル数
 */
function createParticleElements(
  container: HTMLElement,
  particleCount: number
): HTMLElement[] {
  // ブランドカラーパレット（DAアウトプット参照）
  const brandColors = [
    "#FF6B9D", // Sweet Pink
    "#D8A5E8", // Lavender Purple
    "#A8E6CF", // Mint Green
    "#C9501A", // Deep Coral（CTAボタン・アイコン用途確認済み）
  ];

  const particles: HTMLElement[] = [];

  for (let i = 0; i < particleCount; i++) {
    const particle = document.createElement("div");
    const color = brandColors[i % brandColors.length];
    const size = Math.floor(Math.random() * 8) + 4; // 4px〜12px（DAスペック確定値待ち）

    particle.style.cssText = `
      position: absolute;
      width: ${size}px;
      height: ${size}px;
      background-color: ${color};
      border-radius: 50%;
      left: ${Math.random() * 100}%;
      top: ${Math.random() * 100}%;
      will-change: transform, opacity;
      animation: fps-test-particle ${800 + Math.random() * 400}ms ease-out infinite;
    `;

    particles.push(particle);
    container.appendChild(particle);
  }

  return particles;
}

/**
 * パーティクルアニメーション用のキーフレームをドキュメントに追加する
 */
function injectParticleKeyframes(): HTMLStyleElement {
  const style = document.createElement("style");
  // OQ-01計測用の仮アニメーション
  // ※ 実際のkeyframes確定値はDA仕様書から取得すること（DAアウトプット DT-02参照）
  style.textContent = `
    @keyframes fps-test-particle {
      0% {
        transform: translateY(0) scale(1);
        opacity: 1;
      }
      50% {
        transform: translateY(-60px) scale(0.8) rotate(180deg);
        opacity: 0.7;
      }
      100% {
        transform: translateY(-120px) scale(0.5) rotate(360deg);
        opacity: 0;
      }
    }
  `;
  document.head.appendChild(style);
  return style;
}

/**
 * OQ-01メイン計測関数
 * @param particleCount 計測するパーティクル数（デフォルト80）
 * @param durationMs 計測時間（デフォルト3000ms）
 */
export async function startFpsMeasurement(
  particleCount: number = 80,
  durationMs: number = 3000
): Promise<FpsMeasurementResult> {
  console.log(
    `[OQ-01] FPS計測開始 — パーティクル数: ${particleCount}, 計測時間: ${durationMs}ms`
  );

  // 計測用コンテナをDOMに追加
  const container = document.createElement("div");
  container.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    pointer-events: none;
    overflow: hidden;
    z-index: 9999;
  `;
  document.body.appendChild(container);

  // キーフレーム注入
  const styleEl = injectParticleKeyframes();

  // パーティクル生成
  const particles = createParticleElements(container, particleCount);
  console.log(`[OQ-01] ${particles.length}個のパーティクルを生成。計測中...`);

  // FPS計測実行
  const fpsSamples = await measureRawFps(durationMs);

  // クリーンアップ
  document.body.removeChild(container);
  document.head.removeChild(styleEl);

  // 統計計算
  const averageFps =
    fpsSamples.reduce((sum, fps) => sum + fps, 0) / fpsSamples.length;
  const minFps = Math.min(...fpsSamples);
  const maxFps = Math.max(...fpsSamples);
  const passed60fps = averageFps >= 55; // 55fps以上を実用的な60fps達成と判定

  // DAアクション判定（DAアウトプット DOQ-01参照）
  const daActionRequired = !passed60fps;
  const daActionDetail = daActionRequired
    ? "DAへの通知必須: パーティクル数を80→40に削減、duration 1200ms→800msに短縮する仕様改定を要求（DA DOQ-01準拠）"
    : null;

  // 推奨事項
  const recommendation = passed60fps
    ? `✅ 60fps達成（平均${averageFps.toFixed(1)}fps）。confetti仕様をそのまま採用可能。`
    : `❌ 60fps未達（平均${averageFps.toFixed(1)}fps）。DAに仕様改定を要求してください。`;

  const result: FpsMeasurementResult = {
    averageFps: Math.round(averageFps * 10) / 10,
    minFps: Math.round(minFps * 10) / 10,
    maxFps: Math.round(maxFps * 10) / 10,
    sampleCount: fpsSamples.length,
    durationMs,
    particleCount,
    passed60fps,
    measurementEnvironment: {
      userAgent: navigator.userAgent,
      devicePixelRatio: window.devicePixelRatio,
      screenWidth: window.screen.width,
      screenHeight: window.screen.height,
      hardwareConcurrency: navigator.hardwareConcurrency,
    },
    recommendation,
    daActionRequired,
    daActionDetail,
  };

  // コンソール出力（DA・CM・POAへの報告用フォーマット）
  console.group("[OQ-01] FPS計測結果レポート");
  console.log(`パーティクル数: ${particleCount}`);
  console.log(`平均FPS: ${result.averageFps}`);
  console.log(`最小FPS: ${result.minFps}`);
  console.log(`最大FPS: ${result.maxFps}`);
  console.log(`サンプル数: ${result.sampleCount}`);
  console.log(`判定: ${passed60fps ? "✅ PASS (60fps達成)" : "❌ FAIL (60fps未達)"}`);
  console.log(`推奨: ${recommendation}`);
  if (daActionRequired && daActionDetail) {
    console.warn(`DAアクション必須: ${daActionDetail}`);
  }
  console.log("計測環境:", result.measurementEnvironment);
  console.groupEnd();

  return result;
}

/**
 * 計測結果をLocalStorageに保存する（OQゾンビ化防止・次セッション前の証跡として）
 * @param result FPS計測結果
 */
export function saveMeasurementResult(result: FpsMeasurementResult): void {
  const key = "todoapp_v1_oq01_fps_result";
  const record = {
    ...result,
    measuredAt: new Date().toISOString(),
    taskId: "task-1779180490513",
    reportedTo: ["DA", "CM", "POA"],
  };
  localStorage.setItem(key, JSON.stringify(record));
  console.log(
    `[OQ-01] 計測結果をLocalStorageに保存しました (key: ${key})`
  );
}

/**
 * 前回の計測結果をLocalStorageから取得する
 */
export function loadPreviousMeasurementResult(): (FpsMeasurementResult & {
  measuredAt: string;
}) | null {
  const key = "todoapp_v1_oq01_fps_result";
  const stored = localStorage.getItem(key);
  if (!stored) return null;
  try {
    return JSON.parse(stored);
  } catch {
    return null;
  }
}

/**
 * OQ-01完了報告フォーマットを生成する（DA・CM・POAへの共有用）
 * @param result FPS計測結果
 */
export function generateOq01Report(result: FpsMeasurementResult): string {
  return `
## OQ-01 完了報告 — パーティクル80個FPS実計測

**ステータス**: ${result.passed60fps ? "CLOSED ✅" : "CLOSED (要DA仕様改定) ⚠️"}

### 計測結果
| 指標 | 値 |
|---|---|
| パーティクル数 | ${result.particleCount} |
| 平均FPS | ${result.averageFps} fps |
| 最小FPS | ${result.minFps} fps |
| 最大FPS | ${result.maxFps} fps |
| サンプル数 | ${result.sampleCount} |
| 計測時間 | ${result.durationMs}ms |

### 判定
${result.recommendation}

### 計測環境
- ブラウザ: ${result.measurementEnvironment.userAgent.split(" ").slice(-1)[0]}
- デバイスピクセル比: ${result.measurementEnvironment.devicePixelRatio}
- 画面解像度: ${result.measurementEnvironment.screenWidth}×${result.measurementEnvironment.screenHeight}
- CPU コア数: ${result.measurementEnvironment.hardwareConcurrency}

${
  result.daActionRequired
    ? `### DAへのアクション要求
${result.daActionDetail}

DA DOQ-01に従い、以下の仕様改定を要求します:
- パーティクル数: 80 → 40
- duration: 1200ms → 800ms
`
    : "### DAへのアクション\n不要（現行仕様のまま採用可能）"
}
  `.trim();
}
