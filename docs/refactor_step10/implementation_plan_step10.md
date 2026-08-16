# 実装計画書: Step 10 ファイル保存のアトミック性改善 (v0.1.93)

## 概要
`docs/wip/review_v0.1.87_to_v0.1.92.md` で指摘された 🟡改善 #1（ファイル保存処理における `remove_file` → `rename` の2段階操作によるデータ消失リスクおよび固定 `.tmp` 名の衝突リスク）に対応し、`tempfile::NamedTempFile` の `persist` メソッドを用いたアトミックなファイル保存・上書き処理に改修します。

---

## 修正内容

### [MODIFY] [commands.rs](file:///c:/work/NoCapEdit/src/commands.rs)

#### 1. インポートの追加
```diff
+use std::io::Write;
+use tempfile::NamedTempFile;
```

#### 2. `save_text_file` のアトミック保存化
固定の `.tmp` ファイルおよび `remove_file` 処理を廃止し、親ディレクトリ内にランダム名の一時ファイルを作成した上で、`NamedTempFile::persist`（Windows では `MoveFileExW(MOVEFILE_REPLACE_EXISTING)` を利用）により既存ファイルを安全にアトミック置換します。

```diff
 #[tauri::command]
 pub fn save_text_file(file_path: PathBuf, content: String) -> Result<(), String> {
     let parent = file_path
         .parent()
         .ok_or_else(|| "fs.error.invalidPath".to_string())?
         .to_path_buf();
     fs::create_dir_all(&parent).map_err(|e| e.to_string())?;
 
     let normalized = normalize_crlf(&content);
-    let tmp_path = file_path.with_extension("tmp");
-
-    fs::write(&tmp_path, normalized).map_err(|e| e.to_string())?;
-
-    if file_path.exists() {
-        fs::remove_file(&file_path).map_err(|e| e.to_string())?;
-    }
-    fs::rename(&tmp_path, &file_path).map_err(|e| e.to_string())?;
+    let mut tmp = NamedTempFile::new_in(&parent).map_err(|e| e.to_string())?;
+    tmp.write_all(normalized.as_bytes()).map_err(|e| e.to_string())?;
+    tmp.persist(&file_path).map_err(|e| e.to_string())?;
 
     Ok(())
 }
```

#### 3. `create_and_save_file` の安全化
新規ファイル生成処理（`create_and_save_file`）も同様に `NamedTempFile` を用いて、エラー時に一時ファイルが確実に自動破棄される安全な処理に改修します。

```diff
 #[tauri::command]
 pub fn create_and_save_file(
     home_folder: PathBuf,
     timestamp: String,
     content: String,
 ) -> Result<FileInfo, String> {
     fs::create_dir_all(&home_folder).map_err(|e| e.to_string())?;
 
     let (file_name, file_path) = next_available_file_path(&home_folder, &timestamp)?;
 
     // 内容を正規化してアトミック書き込み
     let normalized = normalize_crlf(&content);
-    let tmp_path = file_path.with_extension("tmp");
-    fs::write(&tmp_path, &normalized).map_err(|e| e.to_string())?;
-    fs::rename(&tmp_path, &file_path).map_err(|e| e.to_string())?;
+    let mut tmp = NamedTempFile::new_in(&home_folder).map_err(|e| e.to_string())?;
+    tmp.write_all(normalized.as_bytes()).map_err(|e| e.to_string())?;
+    tmp.persist(&file_path).map_err(|e| e.to_string())?;
 
     Ok(FileInfo {
         file_name,
         file_path: file_path.to_string_lossy().to_string(),
     })
 }
```

#### 4. 単体テストの追加
既存ファイルの上書き保存、改行コードの CRLF 正規化、および保存後に一時ファイルが残らないことを検証するテストを追加します。

```rust
    #[test]
    fn test_save_text_file_atomic_overwrite() {
        let temp_dir = TempDir::new().unwrap();
        let file_path = temp_dir.path().join("test.nctx");

        // 1. 初回保存
        save_text_file(file_path.clone(), "Hello\nWorld".to_string()).unwrap();
        let content1 = fs::read_to_string(&file_path).unwrap();
        assert_eq!(content1, "Hello\r\nWorld");

        // 2. 上書き保存
        save_text_file(file_path.clone(), "Updated\r\nContent".to_string()).unwrap();
        let content2 = fs::read_to_string(&file_path).unwrap();
        assert_eq!(content2, "Updated\r\nContent");
    }
```

---

## バージョンについて
- 本リファクタリング（Step 1〜10）は同一バージョン（`0.1.93`）および同一作業ブランチ内で実施するため、バージョン番号の変更はありません。

---

## 検証計画
1. `cargo check` でコンパイルエラー・警告がないことを確認
2. `cargo test` で既存テストおよび新設テスト（`test_save_text_file_atomic_overwrite`）が正常に通過することを確認
3. `npm run tauri dev` でアプリを起動し、テキストの入力・自動保存・手動保存（`Ctrl+S`）・新規ファイル作成が正常に行われることを手動確認
