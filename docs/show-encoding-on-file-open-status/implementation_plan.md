# ファイルオープン時のステータスバー文字コード表示対応 実装計画書

## 1. 概要
ファイルを開いた直後（D&D または `Ctrl + O` によるオープン時）のステータスバー表示において、ファイル名だけでなく判定された文字コード情報を含めて表示（例: `EmployeeForm.java (UTF-8) を開きました`）するように改善します。

---

## 2. 仕様と動作イメージ

### 2.1 ファイルを開いた直後のステータス表示
- **自動保存モード時**:
  - `[ファイル名] ([文字コード]) を開きました`
  - 例: `sales_data.csv (Shift_JIS) を開きました`
  - 例: `EmployeeForm.java (UTF-8) を開きました`
- **手動保存モード時**:
  - `[手動保存モード] [ファイル名] ([文字コード]) を開きました`
  - 例: `[手動保存モード] sales_data.csv (Shift_JIS) を開きました`
  - 例: `[手動保存モード] EmployeeForm.java (UTF-8) を開きました`

---

## 3. 実装方針と変更内容

### 3.1 フロントエンド (`src/frontend/js/core/fileSystem.js`)
- `openExistingFile` において、ステータス更新時に渡すファイル名パラメータを `${fileName} (${encoding})` に変更：
  ```javascript
  if (!suppressStatus) {
      updateStatus(t('fs.status.opened', { fileName: `${fileName} (${encoding})` }), 'saved');
  }
  ```

### 3.2 製品仕様書の更新 (`docs/spec.md`)
- §4.5「画面表示（タイトルバー・ステータスバー）」の「ファイルを開いた直後」の仕様を `[ファイル名] ([文字コード]) を開きました` に改定。

### 3.3 バージョン更新
- バージョン番号管理4ファイル（`Cargo.toml` 等）および `package.json` を `0.2.17`（NSISは `0.2.17.0`）に更新。

---

## 4. 変更対象ファイル一覧

| 操作 | ファイルパス | 主な変更内容 |
|---|---|---|
| 修正 | `src/frontend/js/core/fileSystem.js` | 開いた直後のステータス更新で文字コード名を含めるよう修正 |
| 修正 | `docs/spec.md` | ステータスバー表示仕様の改定 |
| 修正 | バージョン管理4ファイル (`Cargo.toml` 等) | バージョンを `0.2.17` に更新 |

---

## 5. 検証手順

1. **UTF-8 ファイルのオープン検証**:
   - UTF-8 ファイル（例: `EmployeeForm.java`）を D&D または `Ctrl + O` で開き、ステータスバーに `EmployeeForm.java (UTF-8) を開きました`（手動保存モード時は `[手動保存モード] EmployeeForm.java (UTF-8) を開きました`）と表示されることを確認。
2. **Shift_JIS CSV ファイルのオープン検証**:
   - Shift_JIS CSV ファイルを D&D または `Ctrl + O` で開き、ステータスバーに `xxx.csv (Shift_JIS) を開きました` と表示されることを確認。
