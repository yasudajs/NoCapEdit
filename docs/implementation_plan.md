# 設定画面実装計画

## 目的
タブバーにあるフォント設定のドロップダウンリストとテーマ切替ボタン（ライト/ダーク）を **設定画面（モーダル）** に統合し、現在のテーマ切替ボタンの位置に **歯車アイコン** を配置してクリックで設定画面を開く。

## バージョン
- **0.1.12**（確定）

## 合意内容
- 設定画面は **モーダル** とし、フルページではなくオーバーレイで表示する。
- 歯車アイコンはタブバー右端（`+` ボタンの左）に配置し、クリックでモーダルを表示する。
- 設定画面レイアウトは **シングルカラム**、フォント設定・テーマ切替を縦に並べる。
- 既存の `settingsDialog`（初回設定ダイアログ）にフォント・テーマ設定項目を追加する形で実装する。
- アイコンは絵文字ではなくフラットデザインの **SVG アイコン** を使用する。

## 実装項目

---

### フロントエンド

#### Modify: `src/dist/index.html`
- タブバーから `fontFamilySelect`（フォントセレクト）と `themeToggleBtn`（テーマトグル）を削除。
- タブバー右端に歯車 SVG アイコンボタン（`id="settingsBtn"`）を追加。
- `settingsDialog` にフォントファミリーセレクト（`id="fontFamilySelectModal"`）とテーマ切替ボタン（`id="themeToggleModal"`）を追加。
- `settingsDialog` と `errorDialog` で ID が重複していた要素（`errorMessage`、`retryBtn`、`saveAsBtn`、`cancelExitBtn`）を分離し、`settingsDialog` から除去。

#### Modify: `src/dist/main.js`
- `elements` キャッシュから `themeToggleBtn`・`fontFamilySelect`（HTML上に存在しない）を削除。
- `applyThemeUI()` を `themeToggleBtn`（null）参照から `themeToggleModal` 参照に修正。
- `onFontFamilyChange()` をイベントソースから値を取得する形に修正（`fontFamilySelect` が削除されたため）。
- `loadSystemFonts()` を `fontFamilySelect` → `fontFamilySelectModal` 対象に修正。
- `setupUIEventListeners()` から `themeToggleBtn`・`fontFamilySelect` のリスナー登録を除去。
- 初期化時の `fontFamilySelect` 参照を `fontFamilySelectModal` に変更。

#### Modify: `src/dist/style.css`
- `.settings-btn` スタイルを追加（フラットデザイン、`add-tab-btn` と統一した角丸ボーダースタイル）。
- `.settings-btn .settings-icon` で SVG サイズを指定。
- `.dialog-box .theme-toggle-btn` で設定モーダル内のテーマボタンの幅崩れを修正（`width: auto`、左揃え、余白調整）。

---

### バックエンド・設定管理

#### Modify: `Cargo.toml`
- `version = "0.1.12"` に更新。

#### Modify: `docs/mvp-spec.md`
- 改訂履歴に新エントリを追加。
```
| 0.1.12 | 2026-07-08 | yasudajs | 設定画面をモーダル化し、歯車アイコンで表示。フォント・テーマ設定を統合。
```

---

## 残課題

| # | 内容 | 状態 |
|---|------|------|
| 1 | 設定モーダル内のテーマ切替ボタン（`themeToggleModal`）の表示崩れを修正 | ✅ 完了 |
| 2 | 設定画面を閉じると新規タブが増える不具合を修正（`saveSettings` の `createNewTab()` をタブ未存在時のみ呼ぶよう変更） | ✅ 完了 |

---

## 検証手順

### 手動確認
- アプリ起動後、タブバー右端に歯車 SVG アイコンが表示されること。
- 初期化エラーが発生せず、ファイルが正常に開けること。
- 歯車アイコンクリックで設定モーダルが開くこと。
- フォント設定・テーマ切替が設定モーダルから操作できること。
- 設定モーダルを開いて OK を押しても、既存のタブが増えないこと（初回起動時のみ新規タブが作成されること）。
- バージョン表示が `NoCapEdit [ Ver 0.1.12 ]` であること。
