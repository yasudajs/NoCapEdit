# 指定行ジャンプ機能 (Ctrl+G) タスクリスト

## フェーズ 2: 実装作業

- [x] 作業用ブランチ `feature/goto-line` の作成
- [x] ドキュメントを `docs/wip/goto_line/` から `docs/goto_line/` へ移動
- [x] 初回コミット & プッシュ (ドキュメント配置)
- [x] バージョン番号の更新 (0.2.28 - 5ファイル)
  - [x] `Cargo.toml`
  - [x] `package.json`
  - [x] `src-tauri/tauri.conf.json`
  - [x] `nsis/installer.nsi`
  - [x] `docs/DEVELOPMENT.md`
- [x] `docs/spec.md` の更新 (指定行ジャンプ機能の仕様追記、バージョン更新)
- [ ] 実装: 多言語リソースの追加 (`src/frontend/i18n.js`)
- [ ] 実装: エディタジャンプ関数の追加 (`src/frontend/js/ui/codemirror.js`)
- [ ] 実装: 行ジャンプUIマークアップの追加 (`src/frontend/index.html`)
- [ ] 実装: 行ジャンプUIスタイルの追加 (`src/frontend/style.css`)
- [ ] 実装: 行ジャンプUIモジュールの新規作成 (`src/frontend/js/ui/gotoLine.js`)
- [ ] 実装: 検索ウィジェットとの排他制御 (`src/frontend/js/ui/findReplace.js`)
- [ ] 実装: キーボードショートカット登録 (`src/frontend/js/ui/shortcuts.js`)
- [ ] 実装: 初期化処理の呼び出し (`src/frontend/js/main.js`)
- [ ] 実装: ヘルプ画面の更新 (`src/frontend/help.html`)
- [ ] ドキュメント更新: ショートカット一覧 (`docs/SHORTCUTS.md`)
- [ ] ドキュメント更新: ユーザーガイド (`docs/USER_GUIDE.md`)
- [ ] 動作確認 & テスト検証 (正負行番号、列指定、クランプ、エラー表示、Enter/Esc、排他制御)
- [ ] ビルド確認 (`npm run build` / `cargo check`)
- [ ] ウォークスルー (`docs/goto_line/walkthrough.md`) の作成
- [ ] 変更履歴 (`docs/history.md`) の追記 (Ver 0.2.28)
- [ ] 最終コミット & プッシュ
