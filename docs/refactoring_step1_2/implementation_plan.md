# ステップ 1.2: 単一インスタンス制御ロジックの抽出

## 目的
`main.rs` に混在している単一ウィンドウ動作（TCP通信を用いた多重起動防止や、既存インスタンスへのファイルパス受け渡し）の制御ロジックを `instance.rs` に分離・モジュール化し、`main.rs` の責務を削減します。



## 提案する変更内容

### [NEW] `src/instance.rs`
以下の定数・関数を `main.rs` から移動し、モジュールとして定義します。
- **定数**: `SINGLE_INSTANCE_PORT`, `SINGLE_INSTANCE_HOST`
- **関数**:
  - `pub fn send_to_existing_instance(path: &str) -> bool`
  - `pub fn start_instance_listener(app_handle: tauri::AppHandle)`
- **新規関数**: `pub fn check_primary_or_forward(file_arg: Option<&String>) -> bool`
  - ポートバインドを試みてプライマリかどうかを判定し、既存インスタンスがある場合はパスを送信して `false` を返し、自身がプライマリの場合は `true` を返す関数。

### [MODIFY] `src/main.rs`
- ファイル先頭に `mod instance;` を追加します。
- 上記に該当する既存の定数・関数を削除します。
- `main` 関数内の重複起動判定処理を以下のように簡略化します。
  ```rust
  if !instance::check_primary_or_forward(file_arg.as_ref()) {
      std::process::exit(0);
  }
  ```
- `tauri::Builder::default().setup(...)` 内のリスナー起動を `instance::start_instance_listener(app_handle);` に書き換えます。
- 依存しなくなる以下のインポートを削除します。
  - `std::io::{Read, Write}`
  - `std::net::{TcpListener, TcpStream}`
  - `std::thread`

## 検証プラン
### 自動テスト
- `cargo check` を実行し、モジュール分割によるコンパイルエラーや不要なインポートの警告が出ないことを確認します。
### 手動検証
- アプリをビルド・起動し、以下の動作に影響がないことを確認（ユーザーに依頼）します。
  1. 通常通り起動できること。
  2. 起動中に別のターミナルから `cargo run -- "適当なファイルパス"` などを実行した際、既存のウィンドウが最前面にフォーカスされ、新しいタブ（またはファイル）が開かれること。
  3. 重複して複数のウィンドウが起動しないこと。
