# タスク一覧: フォントサイズ・行間の設定画面追加と永続化/一時変更の分離

- [x] **フェーズ1: 実装計画の作成と合意** <!-- id: phase1 -->
  - [x] 現状のコード調査と仕様検討 <!-- id: task1_1 -->
  - [x] ディスカッションと合意形成 <!-- id: task1_2 -->
  - [x] 実装計画書（`docs/settings_font_and_line_height/implementation_plan.md`）の作成 <!-- id: task1_3 -->

- [ ] **フェーズ2: 実装作業（ユーザー承認後）** <!-- id: phase2 -->
  - [x] 作業用ブランチの作成（`master` 派生） <!-- id: task2_1 -->
  - [x] WIPドキュメントの移動（`docs/wip/settings_font_and_line_height/` → `docs/settings_font_and_line_height/`）およびコミット・プッシュ <!-- id: task2_2 -->
  - [ ] バージョン番号の更新（Cargo.toml等の4ファイル） <!-- id: task2_3 -->
  - [ ] `spec.md` の更新 <!-- id: task2_4 -->
  - [ ] バックエンド実装（`src/settings.rs` のデフォルトフォントサイズ修正） <!-- id: task2_5 -->
  - [ ] UI実装（`index.html`, `style.css`, `i18n.js` へのセレクト追加・スタイリング・多言語化キー追加） <!-- id: task2_6 -->
  - [ ] フロントエンド状態管理・エディタ実装（`state.js`, `editor.js`, `settings.js`, `main.js`） <!-- id: task2_7 -->
  - [ ] 動作確認・検証（設定永続化、ショートカット一時変更、リセット、Tab移動） <!-- id: task2_8 -->
  - [ ] ウォークスルー（`docs/settings_font_and_line_height/walkthrough.md`）の作成 <!-- id: task2_9 -->
  - [ ] `docs/history.md` への変更履歴追記、コミット・プッシュ <!-- id: task2_10 -->
