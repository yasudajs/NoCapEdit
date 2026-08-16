# 実装計画書: Step 7 &PathBuf → &Path 引数型の慣用化 (v0.1.93)

## 概要
`docs/wip/review_v0.1.87_to_v0.1.92.md` で指摘された 🔵参考 #1（`commands.rs` 内の `next_available_file_path` 関数が引数型として `&PathBuf` を受け取っている）に対応し、Rust の慣用的な型である `&Path` に変更して関数の汎用性とシグネチャの適切さを向上させます。

---

## 修正内容

### [MODIFY] [commands.rs](file:///c:/work/NoCapEdit/src/commands.rs)

#### 1. インポートの追加とシグネチャ変更
`use std::path::{Path, PathBuf};` をインポートし、`next_available_file_path` の `home_folder` 引数の型を `&PathBuf` から `&Path` に変更します。

```diff
 use serde::Serialize;
 use std::fs;
-use std::path::PathBuf;
+use std::path::{Path, PathBuf};
 
 use crate::settings::{AppSettings, SettingsResponse};
 use crate::FILE_EXTENSION;
 
-fn next_available_file_path(home_folder: &PathBuf, timestamp: &str) -> Result<(String, PathBuf), String> {
+fn next_available_file_path(home_folder: &Path, timestamp: &str) -> Result<(String, PathBuf), String> {
```

※ RustのDeref型強制（Deref Coercion）により、`&PathBuf` を渡している既存の呼び出し元（L79、およびテストコード）は変更なしでそのまま動作します。

---

## バージョンについて
- 本リファクタリング（Step 1〜10）は同一バージョン（`0.1.93`）および同一作業ブランチ内で実施するため、バージョン番号の変更はありません。

---

## 検証計画
1. `cargo check` でコンパイルエラー・警告がないことを確認
2. `cargo test` で既存テスト（`test_next_available_file_path_single_digit_sequence`）が正常に通過することを確認
