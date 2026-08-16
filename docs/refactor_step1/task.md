# タスク: Step 1 CSS変数重複の削除 + border短縮記述

## フェーズ 1: 計画と合意 <!-- id: 0 -->
- [x] レビュー指摘事項と対象コード（`style.css`）の確認 <!-- id: 1 -->
- [x] 実装計画書（`implementation_plan_step1.md`）の作成とユーザー合意 <!-- id: 2 -->

## フェーズ 2: 実装準備（ユーザー承認後） <!-- id: 3 -->
- [x] 作業ブランチ `refactor/step1-css-cleanup` の作成 <!-- id: 4 -->
- [x] `docs/wip/refactor_step1/` を `docs/refactor_step1/` に移動・コミット <!-- id: 5 -->
- [x] バージョン番号を `0.1.93` に更新（4ファイル一括） <!-- id: 6 -->
- [x] `spec.md` の更新 <!-- id: 7 -->

## フェーズ 3: 実装作業 <!-- id: 8 -->
- [ ] `style.css` の `body.light-theme` から重複CSS変数を削除 <!-- id: 9 -->
- [ ] `style.css` の `body.soft-dark-theme` から重複CSS変数を削除 <!-- id: 10 -->
- [ ] `style.css` の `#settingsDialog .dialog-box` の border 記述を短縮化 <!-- id: 11 -->

## フェーズ 4: 検証・報告 <!-- id: 12 -->
- [ ] `npm run tauri dev` による3テーマ（Dark / Soft Dark / Light）の見た目確認 <!-- id: 13 -->
- [ ] `docs/refactor_step1/walkthrough.md` の作成 <!-- id: 14 -->
- [ ] `docs/history.md` への変更履歴追記 <!-- id: 15 -->
- [ ] コミット＆プッシュおよびユーザー確認 <!-- id: 16 -->
