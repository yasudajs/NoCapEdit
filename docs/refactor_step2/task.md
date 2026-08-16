# タスク: Step 2 未使用i18nキーの削除

## フェーズ 1: 計画と合意 <!-- id: 0 -->
- [x] レビュー指摘事項と対象コード（`src/dist/i18n.js`）の確認 <!-- id: 1 -->
- [x] 実装計画書（`implementation_plan_step2.md`）の作成とユーザー合意 <!-- id: 2 -->

## フェーズ 2: 実装準備（ユーザー承認後） <!-- id: 3 -->
- [x] `docs/wip/refactor_step2/` を `docs/refactor_step2/` に移動・コミット <!-- id: 4 -->

## フェーズ 3: 実装作業 <!-- id: 5 -->
- [ ] `src/dist/i18n.js` から未使用キー `ui.dialog.settings.font.loading` を削除 <!-- id: 6 -->

## フェーズ 4: 検証・報告 <!-- id: 7 -->
- [ ] `npm run tauri dev` で起動し、フォント読み込みプレースホルダー表示およびコンソールエラーなしを確認 <!-- id: 8 -->
- [ ] `docs/refactor_step2/walkthrough.md` の作成 <!-- id: 9 -->
- [ ] `docs/history.md` への変更履歴追記 <!-- id: 10 -->
- [ ] コミット＆プッシュおよびユーザー確認 <!-- id: 11 -->
