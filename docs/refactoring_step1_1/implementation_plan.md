# [ステップ 1.1] 設定管理ロジックの抽出

## 目的
現在 `src/main.rs` に集中している設定管理ロジック（`AppSettings`, `SettingsResponse`, `load`, `save`, `config_path` などの実装およびデフォルト値設定）を新設する `src/settings.rs` に抽出し、バックエンドのモジュール化を進める。

## User Review Required
* モジュール化後のファイル構造および抽出対象に漏れや問題がないかご確認ください。
* 以下の設計方針（ディスカッションにて合意済み）に沿って実装します。
  1. `APP_DIR_NAME` などの基本定数は、設定ファイルパスの決定などに利用するため、`settings.rs` 内に定数（ハードコード）として管理する。
  2. テーマ等の「ユーザー設定の初期値」は、これまで通り `settings.rs` 内の初期値生成関数として残し、初回起動時に `config.json` へ書き出す。

## Proposed Changes

### Rust Backend
`src/main.rs` から設定管理関連のコードを分離し、`src/settings.rs` を新規作成します。

#### [NEW] [settings.rs](file:///c:/work/NoCapEdit/src/settings.rs)
* `AppSettings`, `SettingsResponse` 構造体の定義
* `AppSettings` の `impl` (`config_path`, `load`, `save`, `exists`)
* `impl Default for AppSettings`
* デフォルト値を生成する関数群（`default_theme`, `default_font_size` 等）
* `APP_DIR_NAME`, `HOME_DIR_NAME` などの関連定数（`pub const` として定義し、`main.rs` などから参照）

#### [MODIFY] [main.rs](file:///c:/work/NoCapEdit/src/main.rs)
* 上記構造体と関数群、定数の削除。
* ファイル先頭に `mod settings;` を追加。
* `settings::AppSettings` や `settings::APP_DIR_NAME` などを利用するように各処理（`get_settings`, `save_settings`, 定数参照箇所など）を修正。

### 設定・ドキュメント更新
* [MODIFY] [spec.md](file:///c:/work/NoCapEdit/docs/spec.md): 基本設定・振る舞いの管理元を `constants.rs` 等から `settings.rs` 等へ修正する。
* [MODIFY] 各種バージョン管理ファイル（`Cargo.toml`, `tauri.conf.json`, `nsis/installer.nsi`, `docs/DEVELOPMENT.md`）の内部バージョンを `0.1.49` に更新する。

## Verification Plan

### Automated Tests
* `cargo check` および `cargo build` を実行し、コンパイルエラーや警告が出ないことを確認する。

### Manual Verification
* アプリが正常に起動すること。
* 初回起動時（または設定ファイルが存在しない場合）に、正常にデフォルト設定が読み込まれ `config.json` が生成されること。
* フロントエンドから設定情報を正しく取得できること。
* 設定画面で変更を行った際、設定が保存されてアプリ・ファイルに反映されること。
