# フェーズ1（ブリッジモジュール作成）タスクリスト

## 実装タスク
- [x] `v0.2` ブランチから `feature/refactor-phase1-bridge-module` を作成
- [x] バージョン番号の更新（4ファイル: 0.2.17 -> 0.2.18）
  - [x] `Cargo.toml`
  - [x] `tauri.conf.json`
  - [x] `nsis/installer.nsi`
  - [x] `docs/DEVELOPMENT.md`
- [x] `src/dist/js/ui/sidebar-integration.js` を新規作成
- [x] `src/dist/js/main.js` の変更
  - [x] import文の修正
  - [x] DOMContentLoaded内の `initSidebar` 呼出を `initSidebarIntegration` に変更

## 手動検証チェックリスト（ユーザー依頼）
- [ ] `cargo run` でアプリが正常に起動すること
- [ ] **サイドバー表示**: サイドバートグルボタン（左上アイコン）をクリックして、サイドバーが正しく表示/非表示を切り替えられること
- [ ] **サイドバーリサイズ**: サイドバーの右端ドラッグでリサイズが機能すること
- [ ] **ファイルツリー**: ホームフォルダが設定されている場合、ファイルツリーが正常に表示されること
- [ ] **既存ショートカット**: Ctrl+E（サイドバーフォーカス）、Ctrl+N（新規ファイル）、Ctrl+D（新規フォルダ）が動作すること
- [ ] **基本操作**: 新規タブ作成、テキスト入力、保存（自動/手動）が正常に動作すること
- [ ] **ブラウザコンソール**: エラーが出力されていないこと（F12でDevTools確認）
