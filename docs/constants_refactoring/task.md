# タスクリスト: 設定値・定数の一元管理 (`src/constants.rs` の導入)

## 準備・設計
- [x] ブランチ `feature/constants-refactoring` の作成
- [x] バージョン番号の更新 (0.2.34 -> 0.2.35)
- [x] `docs/constants_refactoring/implementation_plan.md` および `task.md` の作成
- [x] `docs/spec.md` の更新

## 実装
- [x] `src/constants.rs` の新規作成および定数の集約
- [x] `src/main.rs` の更新 (`mod constants;` 追加、定数参照への書き換え)

## 検証
- [x] コンパイルチェック (`cargo check` & `cargo build`)
- [x] アプリ起動・設定反映の動作確認
- [x] ファイルツリー表示・連番保存の手動テスト

## リリース準備・マージ
- [x] ユーザー手動テストの依頼と承認取得
- [x] `docs/history.md` に変更履歴追記
- [ ] クリーンアップ & `v0.2` ブランチへの `--no-ff` マージ
