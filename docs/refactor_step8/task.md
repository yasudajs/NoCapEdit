# タスク: Step 8 テストのRAIIパターン化（tempfile導入）

## フェーズ 1: 計画と合意 <!-- id: 0 -->
- [x] レビュー指摘事項と対象コード（`Cargo.toml`, `src/commands.rs`）の確認 <!-- id: 1 -->
- [x] 実装計画書（`implementation_plan_step8.md`）の作成とユーザー合意 <!-- id: 2 -->

## フェーズ 2: 実装準備（ユーザー承認後） <!-- id: 3 -->
- [x] `docs/wip/refactor_step8/` を `docs/refactor_step8/` に移動・コミット <!-- id: 4 -->

## フェーズ 3: 実装作業 <!-- id: 5 -->
- [ ] `Cargo.toml` の `[dependencies]` に `tempfile = "3"` を追加 <!-- id: 6 -->
- [ ] `src/commands.rs` のユニットテストで `tempfile::TempDir` を利用し、手動削除を廃止（RAII自動クリーンアップ化） <!-- id: 7 -->

## フェーズ 4: 検証・報告 <!-- id: 8 -->
- [ ] `cargo check` および `cargo test` によるコンパイル・テスト検証 <!-- id: 9 -->
- [ ] `docs/refactor_step8/walkthrough.md` の作成 <!-- id: 10 -->
- [ ] `docs/history.md` への変更履歴追記 <!-- id: 11 -->
- [ ] コミット＆プッシュおよびユーザー確認 <!-- id: 12 -->
