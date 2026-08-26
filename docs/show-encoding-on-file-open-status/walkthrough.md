# ファイルオープン時のステータスバー文字コード表示対応 ウォークスルー (Walkthrough)

## 1. 概要
NoCapEdit Ver 0.2.17 において、ファイルを開いた直後（D&D または `Ctrl + O` によるオープン時）のステータスバー通知において、ファイル名だけでなく判定された文字コード名を含めて表示するよう改善しました。

---

## 2. 主な変更点と実装内容

### 2.1 開いた直後のステータス通知フォーマット改修 (`fileSystem.js`)
- `openExistingFile` における `updateStatus(t('fs.status.opened', ...))` の呼び出しで、ファイル名パラメータを `${fileName} (${encoding})` に変更。
- 表示例:
  - 自動保存モード時: `EmployeeForm.java (UTF-8) を開きました`、`sales_data.csv (Shift_JIS) を開きました`
  - 手動保存モード時: `[手動保存モード] EmployeeForm.java (UTF-8) を開きました`

### 2.2 製品仕様書および履歴の更新
- `docs/spec.md` の §4.5「画面表示」仕様を更新。
- `docs/history.md` に Ver 0.2.17 の改定履歴を追記。

---

## 3. 検証結果

| 検証項目 | 検証内容 | 結果 |
|---|---|---|
| フロントエンドビルド | `npm run build` によるViteビルド | ✅ 成功 |
| Rustバックエンドビルド | `cargo check` によるコンパイルチェック | ✅ 成功（エラー・警告なし） |
| バージョン整合性 | バージョン管理4ファイル（+ package.json）が `0.2.17` に更新されていること | ✅ 完了 |
| ドキュメント整合性 | `spec.md`, `history.md` の更新 | ✅ 完了 |
