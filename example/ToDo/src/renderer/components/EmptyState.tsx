import React from 'react';

export const EmptyState: React.FC = () => {
  return (
    <div className="empty-state" role="status" aria-live="polite">
      <span className="empty-state__icon" aria-hidden="true">
        ✨
      </span>
      <p className="empty-state__message">タスクがないよ！新しいことを始めよう✨</p>
      <p className="empty-state__sub">上の入力欄からタスクを追加してね</p>
    </div>
  );
};
