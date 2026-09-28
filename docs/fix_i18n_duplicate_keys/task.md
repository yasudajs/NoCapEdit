# タスクリスト: 多言語辞書（i18n）重複キー修正

- [x] フェーズ1: 実装計画の作成と合意 <!-- id: 0 -->
  - [x] 重複キーおよび未定義キーの網羅的調査・検証 <!-- id: 1 -->
  - [x] 実装計画書（`docs/wip/fix_i18n_duplicate_keys/implementation_plan.md`）の作成 <!-- id: 2 -->
  - [x] ユーザーによる実装計画の承認待ち <!-- id: 3 -->

- [ ] フェーズ2: 実装作業の開始（※ユーザーの開始指示後に着手） <!-- id: 4 -->
  - [x] 作業ブランチ `feature/fix-i18n-duplicate-keys` の作成 <!-- id: 5 -->
  - [x] ドキュメントの本番格上げ（`docs/wip/` から `docs/fix_i18n_duplicate_keys/` へ移動・コミット・プッシュ） <!-- id: 6 -->
  - [x] バージョン番号を 0.2.27 に更新（5ファイル: Cargo.toml, package.json, tauri.conf.json, installer.nsi, DEVELOPMENT.md） <!-- id: 7 -->
  - [ ] `docs/spec.md` を最新版に更新 <!-- id: 8 -->
  - [ ] `src/frontend/i18n.js` の重複キー定義（2箇所）の削除 <!-- id: 9 -->
  - [ ] 自動スクリプトによる全辞書キー重複・欠落ゼロの検証 <!-- id: 10 -->
  - [ ] アプリケーション起動・実機UI検証（検索バー、置換欄、ツールチップ、ヘルプ画面） <!-- id: 11 -->
  - [ ] ウォークスルー（`docs/fix_i18n_duplicate_keys/walkthrough.md`）の作成 <!-- id: 12 -->
  - [ ] 変更履歴（`docs/history.md`）に Ver 0.2.27 の変更内容を追記 <!-- id: 13 -->
  - [ ] 実装およびドキュメントの最終コミット＆プッシュ <!-- id: 14 -->
  - [ ] ユーザーへの完了報告と確認依頼 <!-- id: 15 -->

- [ ] フェーズ3: クリーンアップ・マージ（※ユーザーの承認・指示後に着手） <!-- id: 16 -->
  - [ ] `docs/history.md` の最終確認 <!-- id: 17 -->
  - [ ] 作業ドキュメントフォルダ（`docs/fix_i18n_duplicate_keys/`）の削除・コミット・プッシュ <!-- id: 18 -->
  - [ ] `master` ブランチへの非Fast-forwardマージ（`git merge --no-ff`）とプッシュ <!-- id: 19 -->
  - [ ] ローカルおよびリモートの作業ブランチ削除 <!-- id: 20 -->
