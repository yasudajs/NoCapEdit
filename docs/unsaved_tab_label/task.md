# タスクリスト：新規タブの「未保存」ラベル表示

## ドキュメント作業
- [x] `spec.md` を最新版に更新
- [x] WIPフォルダを `docs/unsaved_tab_label/` に本番格上げ
- [x] `implementation_plan.md` の作成

## 実装作業（`src/dist/main.js`）
- [ ] ① `unsavedTabCounter` 変数の追加
- [ ] ② `createNewTab()` の変更（タブ名を `未保存N` / `[未保存N]` に）
- [ ] ③ `saveTabIfDirty()` の変更（タイムスタンプを保存時刻で生成）
- [ ] ④ `triggerManualSave()` の変更（タイムスタンプ生成ロジックの統一）
- [ ] ⑤ `formatTabDisplayName()` の変更（未保存ラベルを透過）

## コミット・検証
- [ ] 実装内容のコミット＆プッシュ（ユーザー確認後）
- [ ] 動作確認（検証計画10項目）
