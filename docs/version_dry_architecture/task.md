# タスクリスト：バージョン情報の一元管理化（DRY化）

- [x] Cargo.toml のバージョンを 0.1.10 に更新
- [x] tauri.conf.json のバージョンを 0.1.10 に更新
- [x] main.rs の修正
  - [x] ウィンドウタイトル設定を `env!("CARGO_PKG_VERSION")` による動的生成に変更
  - [x] `SettingsResponse` 構造体および `get_settings` コマンドに `app_version` フィールドを追加
- [x] index.html の修正（静的なタイトルからバージョン表記を削除）
- [x] main.js の修正（`settings.app_version` から動的にタイトルを設定）
- [x] 動作確認と検証
  - [x] コンパイル・ビルドが正常に通ることを確認
  - [x] 起動後のウィンドウタイトルが `NoCapEdit [ Ver 0.1.10 ]` と表示されることを確認
