# タスクリスト (fix-save-mode-setting)

- [x] バージョン番号のセット更新 (0.1.40) <!-- id: 0 -->
- [x] `src/dist/js/main.js` の `saveModeSelectModal` イベントリスナー修正（`appState.saveMode` 事前代入の除去） <!-- id: 1 -->
- [x] `src/dist/js/ui/settings.js` の `saveSettings()` 修正（autosaveTimerクリアおよびアクティブタブの `updateTabStatus()` 呼び出し追加） <!-- id: 2 -->
- [x] `cargo check` によるビルドチェック (AI実施) <!-- id: 3 -->
- [ ] 【ユーザー手動テスト項目】 <!-- id: 4 -->
  - [x] 1. `cargo run` でアプリを起動し、設定画面を開く
  - [NG] 2. 保存モードを「自動保存」から「手動保存」に変更し、タブ名が `未保存1` → `[未保存1]`、ステータスバーが `[手動保存モード] ...` に即時切り替わることを確認
  - [ ] 3. `config.json`（またはアプリ再起動時）で `"save_mode": "manual"` が維持されることを確認
  - [ ] 4. 保存モードを「手動保存」から「自動保存」へ戻し、表示および `config.json` が `"save_mode": "auto"` に即時戻ることを確認
- [ ] `docs/fix-save-mode-setting/walkthrough.md` の更新と `docs/history.md` への改定履歴反映 <!-- id: 5 -->
