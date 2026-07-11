# タスクリスト: Soft Dark テーマの追加

## ドキュメント
- [x] docs/wip/soft_dark_theme/implementation_plan.md の作成
- [x] docs/wip/soft_dark_theme/task.md の作成（このファイル）
- [x] docs/soft_dark_theme/ に本番格上げ（WIPから移動）
- [x] spec.md・ドキュメントのコミット＆プッシュ

## 実装

### style.css
- [x] `:root` コメントを「Dark テーマ」に修正
- [x] `body.soft-dark-theme { }` カラーパレットを追加
- [x] `.theme-toggle-btn` スタイルを削除

### index.html
- [x] `<button id="themeToggleModal">` を `<select id="themeSelectModal">` に置き換え

### main.js
- [x] `elements` オブジェクトの `themeToggleModal` を `themeSelectModal` に変更
- [x] `applyThemeUI(theme)` を3択対応に更新
- [x] `toggleTheme()` を削除し `onThemeChange()` に置き換え
- [x] `setupUIEventListeners()` のイベントリスナーを更新（click → change）
- [x] `applyThemeUI()` でドロップダウン初期値同期を実装

### Cargo.toml
- [x] バージョンを `0.1.32` にインクリメント

## 動作確認
- [x] Dark / Soft Dark / Light の3テーマ切り替え確認
- [x] 各テーマの色が即座に反映されることを確認
- [x] タイトルバーの色がDark/Soft Darkでダーク、Lightでライトになることを確認
- [x] アプリ再起動後のテーマ復元確認
- [x] `config.json` への `soft-dark` 保存確認
