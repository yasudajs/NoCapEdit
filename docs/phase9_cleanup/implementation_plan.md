# [Phase 9] 統合テストとコードクリーンアップ 実装計画書

## 📖 概要
事前調査（`docs/wip/phase9_integration_and_cleanup_investigation.md`）で判明した、モジュール間の不要な import 文、未使用エクスポート関数（デッドコード）、存在しない DOM 要素キャッシュ項目の削除（クリーンアップ）を行います。
また、`main.js` からのサイドバー直接依存が完全に排除され、リファクタリングが正しく完了していることを最終検証します。

---

## 🎯 変更内容

### 1. `src/dist/js/main.js`
- 未使用 import `updateTabStatus`（`./ui/tabs.js` 由来）の削除

### 2. `src/dist/js/ui/settings.js`
- 未使用 import `applyFontSize`, `applyLineHeight`（`./editor.js` 由来）の削除

### 3. `src/dist/js/state.js`
- 未使用エクスポート関数 `setAppState(key, value)` の削除
- 存在しない DOM 要素キャッシュ `confirmSettingsBtn` の削除

---

## 🧪 検証計画

### 1. ビルド・構文チェック
- `cargo check` を実行し、Rustバックエンドおよび全体ビルドに問題がないか確認。
- アプリケーションを起動 (`cargo run`) し、コンソール等に JavaScript エラーや未定義参照エラーが発生していないか確認。

### 2. 基本機能動作検証
- タブの追加・移動・削除が正常に行えること。
- 設定ダイアログの表示・設定変更・保存・適用（テーマ・フォント・Tab挙動等）が正常に行えること。
- サイドバーの初期表示および操作が従来通り正常に動作すること。
