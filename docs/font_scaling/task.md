# タスクリスト - フォント拡大縮小機能の実装

- [x] バックエンド (Rust) の修正
    - [x] `src/main.rs` の `AppSettings` に `font_size` フィールドを追加
    - [x] `SettingsResponse` に `font_size` を追加
    - [x] `save_settings` コマンドを更新して `font_size` を受け取るように修正
- [x] フロントエンド (HTML/JS) の修正
    - [x] `src/dist/main.js` の `appState` に `fontSize` を追加し、初期化時に適用
    - [x] `saveSettings` や `toggleTheme` で `fontSize` を渡すように修正
    - [x] ズーム制御ロジック (`zoomIn`, `zoomOut`, `applyFontSize`, `saveFontSizeDelay`) を追加
    - [x] `Ctrl` + マウスホイール、`Ctrl` + `+`/`-` のイベントリスナーを追加
- [x] 動作確認と検証
    - [x] ビルドが正常に通ることを確認
    - [x] マウスホイールによる拡大縮小の検証
    - [x] キーボードショートカットによる拡大縮小の検証
    - [x] 再起動時にフォントサイズが維持されるか（設定保存）の検証
