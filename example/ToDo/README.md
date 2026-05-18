# StyleToDo 🌸

美しさを最優先にしたタスク管理アプリ。

---

## 技術スタック

| 区分 | 技術 |
|------|------|
| フレームワーク | React 18 + TypeScript 5 (strict) |
| ビルドツール | Vite 5 |
| スタイル | CSS Modules + CSS Custom Properties |
| 永続化 | LocalStorage (StorageAdapter) |
| テスト | Vitest + @testing-library/react |

> **Electron対応について (DevA申告 — task-1779078001280)**
> v1.0.0はWebブラウザターゲットのみ。Electronはv1.5以降で対応予定。
> StorageAdapterは `IStorage` インターフェース経由でのみ参照されており、
> 移行時は `electron-store` をラップした実装に差し替えるだけで済む設計になっています。

---

## セットアップ手順

```bash
# 1. 依存関係のインストール
npm install

# 2. 開発サーバーの起動 (US-ENV-001 AC: dev server起動確認)
npm run dev
# → http://localhost:5173 が自動で開きます

# 3. TypeScriptコンパイル確認 (US-ENV-001 AC: TSエラーゼロ確認)
npm run typecheck

# 4. プロダクションビルド
npm run build

# 5. テスト実行 (90%+ カバレッジ)
npm test

# 6. テストカバレッジレポート
npm run test:coverage
```

---

## US-ENV-001 動作確認手順

1. `npm run dev` を実行してブラウザを開く
2. 「テストタスクを入力してください」にテキストを入力
3. 「LocalStorageに保存」ボタンをクリック
4. 「✓ 保存完了」バッジが表示されること
5. 「LocalStorageから読み出した値」セクションにタスクが表示されること
6. ブラウザの DevTools → Application → LocalStorage → `todoapp_v1_todos` で保存データを確認できること

---

## プロジェクト構成

```
src/
├── types/
│   └── todo.ts                    # 型定義・ストレージキー定数
├── lib/
│   ├── storage/
│   │   └── StorageAdapter.ts      # LocalStorage抽象化 (IStorage interface)
│   └── todo/
│       └── TodoCore.ts            # ドメインロジック (純粋関数)
├── styles/
│   └── tokens.css                 # DAデザイントークン (CSS Custom Properties)
├── components/
│   └── VerificationScaffold/      # US-ENV-001確認用スタブ (次フェーズで置き換え)
│       ├── VerificationScaffold.tsx
│       └── VerificationScaffold.module.css
├── __tests__/
│   ├── setup.ts                   # Vitestグローバルセットアップ
│   ├── StorageAdapter.test.ts     # StorageAdapter単体テスト
│   └── TodoCore.test.ts           # TodoCore単体テスト
└── main.tsx                       # エントリポイント
```

---

## 次フェーズ (UIフェーズ) のDoR

DAが定義したDoRチェックリスト (DA output, task-1779078001280):

- [ ] 本READMEのElectron対応申告をPOA/CMが確認済み
- [ ] US-ENV-001のAC全件がDevA確認済み ← 本セッション完了で満たされる
- [ ] 技術スタック確定済み (React + TypeScript + Vite ← 本セッションで確定)
- [ ] ターゲットプラットフォーム確定 (ブラウザのみ ← DevA申告済み)
- [ ] POAから次フェーズのユーザーストーリー提供済み (confidence ≥ 4)
