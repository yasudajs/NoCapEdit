# CLIとコマンドのロジック重複の修正計画

リファクタリングレビューで指摘された「2. CLIとコマンドのロジック重複」を修正します。
コマンドライン引数からのファイルパス取得処理が `cli.rs` と `commands.rs` で重複しており、かつ `commands.rs` 側では相対パスの絶対パス解決が行われていない問題を解消します。

## User Review Required

以下の修正方針をご確認ください。

## Proposed Changes

### Rust Backend

#### [MODIFY] [commands.rs](file:///c:/work/NoCapEdit/src/commands.rs)
`get_launch_file` コマンドの内部実装を削除し、すでに絶対パス解決等のロジックが正しく実装されている `cli::parse_launch_file_arg` を呼び出すように変更します。

```rust
#[tauri::command]
pub fn get_launch_file() -> Option<String> {
    crate::cli::parse_launch_file_arg()
}
```

## Verification Plan

### Automated Tests
- `cargo check` を実行し、依存関係とコンパイルに問題がないことを確認します。

### Manual Verification
- コマンドプロンプト等から相対パス（例: `NoCapEdit.exe .\test.txt`）でアプリを起動し、正しく絶対パスとして解決され、ファイルが開かれることを確認します。
