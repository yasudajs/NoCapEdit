# タスク: Step 10 ファイル保存のアトミック性改善

## フェーズ 1: 計画と合意 <!-- id: 0 -->
- [x] レビュー指摘事項と対象コード（`src/commands.rs`）の確認 <!-- id: 1 -->
- [x] 実装計画書（`implementation_plan_step10.md`）の作成とユーザー合意 <!-- id: 2 -->

## フェーズ 2: 実装準備（ユーザー承認後） <!-- id: 3 -->
- [x] `docs/wip/refactor_step10/` を `docs/refactor_step10/` に移動・コミット <!-- id: 4 -->

## フェーズ 3: 実装作業 <!-- id: 5 -->
- [x] `src/commands.rs` で `std::io::Write` および `tempfile::NamedTempFile` を利用 <!-- id: 6 -->
- [x] `save_text_file` を `NamedTempFile` の `persist` によるアトミック保存に改修 <!-- id: 7 -->
- [x] `create_and_save_file` も同様に `NamedTempFile` による安全な一時ファイル生成・永続化に改修 <!-- id: 8 -->
- [x] `src/commands.rs` にファイル保存および上書きの単体テストを追加 <!-- id: 9 -->

## フェーズ 4: 検証・報告 <!-- id: 10 -->
- [x] `cargo test` による全単体テスト通過確認 <!-- id: 11 -->
- [x] `npm run tauri dev` でアプリを起動し、新規ファイル作成・自動保存・手動保存の動作確認 <!-- id: 12 -->
- [x] `docs/refactor_step10/walkthrough.md` の作成 <!-- id: 13 -->
- [x] `docs/history.md` への変更履歴追記 <!-- id: 14 -->
- [x] コミット＆プッシュおよびユーザー確認 <!-- id: 15 -->
