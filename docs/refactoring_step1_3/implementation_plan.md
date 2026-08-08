# ステップ 1.3: Tauriコマンドハンドラの抽出

## 目的
`main.rs` に定義されている多数の `#[tauri::command]` ハンドラ関数（ファイルの読み書き、設定取得、フォント情報取得など）を `commands.rs` に抽出し、`main.rs` の責務をエントリーポイント（初期化・ウィンドウ構築）のみに特化させます。

## 提案する変更内容

### [NEW] `src/commands.rs`
以下の構造体、補助関数、および Tauri コマンドハンドラ関数を `main.rs` から移動し、モジュールとして定義します。コマンドハンドラは `main.rs` の `generate_handler!` マクロから参照可能にするため `pub` を付与します。
- **構造体**: `FileInfo`, `SystemFontInfo`
- **補助関数**: `normalize_crlf`, `next_available_file_path`
- **コマンドハンドラ**:
  - `get_settings`
  - `save_settings`
  - `create_and_save_file`
  - `read_text_file`
  - `save_text_file`
  - `delete_text_file`
  - `exit_app`
  - `get_launch_file`
  - `apply_theme`
  - `get_system_fonts`
  - `is_debug`

### [MODIFY] `src/main.rs`
- 21行目付近の定数 `FILE_EXTENSION` を `pub const FILE_EXTENSION` に変更し、`commands.rs` から `crate::FILE_EXTENSION` として参照できるようにします。
- ファイル先頭付近に `mod commands;` を追加します。
- `tauri::generate_handler!` 内の各コマンド指定を、`commands::get_settings`, `commands::save_settings` などのように `commands::` プレフィックスを付与する形に変更します。
- 該当の関数・構造体をすべて削除し、不要になったインポート（`std::fs`, `std::path::PathBuf`, `serde::Serialize` 等）を削除または整理します。

## 検証プラン
### 自動テスト
- `cargo check` を実行し、モジュール分割や `pub` 指定に関するコンパイルエラーが発生しないことを確認します。
### 手動検証
- アプリをビルド・起動し、UIと連携する以下の機能が正常に動作することを確認（ユーザーに依頼）します。
  1. アプリが起動し、テーマやフォントなどの設定がUIに反映されていること（`get_settings`, `apply_theme`）
  2. 新規ファイルの作成、編集、および保存ができること（`create_and_save_file`, `save_text_file`）
  3. 既存のファイルを読み込んで表示できること（`read_text_file`）
