# タスク: Step 3 (デフォルト) ハードコードのi18n化

## フェーズ 1: 計画と合意 <!-- id: 0 -->
- [x] レビュー指摘事項と対象コード（`index.html`, `i18n.js`）の確認 <!-- id: 1 -->
- [x] 実装計画書（`implementation_plan_step3.md`）の作成とユーザー合意 <!-- id: 2 -->

## フェーズ 2: 実装準備（ユーザー承認後） <!-- id: 3 -->
- [x] `docs/wip/refactor_step3/` を `docs/refactor_step3/` に移動・コミット <!-- id: 4 -->

## フェーズ 3: 実装作業 <!-- id: 5 -->
- [ ] `src/dist/i18n.js` に `fontSize.defaultOption` と `lineHeight.defaultOption` を追加 <!-- id: 6 -->
- [ ] `src/dist/index.html` の 20pt / 1.5 の option に `data-i18n` 属性を付与 <!-- id: 7 -->

## フェーズ 4: 検証・報告 <!-- id: 8 -->
- [ ] `npm run tauri dev` で起動し、設定画面でデフォルト表記が正しくローカライズ表示されることを確認 <!-- id: 9 -->
- [ ] `docs/refactor_step3/walkthrough.md` の作成 <!-- id: 10 -->
- [ ] `docs/history.md` への変更履歴追記 <!-- id: 11 -->
- [ ] コミット＆プッシュおよびユーザー確認 <!-- id: 12 -->
