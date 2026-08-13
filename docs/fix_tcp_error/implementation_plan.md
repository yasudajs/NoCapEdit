# TCP通信エラーハンドリングの修正計画

リファクタリングレビューで指摘された「6. TCP通信のエラーハンドリング」を修正します。
単一インスタンス動作（多重起動防止時）の別プロセスへのファイルパス送信ロジックにおいて、ソケットへの書き込みエラーが握りつぶされて常に成功扱いになっていた問題を解消します。

## User Review Required

以下の修正方針をご確認ください。

## Proposed Changes

### Rust Backend

#### [MODIFY] [instance.rs](file:///c:/work/NoCapEdit/src/instance.rs)
`send_to_existing_instance` 関数において、`write_all` の戻り値である `Result` を無視せず評価し、書き込みに成功したかどうかを正しく呼び出し元に返すように変更します。

```rust
pub fn send_to_existing_instance(path: &str) -> bool {
    if let Ok(mut stream) = TcpStream::connect(format!("{}:{}", SINGLE_INSTANCE_HOST, SINGLE_INSTANCE_PORT)) {
        stream.write_all(path.as_bytes()).is_ok()
    } else {
        false
    }
}
```

## Verification Plan

### Automated Tests
- `cargo check` を実行し、戻り値の型不一致やコンパイルエラーが発生しないことを確認します。

### Manual Verification
- すでにNoCapEditが起動している状態で、コマンドプロンプトから別のファイルパスを引数にして再度 `NoCapEdit.exe <ファイル名>` を起動し、既存のウィンドウで正しくそのファイルが開かれる（通信が成功する）ことを確認します。
