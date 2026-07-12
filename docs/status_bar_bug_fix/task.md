# タスクリスト: ステータスバーのファイル状態表示バグ修正

- [ ] `src/dist/main.js` の `saveTabIfDirty` で保存実行成否の `boolean` を返すよう修正
- [ ] `src/dist/main.js` の `triggerManualSave` で `saveTabIfDirty` の戻り値（保存成否）を判定するよう修正
- [ ] `src/dist/main.js` の `autoSave` で `saveTabIfDirty` の戻り値（保存成否）を判定するよう修正
- [ ] `src/dist/main.js` の `closeTab` 内で直接代入していた箇所を `switchTab` に置き換える修正
- [ ] 動作検証
  - [ ] `cargo build` でビルドが正常に通ることを確認
  - [ ] 再現手順1: 新規ウィンドウ空保存で「作成」ステータスが表示されないことの確認
  - [ ] 再現手順2: 既存ファイルを開いて正しいステータスが表示されることの確認
  - [ ] 再現手順3: 既存ファイルを閉じて未保存タブへ戻ったときにステータスが更新されることの確認
  - [ ] 正常系: 新規タブ入力保存でファイルが作成され、「作成」ステータスが表示されることの確認
