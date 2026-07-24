# タスクリスト - 空ディレクトリ判定のドットファイル除外ロジック修正

- [x] 作業用ブランチ `fix/empty-dir-dotfile-check` の作成
- [x] 内部バージョン番号の先行更新 (`0.2.36` -> `0.2.37`)
- [x] `docs/spec.md` の「空」の判定基準の更新
- [x] 実装計画書 (`implementation_plan.md`) およびタスクリスト (`task.md`) の作成
- [x] ユーザーによる実装計画書の確認・承認
- [x] `src/constants.rs` にOS自動生成メタデータのホワイトリスト定数を追加
- [x] `src/main.rs` 内 `is_dir_empty_custom` 関数の修正
- [x] `src/main.rs` 内 ユニットテスト `test_is_dir_empty_custom` の更新・拡充
- [x] `cargo test` によるテスト実行と動作検証（全テストクリア）
- [ ] テスト結果報告・ユーザーによる手動テスト/動作確認
- [ ] ユーザーの最終確認・完了承認
- [ ] `docs/history.md` への変更履歴追記
- [ ] 最終コミット＆プッシュおよびマージ指示の待機
