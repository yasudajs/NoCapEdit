# ウォークスルー: 手動保存モードにおける上書き保存不具合の修正 (v0.2.19)

## 概要
手動保存モード（`appState.saveMode === 'manual'`）において、手動保存（`Ctrl + S`）を実行するたびにタイムスタンプが更新されて新規保存されてしまう不具合を解消しました。
`triggerManualSave()` 内で手動保存モード専用に分岐していた無条件の新規ファイル作成処理を削除し、既存の `saveTabIfDirty(tab)` に一本化することで、自動保存モードと同様に2回目以降の保存では既存ファイルへの上書き保存が行われるように修正しました。

---

## 変更内容の詳細

### 1. フロントエンド (`src/frontend/js/core/fileSystem.js`)
- `triggerManualSave()`:
  - 手動保存モード時に無条件で `create_and_save_file` を呼び出していた分岐を削除しました。
  - 手動保存モード・自動保存モードともに `tab.isDirty = true` をセットし、`saveTabIfDirty(tab)` を呼び出すように処理を統一しました。
  - これにより、初回保存（ファイル未作成）時は `create_and_save_file` で新規ファイルが作成され、2回目以降（ファイル作成済み）は `save_text_file` で既存ファイルへの上書き保存（文字コードも維持）が行われます。

```diff
-        let saved = false;
-        if (appState.saveMode === 'manual') {
-            const saveTimestamp = generateTimestamp();
-            const file = await invoke('create_and_save_file', {
-                homeFolder: appState.homeFolder,
-                timestamp: saveTimestamp,
-                content: tab.content,
-            });
-            tab.filePath = file.file_path;
-            tab.fileName = file.file_name;
-            tab.encoding = 'UTF-8';
-            tab.createdTimestamp = saveTimestamp;
-            tab.isDirty = false;
-            saved = true;
-        } else {
-            tab.isDirty = true;
-            saved = await saveTabIfDirty(tab);
-        }
+        tab.isDirty = true;
+        const saved = await saveTabIfDirty(tab);
```

### 2. 単体テストの修正 (`src/commands.rs`)
- 文字コード対応（v0.2.15）で追加された `save_text_file` の第3引数 `encoding: Option<String>` に対し、単体テスト `test_save_text_file_atomic_overwrite` 内での呼び出し引数が不足していたため、`None` を渡すように修正しました。

### 3. 仕様書およびバージョン番号の更新
- **[`docs/spec.md`](file:///d:/antigravity/NoCapEdit/docs/spec.md)**: §4.4「テキスト編集と保存仕様」の手動保存仕様記述を最新化。
- **バージョン管理4ファイル**: `0.2.18` → `0.2.19` に更新。
  - `Cargo.toml`
  - `tauri.conf.json`
  - `nsis/installer.nsi`
  - `docs/DEVELOPMENT.md`
  - `package.json`

---

## 検証結果

### 1. 自動テスト (Rust)
```bash
cargo test
```
- `test settings::tests::test_settings_clamp_ranges ... ok`
- `test commands::tests::test_next_available_file_path_single_digit_sequence ... ok`
- `test commands::tests::test_save_text_file_atomic_overwrite ... ok`
- 全 3 件のテストが正常にパスしました。

### 2. フロントエンドビルド
```bash
npm run build
```
- Vite による本番ビルドが正常に完了することを確認しました。

### 3. 動作仕様の確認
- **初回手動保存（`!tab.filePath`）**:
  - `saveTabIfDirty` により新規タイムスタンプファイル（`yyyymmdd_hhmmss.nctx`）が作成され、タブ名が `[未保存N]` から `[yyyy/mm/dd hh:mm:ss]` に更新される。
  - ステータスバーに `[手動保存:Ctrl+S] yyyymmdd_hhmmss.nctx が作成されました` と表示される。
  - 内容が空（または空白のみ）の場合はファイル作成がスキップされ、不要な空ファイルが残らない。
- **2回目以降の手動保存（`tab.filePath` あり）**:
  - `save_text_file` により同一ファイルパスへ上書き保存され、ファイル名やタイムスタンプは維持される。
  - 新規ファイルが重複生成される不具合が完全に解消。
  - ステータスバーに `[手動保存:Ctrl+S] yyyymmdd_hhmmss.nctx (UTF-8) - 保存済み` と表示される。
- **外部ファイルの手動保存**:
  - 開いたファイル（`memo.txt` など）へ正しく上書き保存され、文字コードも維持される。
- **自動保存モード**:
  - 退行なく、従来通り自動保存および `Ctrl + S` が正常に動作する。
