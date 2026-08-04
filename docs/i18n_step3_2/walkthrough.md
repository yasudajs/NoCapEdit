# i18n リファクタリング Step 3.2 ウォークスルー

## 概要
`docs/wip/i18n_refactor/master_plan.md` の Phase 3 / Step 3.2 に基づき、`src/dist/index.html` 内に直接記述されている設定モーダルの枠組みテキストやボタンのツールチップ（title属性）などの日本語文字列を抽出し、多言語化対応を行いました。

## 実施内容

### 1. `i18n.js` へのキーと関数の追加
`DICT.ja` 内に新たに `ui` セクションを追加し、設定ダイアログのラベルやツールチップ用の多数のキーを定義しました。
また、HTML内の `data-i18n` 属性を一括で翻訳適用するためのヘルパー関数 `window.applyI18nToDOM()` を追加しました。

### 2. `index.html` への属性追加
HTML内の日本語テキストが記載されているタグ（`label`, `option`, `button`, `h2`, `span` 等）に `data-i18n="キー名"` 属性を追加しました。
また、`title` 属性を持つ要素（各種ボタンやセレクトボックス）には `data-i18n-title="キー名"` 属性を追加しました。
*(※ 開発時の視認性や、JavaScriptが無効/エラー時のフェイルセーフとして、HTML上の元の日本語テキスト自体はプレースホルダーとして残しています。)*

### 3. `main.js` からの適用呼び出し
アプリの起動シーケンス（`DOMContentLoaded` 直後）で `window.applyI18nToDOM()` を呼び出し、UI全体の静的テキストが `i18n.js` の設定値で上書きされるようにしました。

### 4. 進捗とバージョンの更新
- `docs/wip/i18n_refactor/master_plan.md` において、Step 3.2 のチェックボックスを完了（`[x]`）に更新しました。
- 各バージョン管理ファイル（`Cargo.toml`, `tauri.conf.json`, `installer.nsi`, `DEVELOPMENT.md`）のバージョンを `0.1.47` へインクリメントしました。
- `docs/history.md` に Ver 0.1.47 のリリースノートを追記しました。

## 検証項目（Manual Verification）
- [x] アプリを起動し、設定ダイアログ（歯車アイコン）を開く。
- [x] すべてのラベルやセレクトボックスの選択肢が正しく表示されているか（表示が崩れたり undefined になったりしていないか）を確認する。
- [x] マウスを各ボタンやセレクトボックスに乗せ、ツールチップが正しく表示されるかを確認する。
