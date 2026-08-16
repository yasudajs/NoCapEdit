# タスク: Step 6 WAI-ARIA属性の付与

## フェーズ 1: 計画と合意 <!-- id: 0 -->
- [x] レビュー指摘事項と対象コード（`src/dist/index.html`）の確認 <!-- id: 1 -->
- [x] 実装計画書（`implementation_plan_step6.md`）の作成とユーザー合意 <!-- id: 2 -->

## フェーズ 2: 実装準備（ユーザー承認後） <!-- id: 3 -->
- [x] `docs/wip/refactor_step6/` を `docs/refactor_step6/` に移動・コミット <!-- id: 4 -->

## フェーズ 3: 実装作業 <!-- id: 5 -->
- [x] `src/dist/index.html` の `#settingsDialog` に `role="dialog"`, `aria-modal="true"`, `aria-labelledby="settingsDialogTitle"` を付与 <!-- id: 6 -->
- [x] `src/dist/index.html` の設定ダイアログ見出し `<h2>` に `id="settingsDialogTitle"` を付与 <!-- id: 7 -->

## フェーズ 4: 検証・報告 <!-- id: 8 -->
- [x] `npm run tauri dev` で起動し、設定画面の開閉・キーボード操作・フォーカス移動に問題がないことを確認 <!-- id: 9 -->
- [x] `docs/refactor_step6/walkthrough.md` の作成 <!-- id: 10 -->
- [x] `docs/history.md` への変更履歴追記 <!-- id: 11 -->
- [x] コミット＆プッシュおよびユーザー確認 <!-- id: 12 -->
