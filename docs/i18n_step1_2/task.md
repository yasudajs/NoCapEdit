# 実装タスク: Step 1.2 (tabs.js の多言語化対応)

- [x] `src/dist/i18n.js` の `tabs` に新しいキーと言語リソースを追加する
- [x] `src/dist/js/ui/tabs.js` のハードコードされた文字列を `t()` に置き換える
  - [x] 正規表現の動的生成 (`unsavedLabel` の利用)
  - [x] タブステータス (`saving`, `editing`, `saved`)
  - [x] ステータスバー (`manualSaveHint`, `ready`, `manualSavePrefix`, `manualModePrefix`)
  - [x] エラーメッセージ (`noHomeFolder`, `createFailed`, `switchFailed`)
  - [x] 新規タブ作成時の「未保存」テキストの生成
- [ ] 動作確認（ブラウザ上での描画やエラーがないかの確認）
- [ ] ウォークスルー (`docs/i18n_step1_2/walkthrough.md`) を作成する
- [ ] `docs/history.md` に変更履歴を追記する
- [ ] 全体の変更をコミット＆プッシュする
