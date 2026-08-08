# ウォークスルー: ステップ 1.3 Tauriコマンドハンドラの抽出

## 変更内容
1. **`src/commands.rs` の新規作成**
   - `main.rs` に定義されていた `get_settings`, `save_settings`, `create_and_save_file`, `read_text_file`, `save_text_file`, `delete_text_file`, `exit_app`, `get_launch_file`, `get_system_fonts`, `apply_theme`, `is_debug` の各Tauriコマンドハンドラを抽出しました。
   - それらが依存する `FileInfo`, `SystemFontInfo` 構造体、および `normalize_crlf`, `next_available_file_path` 関数も同時に移行しました。

2. **`src/main.rs` のリファクタリング**
   - 上記のハンドラ関数・構造体を削除し、新たに `mod commands;` を追加しました。
   - `tauri::generate_handler!` でのコマンド登録を、`commands::get_settings` などのようにモジュール経由で行うよう修正しました。
   - 使用しなくなったインポートを整理し、`FILE_EXTENSION` 定数を `pub const` にして `commands.rs` から参照できるようにしました。

3. **ドキュメント・バージョンの更新**
   - バージョン番号を `0.1.51` にインクリメントしました（`Cargo.toml`, `tauri.conf.json`, `installer.nsi`, `DEVELOPMENT.md`）。

## テスト・検証結果
* `cargo check` を実行し、モジュール分割に伴うコンパイルエラーや警告がないことを確認しました。

## ユーザーへの確認事項
* モジュールの切り出しとビルドチェックは完了しました。
* アプリの主要な機能（ファイルIO、設定適用、フォント読み込みなど）がこのハンドラ群に依存しています。
* お手数ですが、アプリを起動し、以下の基本動作に問題がないかご確認をお願いいたします。
  1. アプリが起動し、テーマやフォントなどの設定がUIに反映されていること
  2. 新規ファイルの作成、編集、保存ができること
  3. 既存のファイルを読み込んで表示できること
