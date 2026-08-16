# タスク: Step 4 CSSクラス名 tab-select → settings-select

## フェーズ 1: 計画と合意 <!-- id: 0 -->
- [x] レビュー指摘事項と対象コード（`index.html`, `style.css`）の確認 <!-- id: 1 -->
- [x] 実装計画書（`implementation_plan_step4.md`）の作成とユーザー合意 <!-- id: 2 -->

## フェーズ 2: 実装準備（ユーザー承認後） <!-- id: 3 -->
- [x] `docs/wip/refactor_step4/` を `docs/refactor_step4/` に移動・コミット <!-- id: 4 -->

## フェーズ 3: 実装作業 <!-- id: 5 -->
- [ ] `src/dist/index.html` 内の7箇所の `<select>` 要素のクラス名を `tab-select` から `settings-select` にリネーム <!-- id: 6 -->
- [ ] `src/dist/style.css` 内の `.tab-select` セレクタをすべて `.settings-select` にリネーム <!-- id: 7 -->

## フェーズ 4: 検証・報告 <!-- id: 8 -->
- [ ] `npm run tauri dev` で起動し、設定画面の全セレクトボックスの外観・フォーカス・選択動作を確認 <!-- id: 9 -->
- [ ] `docs/refactor_step4/walkthrough.md` の作成 <!-- id: 10 -->
- [ ] `docs/history.md` への変更履歴追記 <!-- id: 11 -->
- [ ] コミット＆プッシュおよびユーザー確認 <!-- id: 12 -->
