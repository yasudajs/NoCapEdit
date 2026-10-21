# タスクリスト: 括弧の補完機能・自動インデント機能の設定画面追加

- [x] フェーズ1: 実装計画の作成
  - [x] 既存コードベースの調査・影響範囲の確認
  - [x] 実装計画書 (`implementation_plan.md`) の作成とユーザーへの提示
- [x] フェーズ2: 実装作業の開始（ユーザーの作業開始指示後）
  - [x] `master` ブランチから作業用ブランチを作成
  - [x] ドキュメントを `docs/wip/auto-indent-and-brackets-settings/` から `docs/auto-indent-and-brackets-settings/` へ移動してコミット＆プッシュ
  - [x] バージョン管理ファイル（5ファイル）を `2.15.0` に更新
  - [x] `docs/spec.md` および `docs/USER_GUIDE.md` を最新版に更新
  - [x] Rustバックエンド（`src/settings.rs`, `src/commands.rs`）の実装と単体テスト追加
  - [x] フロントエンド多言語辞書（`src/frontend/i18n.js`）と設定画面HTML（`src/frontend/index.html`）の更新
  - [x] フロントエンド状態管理・設定保存・CodeMirror動的制御（`state.js`, `settingsManager.js`, `codemirror.js`, `editor.js`, `tabs.js`, `fileSystem.js`, `settings.js`, `main.js`）の実装
  - [x] ビルドおよびテストによる動作検証（`cargo test`, `npm run build`）
  - [x] ウォークスルー（`docs/auto-indent-and-brackets-settings/walkthrough.md`）の作成と `docs/history.md` の更新、コミット＆プッシュ
- [ ] フェーズ3: クリーンアップ・マージ（ユーザーの承認・指示後）
  - [ ] 作業ドキュメントフォルダ（`docs/auto-indent-and-brackets-settings/`）の削除とコミット＆プッシュ
  - [ ] `master` ブランチへの非Fast-forwardマージ（`--no-ff`）とプッシュ、作業ブランチ削除
