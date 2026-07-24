# タスクリスト: エディタ要素上での標準コンテキストメニュー許可修正

## 準備・設計
- [x] ブランチ `feature/editor-contextmenu-fix` の作成
- [x] バージョン番号の更新 (0.2.35 -> 0.2.36)
- [x] `docs/contextmenu_fix/implementation_plan.md` および `task.md` の作成
- [x] `docs/spec.md` の更新

## 実装
- [x] `src/dist/js/main.js` の `contextmenu` リスナー修正 (`textarea` / `input` の例外許可)
- [x] `docs/DEVELOPMENT.md` のポータブルZIP作成スクリプト出力先を `target/release/bundle/` 配下に修正

## 検証
- [x] コンパイルチェック (`cargo check` & `cargo build --release`)
- [x] ポータブル版（リリースビルド）でのエディタ上右クリック表示確認
- [x] ポータブル版での他エリア右クリック非表示確認

## リリース準備・マージ
- [x] ユーザー手動テストの依頼と承認取得
- [x] `docs/history.md` に変更履歴追記
- [ ] クリーンアップ & `v0.2` ブランチへの `--no-ff` マージ
