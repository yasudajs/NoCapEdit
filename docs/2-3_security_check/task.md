# タスクリスト: 2-3. セキュリティチェック（パストラバーサル防止）の共通化 (バックエンド)

## 準備フェーズ
- [x] 作業用ブランチ `feature/2-3-security-check` の作成
- [x] バージョン番号の先行更新（`0.2.38` -> `0.2.39`）
- [x] 実装計画書 (`implementation_plan.md`) の作成
- [x] ドキュメントの初版コミット＆プッシュ

## 実装フェーズ
- [ ] `src/error_messages.rs` の作成（エラー文字列定数の定義）
- [ ] `src/security.rs` の作成（`verify_safe_path`, `verify_safe_parent_path` の実装およびユニットテスト追加）
- [ ] `src/main.rs` の更新
  - [ ] `mod error_messages; mod security;` の追加
  - [ ] `read_directory` のセキュリティチェック置き換え
  - [ ] `create_file_or_dir` のセキュリティチェック置き換え
  - [ ] `rename_file_or_dir` のセキュリティチェック置き換え
  - [ ] `trash_file_or_dir` のセキュリティチェック置き換え
  - [ ] `delete_file_or_dir_permanently` のセキュリティチェック置き換え
  - [ ] `open_folder_in_explorer` のセキュリティチェック置き換え
  - [ ] `move_file_or_dir` のセキュリティチェック置き換え
  - [ ] `copy_file_or_dir` のセキュリティチェック置き換え

## 検証フェーズ
- [ ] バックエンドユニットテストの実行 (`cargo test`)
- [ ] ビルド確認 (`cargo check` / `cargo build`)
- [ ] ユーザー手動検証依頼（ツリーでの作成、リネーム、移動、コピー、削除の動作確認）
