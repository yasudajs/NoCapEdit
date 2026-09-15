# 手動保存モードにおける上書き保存不具合の修正 実装計画書

## 1. 概要
手動保存モード（`appState.saveMode === 'manual'`）において、一度保存したタブ（または外部から開いた既存ファイル）を編集して再度手動保存（`Ctrl + S`）を行った際、既存ファイルへ上書き保存されず、タイムスタンプが更新された新規ファイルが作成されてしまう不具合を解消します。
自動保存モードと同様に、2回目以降の保存ではファイル名を維持したまま既存ファイルへの上書き保存が行われるように修正します。

---

## 2. 不具合の原因
`src/frontend/js/core/fileSystem.js` の `triggerManualSave()` 関数において、手動保存モード時に既存ファイルの有無（`tab.filePath`）に関わらず、無条件に `create_and_save_file`（新しいタイムスタンプで新規ファイルを作成するコマンド）を呼び出すコードになっていました。

```javascript
// 修正前の問題箇所
let saved = false;
if (appState.saveMode === 'manual') {
    const saveTimestamp = generateTimestamp();
    const file = await invoke('create_and_save_file', {
        homeFolder: appState.homeFolder,
        timestamp: saveTimestamp,
        content: tab.content,
    });
    tab.filePath = file.file_path;
    tab.fileName = file.file_name;
    // ...
    saved = true;
} else {
    tab.isDirty = true;
    saved = await saveTabIfDirty(tab);
}
```

これにより、以下の問題が発生していました：
- 手動保存を実行するたびに新しい日時の `.nctx` ファイルがディスク上に新規作成される。
- タブの参照先（`tab.filePath`, `tab.fileName`）が新しいファイルに切り替わり、元のファイルは更新されず放置される。
- 外部ファイル（`memo.txt` など）を手動保存モードで開いて保存した場合でも、元のファイルへ上書きされずホームフォルダに新規 `.nctx` ファイルが作られてしまう。

---

## 3. 修正方針
`triggerManualSave()` 内の不要な `if (appState.saveMode === 'manual')` 分岐を削除し、常に `saveTabIfDirty(tab)` を使用するように統一します。

`saveTabIfDirty(tab)` は以下の制御を内包しており、手動保存モードでも完全に適正に動作します：
1. **初回保存（`!tab.filePath`）かつテキスト入力あり**:
   - `create_and_save_file` を呼び出して新規ファイル（`yyyymmdd_hhmmss.nctx`）を作成。
2. **初回保存（`!tab.filePath`）かつテキストが空（空白のみ）**:
   - 不要な空ファイル作成をスキップ。
3. **2回目以降の保存（`tab.filePath` あり）**:
   - 既存ファイルパスに対して `save_text_file` を呼び出して上書き保存。
   - ファイル名やタイムスタンプは変わらず維持される。
   - 文字コード（Shift_JIS 等）も維持される。
4. **多重保存ガード**:
   - `isSaving` / `savePromise` により、非同期保存の重複実行を防止。

---

## 4. 変更対象ファイル一覧

| 操作 | ファイルパス | 主な変更内容 |
|---|---|---|
| 修正 | `src/frontend/js/core/fileSystem.js` | `triggerManualSave()` での保存処理を `saveTabIfDirty(tab)` に一本化 |
| 修正 | `docs/spec.md` | 手動保存仕様の文言整理（必要に応じて） |
| 修正 | バージョン管理4ファイル (`Cargo.toml` 等) | 内部バージョンを `0.2.19` に更新 |

---

## 5. 検証手順

1. **手動保存モードでの新規ファイル作成検証**:
   - 設定画面で保存モードを「手動保存」に設定。
   - 新規タブを作成（タブ名: `[未保存1]`）。
   - テキストを入力し、`Ctrl + S` を押下。
   - ホームフォルダに `yyyymmdd_hhmmss.nctx` が新規作成され、タブ名が `[yyyy/mm/dd hh:mm:ss]` に変化し、ステータスバーに「作成されました」と表示されることを確認。
2. **手動保存モードでの上書き保存検証（バグ修正の確認）**:
   - 1のタブでさらにテキストを追記・編集。
   - 再度 `Ctrl + S` を押下。
   - **ファイル名・タイムスタンプが変わらないこと**、**ホームフォルダに新しい `.nctx` が作成されないこと**、**既存ファイルの内容が上書き更新されていること**を確認。
   - ステータスバーに `[手動保存:Ctrl+S] yyyymmdd_hhmmss.nctx (UTF-8) - 保存済み` と表示されることを確認。
3. **手動保存モードでの外部ファイル上書き保存検証**:
   - 既存のテキストファイル（例: `test.txt`）を開き、手動保存モードでテキストを編集して `Ctrl + S` を押下。
   - 元の `test.txt` が上書き保存され、新規 `.nctx` が作られないことを確認。
4. **自動保存モードでの退行確認**:
   - 設定を「自動保存」に戻し、入力停止後（3秒）の自動上書き保存、および `Ctrl + S` による即時上書き保存が正常に動作することを確認。
5. **テスト実行**:
   - `cargo test` を実行し、既存テストが全てパスすることを確認。
