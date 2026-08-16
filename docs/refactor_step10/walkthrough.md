# ウォークスルー: Step 10 ファイル保存のアトミック性改善 (v0.1.93)

## 概要
マスタープラン（`docs/wip/refactor_master_plan_to_v0.1.92.md`）の **Step 10** に基づき、`src/commands.rs` 内のファイル保存処理（`save_text_file` および `create_and_save_file`）を `tempfile::NamedTempFile` の `persist` によるアトミック保存・置換処理に改修しました。これにより、保存処理中の異常終了によるデータ消失リスクや固定 `.tmp` ファイル名の衝突リスクを排除しました。

---

## 変更内容

### 1. save_text_file のアトミック保存化
[`src/commands.rs`](file:///c:/work/NoCapEdit/src/commands.rs) において、従来の `fs::write` → `fs::remove_file` → `fs::rename` の2段階操作を廃止し、`NamedTempFile::new_in(parent)` と `persist` によるアトミック置換に改修しました。

```diff
 pub fn save_text_file(file_path: PathBuf, content: String) -> Result<(), String> {
     let parent = file_path
         .parent()
         .ok_or_else(|| "fs.error.invalidPath".to_string())?;
     fs::create_dir_all(parent).map_err(|e| e.to_string())?;
 
     let normalized = normalize_crlf(&content);
-    let tmp_path = file_path.with_extension("tmp");
-
-    fs::write(&tmp_path, normalized).map_err(|e| e.to_string())?;
-
-    if file_path.exists() {
-        fs::remove_file(&file_path).map_err(|e| e.to_string())?;
-    }
-    fs::rename(&tmp_path, &file_path).map_err(|e| e.to_string())?;
+    let mut tmp = NamedTempFile::new_in(parent).map_err(|e| e.to_string())?;
+    tmp.write_all(normalized.as_bytes()).map_err(|e| e.to_string())?;
+    tmp.persist(&file_path).map_err(|e| e.to_string())?;
 
     Ok(())
 }
```

### 2. create_and_save_file の安全化
[`src/commands.rs`](file:///c:/work/NoCapEdit/src/commands.rs) の新規ファイル保存処理も同様に `NamedTempFile` を用いて、エラー時に一時ファイルが確実に自動削除されるよう改修しました。

### 3. 単体テストの追加
[`src/commands.rs`](file:///c:/work/NoCapEdit/src/commands.rs) に、初回保存・既存ファイル上書き保存・CRLF正規化を検証する単体テスト `test_save_text_file_atomic_overwrite` を追加しました。

---

## 検証結果

### 自動テスト (Rust)
```bash
cargo test
```
- `test settings::tests::test_settings_clamp_ranges ... ok`
- `test commands::tests::test_next_available_file_path_single_digit_sequence ... ok`
- `test commands::tests::test_save_text_file_atomic_overwrite ... ok`
- 全 3 件のテストが正常通過。

### 差分確認
- `git diff src/commands.rs` にて意図通りのアトミック保存改修とテスト追加を確認。
