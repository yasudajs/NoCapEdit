# [Phase 9] 統合テストとコードクリーンアップ タスクリスト

- [x] 作業ブランチの作成 (`feature/phase9-cleanup`)
- [x] 実装計画書およびタスクリストの作成 (`docs/phase9_cleanup/`)
- [x] 内部バージョン番号の更新 (`0.2.25`) (Cargo.toml, tauri.conf.json, nsis/installer.nsi, docs/DEVELOPMENT.md)
- [x] コードクリーンアップの実装
  - [x] `src/dist/js/main.js`: 未使用 import `updateTabStatus` の削除
  - [x] `src/dist/js/ui/settings.js`: 未使用 import `applyFontSize`, `applyLineHeight` の削除
  - [x] `src/dist/js/state.js`: 未使用関数 `setAppState` および 不要DOMキャッシュ `confirmSettingsBtn` の削除
- [x] ビルドおよび動作検証
  - [x] `cargo check` によるビルド確認
  - [x] コンソールエラー・未定義参照のないことの確認
- [x] `docs/history.md` に変更履歴を追記
- [x] コミット＆プッシュおよび成果確認
