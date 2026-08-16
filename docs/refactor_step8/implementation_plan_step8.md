# 実装計画書: Step 8 テストのRAIIパターン化（tempfile導入） (v0.1.93)

## 概要
`docs/wip/review_v0.1.87_to_v0.1.92.md` で指摘された 🔵参考 #2（テスト内での手動 `remove_dir_all` 処理）に対応し、`tempfile` クレートを導入して `TempDir` によるスコープ終了時自動クリーンアップ（RAIIパターン）に改修します。
※ Step 10 のファイル保存アトミック化でも `tempfile` を使用するため、`[dependencies]` に追加します。

---

## 修正内容

### 1. [MODIFY] [Cargo.toml](file:///c:/work/NoCapEdit/Cargo.toml)
`[dependencies]` に `tempfile = "3"` を追加します。

```diff
 dirs = "5.0"
 fontdb = "0.16"
+tempfile = "3"
```

### 2. [MODIFY] [commands.rs](file:///c:/work/NoCapEdit/src/commands.rs)
テストモジュール内で `tempfile::TempDir` を使用し、手動のディレクトリ作成・UUID生成・後始末削除コードを廃止します。

```diff
 #[cfg(test)]
 mod tests {
     use super::*;
     use std::fs::File;
+    use tempfile::TempDir;
 
     #[test]
     fn test_next_available_file_path_single_digit_sequence() {
-        let temp_dir = std::env::temp_dir().join(format!("nocapedit_test_{}", uuid::Uuid::new_v4()));
-        fs::create_dir_all(&temp_dir).unwrap();
+        let temp_dir = TempDir::new().unwrap();
+        let temp_path = temp_dir.path();
 
         let ts = "20260816_120000";
 
         // 1. 重複なし
-        let (name0, path0) = next_available_file_path(&temp_dir, ts).unwrap();
+        let (name0, path0) = next_available_file_path(temp_path, ts).unwrap();
         assert_eq!(name0, format!("{}.nctx", ts));
         File::create(&path0).unwrap();
 
         // 2. 1回目重複 -> _1
-        let (name1, path1) = next_available_file_path(&temp_dir, ts).unwrap();
+        let (name1, path1) = next_available_file_path(temp_path, ts).unwrap();
         assert_eq!(name1, format!("{}_1.nctx", ts));
         File::create(&path1).unwrap();
 
         // 3. 2〜9回目重複 -> _2 .. _9
         for i in 2..=9 {
-            let (name, path) = next_available_file_path(&temp_dir, ts).unwrap();
+            let (name, path) = next_available_file_path(temp_path, ts).unwrap();
             assert_eq!(name, format!("{}_{}.nctx", ts, i));
             File::create(&path).unwrap();
         }
 
         // 4. 10回目重複（上限超過） -> エラー
-        let err = next_available_file_path(&temp_dir, ts).unwrap_err();
+        let err = next_available_file_path(temp_path, ts).unwrap_err();
         assert_eq!(err, "fs.error.maxLimitReached");
-
-        // 後始末
-        let _ = fs::remove_dir_all(&temp_dir);
     }
 }
```

---

## バージョンについて
- 本リファクタリング（Step 1〜10）は同一バージョン（`0.1.93`）および同一作業ブランチ内で実施するため、バージョン番号の変更はありません。

---

## 検証計画
1. `cargo check` でコンパイルエラー・警告がないことを確認
2. `cargo test` でユニットテストが正常に通過することを確認
3. テストが失敗した場合でも、一時ディレクトリが確実に自動破棄されることを確認
