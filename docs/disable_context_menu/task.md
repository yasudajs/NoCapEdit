# タスクリスト

- [x] バックエンド（Rust）の実装
  - [x] `src/main.rs` に `is_debug` コマンドを定義
  - [x] `invoke_handler` に `is_debug` を追加
- [x] フロントエンド（JS）の実装
  - [x] `src/dist/main.js` にて起動時に `is_debug` を呼び出す
  - [x] リリースビルドの時に `contextmenu` イベントを preventDefault
- [ ] 動作確認（手動検証）
  - [ ] デバッグビルドでコンテキストメニューが表示されることを確認
