# タスクリスト：新規タブの「未保存」ラベル表示

## ドキュメント作業
- [x] `spec.md` を最新版に更新
- [x] WIPフォルダを `docs/unsaved_tab_label/` に本番格上げ
- [x] `implementation_plan.md` の作成

## 実装作業（`src/dist/main.js`）
- [x] ① `unsavedTabCounter` 変数の追加
- [x] ② `createNewTab()` の変更（タブ名を `未保存N` / `[未保存N]` に、および `unsavedNumber` を保持）
- [x] ③ `saveTabIfDirty()` の変更（タイムスタンプを保存時刻で生成）
- [x] ④ `triggerManualSave()` の変更（タイムスタンプ生成ロジックの統一）
- [x] ⑤ `formatTabDisplayName()` の変更（未保存ラベルを透過）
- [x] ⑧ `saveSettings()` の変更（保存モード切り替え処理の修正）

## コミット・検証
- [ ] 実装内容のコミット＆プッシュ（ユーザー確認後）
- [ ] 動作確認（検証計画14項目）
