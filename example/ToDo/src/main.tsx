/**
 * エントリポイント
 * Webアプリとして完結——Electronブリッジ等の依存なし
 */

import React from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import './index.css';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('#root 要素が見つかりません。index.htmlを確認してください。');
}

createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
