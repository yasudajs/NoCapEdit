# タスク：起動時のウィンドウ表示ガタつき修正 (Prevent Startup Flicker)

- [ ] Rustバックエンドの実装
  - [ ] `WindowBuilder` の構築オプションに `.visible(false)` を追加し、起動時はウィンドウを非表示にする
- [ ] フロントエンドの実装
  - [ ] `init()` 関数の最後（初回起動時の `openSettingsDialog` 呼び出し箇所）に `appWindow.show()` を追加してウィンドウを表示
  - [ ] `init()` 関数の最後（通常起動時の `createNewTab` 呼び出し後）に `appWindow.show()` を追加してウィンドウを表示
- [ ] 動作確認（ビルド・テスト）
  - [ ] `cargo build` が成功することを確認
- [ ] 実装完了後のドキュメントクリーンアップ
  - [ ] `docs/prevent_startup_flicker/` フォルダを完全に削除する
