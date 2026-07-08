# 行間高さ調整機能タスクリスト

- `[x]` `src/main.rs` の修正
  - `AppSettings` 構造体に `line_height: f32` 追加
  - `SettingsResponse` 構造体に `line_height: f32` 追加
  - `get_settings` で `line_height` を返す処理の追加
  - `save_settings` に `line_height` 引数を追加し保存ロジック更新
- `[x]` `src/dist/main.js` の修正
  - `appState` に `lineHeight: 1.6` の初期値追加
  - `init()` で Rust からの `line_height` 取得・適用処理を追加
  - `updateEditorMetrics()` でステータスバー LH 表示の追加
  - `applyLineHeight()` 関数の作成
  - `window.addEventListener('keydown')` に `Ctrl + Shift + +/-` のハンドラを追加
- `[ ]` 動作確認
  - 起動時の初期値適用
  - ショートカットによる増減とステータスバー表示更新
  - 再起動後の設定保持確認
