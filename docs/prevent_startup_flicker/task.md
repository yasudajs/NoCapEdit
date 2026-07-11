# タスク：起動時のウィンドウ表示ガタつき修正 (Prevent Startup Flicker)

- [x] Rustバックエンドの実装
  - [x] `WindowBuilder` の構築オプションに `.visible(false)` を追加し、起動時はウィンドウを非表示にする
  - [x] `Cargo.toml` の `tauri` 依存関係に `window-show` フィーチャーを追加
  - [x] `tauri.conf.json` の `allowlist.window` に `"show": true` 権限を追加
- [x] フロントエンドの実装
  - [x] `init()` 関数の最後に `finally` ブロックを追加し、例外発生時も含め確実に `appWindow.show()` を呼び出すフェイルセーフ設計にリファクタリング
- [x] 動作確認（ビルド・テスト）
  - [x] `cargo build` が成功することを確認
- [ ] 実装完了後のドキュメントクリーンアップ
  - [ ] `docs/prevent_startup_flicker/` フォルダを完全に削除する
