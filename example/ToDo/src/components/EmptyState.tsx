/**
 * EmptyState コンポーネント
 * AC-004-2対応: 初回訪問・LocalStorageクリア後のゼロ状態
 * DA仕様: 絵文字イラスト＋Quicksand＋gentle floatアニメーション
 */

import React from 'react';

export function EmptyState(): React.JSX.Element {
  return (
    <div className="empty-state" aria-label="タスクがありません">
      <div className="empty-state__illustration" aria-hidden="true">
        ✨📝✨
      </div>
      <h2 className="empty-state__headline">今日はまだタスクがありません</h2>
      <p className="empty-state__body">
        新しいタスクを追加して、今日を特別にしましょう！
      </p>
    </div>
  );
}
