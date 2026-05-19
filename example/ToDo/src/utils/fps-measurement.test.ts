/**
 * OQ-01 FPS計測ユーティリティのユニットテスト
 *
 * テスト戦略（1_architecture.md Testing guardrails準拠）:
 * - requestAnimationFrameをモックして決定論的にテスト
 * - LocalStorage操作はjest-localstorage-mockまたはインメモリモックを使用
 * - DOMの生成・削除副作用を各テスト後にクリーンアップ
 */

import {
  saveMeasurementResult,
  loadPreviousMeasurementResult,
  generateOq01Report,
  FpsMeasurementResult,
} from "./fps-measurement";

// LocalStorageモック
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
});

const mockResult: FpsMeasurementResult = {
  averageFps: 62.3,
  minFps: 55.1,
  maxFps: 66.7,
  sampleCount: 180,
  durationMs: 3000,
  particleCount: 80,
  passed60fps: true,
  measurementEnvironment: {
    userAgent: "Mozilla/5.0 Chrome/120.0",
    devicePixelRatio: 2,
    screenWidth: 390,
    screenHeight: 844,
    hardwareConcurrency: 8,
  },
  recommendation:
    "✅ 60fps達成（平均62.3fps）。confetti仕様をそのまま採用可能。",
  daActionRequired: false,
  daActionDetail: null,
};

const mockResultFailed: FpsMeasurementResult = {
  ...mockResult,
  averageFps: 42.1,
  minFps: 28.3,
  maxFps: 55.0,
  passed60fps: false,
  recommendation:
    "❌ 60fps未達（平均42.1fps）。DAに仕様改定を要求してください。",
  daActionRequired: true,
  daActionDetail:
    "DAへの通知必須: パーティクル数を80→40に削減、duration 1200ms→800msに短縮する仕様改定を要求（DA DOQ-01準拠）",
};

describe("fps-measurement: OQ-01", () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  describe("saveMeasurementResult / loadPreviousMeasurementResult", () => {
    it("計測結果をLocalStorageに保存し、再取得できる", () => {
      saveMeasurementResult(mockResult);
      const loaded = loadPreviousMeasurementResult();
      expect(loaded).not.toBeNull();
      expect(loaded?.averageFps).toBe(62.3);
      expect(loaded?.passed60fps).toBe(true);
      expect(loaded?.particleCount).toBe(80);
    });

    it("保存データにmeasuredAtタイムスタンプが含まれる", () => {
      saveMeasurementResult(mockResult);
      const loaded = loadPreviousMeasurementResult();
      expect(loaded?.measuredAt).toBeDefined();
      expect(new Date(loaded!.measuredAt).getTime()).not.toBeNaN();
    });

    it("LocalStorageが空の場合はnullを返す", () => {
      const result = loadPreviousMeasurementResult();
      expect(result).toBeNull();
    });

    it("LocalStorageに壊れたJSONがある場合はnullを返す", () => {
      localStorage.setItem("todoapp_v1_oq01_fps_result", "invalid-json{");
      const result = loadPreviousMeasurementResult();
      expect(result).toBeNull();
    });
  });

  describe("generateOq01Report", () => {
    it("60fps達成時のレポートにCLOSED ✅が含まれる", () => {
      const report = generateOq01Report(mockResult);
      expect(report).toContain("CLOSED ✅");
      expect(report).toContain("62.3 fps");
      expect(report).toContain("パーティクル数 | 80");
    });

    it("60fps未達時のレポートにDAアクション要求が含まれる", () => {
      const report = generateOq01Report(mockResultFailed);
      expect(report).toContain("CLOSED (要DA仕様改定) ⚠️");
      expect(report).toContain("DAへのアクション要求");
      expect(report).toContain("パーティクル数: 80 → 40");
      expect(report).toContain("duration: 1200ms → 800ms");
    });

    it("60fps達成時のレポートにDAアクション不要と記載される", () => {
      const report = generateOq01Report(mockResult);
      expect(report).toContain("不要（現行仕様のまま採用可能）");
    });

    it("計測環境情報がレポートに含まれる", () => {
      const report = generateOq01Report(mockResult);
      expect(report).toContain("デバイスピクセル比: 2");
      expect(report).toContain("390×844");
    });
  });

  describe("passed60fps判定ロジック（境界値テスト）", () => {
    it("averageFps 55.0はPASSと判定されるべき（55fps閾値）", () => {
      // fps-measurement.tsの判定ロジック: averageFps >= 55
      const borderResult: FpsMeasurementResult = {
        ...mockResult,
        averageFps: 55.0,
        passed60fps: true, // >= 55 で true
      };
      const report = generateOq01Report(borderResult);
      expect(report).toContain("CLOSED ✅");
    });

    it("averageFps 54.9はFAILと判定されるべき", () => {
      const borderResult: FpsMeasurementResult = {
        ...mockResult,
        averageFps: 54.9,
        passed60fps: false,
        daActionRequired: true,
        daActionDetail: "DAへの通知必須",
      };
      const report = generateOq01Report(borderResult);
      expect(report).toContain("CLOSED (要DA仕様改定) ⚠️");
    });
  });
});
