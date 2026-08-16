# タスク: Step 9 設定値のバリデーション（clamp）

## フェーズ 1: 計画と合意 <!-- id: 0 -->
- [x] レビュー指摘事項と対象コード（`src/settings.rs`）の確認 <!-- id: 1 -->
- [x] 実装計画書（`implementation_plan_step9.md`）の作成とユーザー合意 <!-- id: 2 -->

## フェーズ 2: 実装準備（ユーザー承認後） <!-- id: 3 -->
- [x] `docs/wip/refactor_step9/` を `docs/refactor_step9/` に移動・コミット <!-- id: 4 -->

## フェーズ 3: 実装作業 <!-- id: 5 -->
- [x] `src/settings.rs` の `AppSettings::load()` に `font_size` (8〜72) および `line_height` (1.0〜3.0) の `clamp` 処理を追加 <!-- id: 6 -->
- [x] `src/settings.rs` に範囲制限検証用の単体テストを追加 <!-- id: 7 -->

## フェーズ 4: 検証・報告 <!-- id: 8 -->
- [x] `cargo test` による単体テスト通過確認 <!-- id: 9 -->
- [x] `docs/refactor_step9/walkthrough.md` の作成 <!-- id: 10 -->
- [x] `docs/history.md` への変更履歴追記 <!-- id: 11 -->
- [x] コミット＆プッシュおよびユーザー確認 <!-- id: 12 -->
