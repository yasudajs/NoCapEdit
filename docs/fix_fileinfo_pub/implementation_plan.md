# `FileInfo` 構造体のアクセス修飾子修正計画

リファクタリングレビューで指摘された「9. `commands.rs` の `FileInfo` フィールドのアクセス修飾子」を修正します。
現状はフロントエンドへのデータ転送専用（SerdeによるJSONシリアライズ）として機能しているため問題は顕在化していませんが、データ転送オブジェクト（DTO）としての役割を明確にし、将来的なRustバックエンド内の他モジュールからの参照や生成を容易にするため、各フィールドを `pub` に変更します。

## User Review Required

以下の修正方針をご確認ください。

## Proposed Changes

### Rust Backend

#### [MODIFY] [commands.rs](file:///c:/work/NoCapEdit/src/commands.rs)
`FileInfo` 構造体の各フィールドに `pub` 修飾子を追加し、モジュール外からもアクセス可能な公開フィールドとします。

```diff
 #[derive(Debug, Serialize)]
 pub struct FileInfo {
-    file_name: String,
-    file_path: String,
+    pub file_name: String,
+    pub file_path: String,
 }
```

## Verification Plan

### Automated Tests
- `cargo check` を実行し、アクセス修飾子の変更に伴うコンパイルエラー（他箇所への影響）が発生しないことを確認します。

### Manual Verification
- 本修正はコンパイル時の構造体の可視性の変更のみであり、実行時の機能自体に変更はないため、コンパイルが通ることをもって検証完了とします。
