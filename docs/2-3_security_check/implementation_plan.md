# セキュリティチェック（パストラバーサル防止）の共通化 (バックエンド) 実装計画書

## 概要
バックエンド（`src/main.rs`）の複数のファイル操作コマンドで重複しているセキュリティチェック（操作対象パスが `home_folder` 配下に含まれるかのパストラバーサル防止検証）を、専用モジュール `src/security.rs` および `src/error_messages.rs` へ抽出し一元管理・共通化します。

---

## ユーザーレビュー事項
本実装計画は事前のディスカッションにおける以下の合意事項に基づいて作成されています：
- **検証関数の分離（案A）**: 既存パス検証用の `verify_safe_path` と、作成予定等の親ディレクトリ検証用の `verify_safe_parent_path` の2個の関数に明示的に分離します。
- **エラーメッセージの定数化**: `src/error_messages.rs` にエラー文字列定数を集約し、DRY原則を徹底します。
- **モジュール分離**: `src/security.rs` にセキュリティ検証関数を切り出し、`src/main.rs` の肥大化を防止します。

---

## 変更内容

### 1. [NEW] [error_messages.rs](file:///c:/work/NoCapEdit/src/error_messages.rs)
- ファイル操作やセキュリティチェックに関連するエラーメッセージ定数を定義します。
  - `ERR_UNAUTHORIZED_PATH`: "アクセスが許可されていないパスです"
  - `ERR_UNAUTHORIZED_DIR`: "アクセスが許可されていないディレクトリです"
  - `ERR_PARENT_NOT_FOUND`: "親ディレクトリが見つかりません"

### 2. [NEW] [security.rs](file:///c:/work/NoCapEdit/src/security.rs)
- パストラバーサル防止およびアクセス権限検証の共通ロジックを提供します。
  - `verify_safe_path(target_path: &Path, base_dir: &Path) -> Result<PathBuf, String>`:
    対象パスを `canonicalize` し、`base_dir`（`home_folder`）配下にあるか検証して正規化済み `PathBuf` を返します。
  - `verify_safe_parent_path(target_path: &Path, base_dir: &Path) -> Result<PathBuf, String>`:
    まだ存在しないファイル/ディレクトリ等の親ディレクトリを取得・正規化し、`base_dir` 配下にあるか検証して結合後の `PathBuf` を返します。
  - ユニットテスト (`#[cfg(test)]`) の実装。

### 3. [MODIFY] [main.rs](file:///c:/work/NoCapEdit/src/main.rs)
- `mod error_messages;` および `mod security;` を宣言。
- 以下の **8つの対象コマンド** 内の重複するパストラバーサル検証ロジックを `security::verify_safe_path` / `security::verify_safe_parent_path` の呼び出しへ置き換えてコードを整理します：
  1. `read_directory`
  2. `create_file_or_dir`
  3. `rename_file_or_dir`
  4. `trash_file_or_dir`
  5. `delete_file_or_dir_permanently`
  6. `open_folder_in_explorer`
  7. `move_file_or_dir`
  8. `copy_file_or_dir`

---

## 検証計画

### 自動テスト
- `src/security.rs` 内にパストラバーサル防止の各種パターン（正常系、親ディレクトリ参照 `..` による脱出試行系）のユニットテストを作成し、`cargo test` を実行して合格を確認します。
- `cargo check` および `cargo build` を実行し、コンパイルエラーや警告がないことを確認します。

### 手動検証
- タウリ起動 (`npm run tauri dev` またはビルド成果物) にて以下を確認：
  1. ディレクトリツリーの読み込み (`read_directory`) が正常に行えること。
  2. ツリー上でのファイル・フォルダの新規作成、リネーム、移動、コピー、削除がエラーなく動作すること。
