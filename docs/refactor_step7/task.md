# タスク: Step 7 &PathBuf → &Path 引数型の慣用化

## フェーズ 1: 計画と合意 <!-- id: 0 -->
- [x] レビュー指摘事項と対象コード（`src/commands.rs`）の確認 <!-- id: 1 -->
- [x] 実装計画書（`implementation_plan_step7.md`）の作成とユーザー合意 <!-- id: 2 -->

## フェーズ 2: 実装準備（ユーザー承認後） <!-- id: 3 -->
- [x] `docs/wip/refactor_step7/` を `docs/refactor_step7/` に移動・コミット <!-- id: 4 -->

## フェーズ 3: 実装作業 <!-- id: 5 -->
- [ ] `src/commands.rs` で `std::path::Path` をインポート <!-- id: 6 -->
- [ ] `next_available_file_path` の引数型を `&PathBuf` から `&Path` に変更 <!-- id: 7 -->

## フェーズ 4: 検証・報告 <!-- id: 8 -->
- [ ] `cargo check` および `cargo test` によるコンパイル・テスト検証 <!-- id: 9 -->
- [ ] `docs/refactor_step7/walkthrough.md` の作成 <!-- id: 10 -->
- [ ] `docs/history.md` への変更履歴追記 <!-- id: 11 -->
- [ ] コミット＆プッシュおよびユーザー確認 <!-- id: 12 -->
