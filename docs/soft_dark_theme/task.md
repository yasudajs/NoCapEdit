# タスクリスト: Soft Dark テーマの追加

## ドキュメント
- [ ] docs/wip/soft_dark_theme/implementation_plan.md の作成
- [ ] docs/wip/soft_dark_theme/task.md の作成（このファイル）

## 実装

### style.css
- [ ] `:root` コメントを「Dark テーマ」に修正
- [ ] `body.soft-dark-theme { }` カラーパレットを追加
- [ ] `.theme-toggle-btn` スタイルを削除

### index.html
- [ ] `<button id="themeToggleModal">` を `<select id="themeSelectModal">` に置き換え

### main.js
- [ ] `elements` オブジェクトの `themeToggleModal` を `themeSelectModal` に変更
- [ ] `applyThemeUI(theme)` を3択対応に更新
- [ ] `toggleTheme()` を削除し `onThemeChange()` に置き換え
- [ ] `setupUIEventListeners()` のイベントリスナーを更新（click → change）
- [ ] `init()` でのドロップダウン初期値設定を追加

### Cargo.toml
- [ ] バージョンを `0.1.32` にインクリメント

## 動作確認
- [ ] Dark / Soft Dark / Light の3テーマ切り替え確認
- [ ] 各テーマの色が即座に反映されることを確認
- [ ] タイトルバーの色がDark/Soft Darkでダーク、Lightでライトになることを確認
- [ ] アプリ再起動後のテーマ復元確認
- [ ] `config.json` への `soft-dark` 保存確認
