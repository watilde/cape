/**
 * AppHeader コンポーネント
 * DA仕様: Poppins 28px / Sweet Pink / ブランドタイトル
 */

import React from 'react';

export function AppHeader(): React.JSX.Element {
  return (
    <header className="app-header">
      <h1 className="app-header__title">StyleToDo ✨</h1>
      <p className="app-header__subtitle">今日もおしゃれにタスク管理</p>
    </header>
  );
}
