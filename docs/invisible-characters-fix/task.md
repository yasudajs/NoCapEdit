# 不可視文字プラグインの長い行描画例外修正 タスク一覧 (v2.11.1)

## フェーズ 1: 計画と合意（現在）
- [x] レビュー指摘の技術的分析と修正方針の策定
- [x] 実装計画書（`docs/wip/invisible-characters-fix/implementation_plan.md`）の作成
- [x] ユーザーによる実装計画書の承認および「作業開始」指示の受領

---

## フェーズ 2: 実装作業（作業開始指示後に実施）

### 1. 準備と環境設定
- [x] `master` ブランチから作業用ブランチ（`fix/invisible-characters-long-line`）を作成
- [x] ドキュメントを `docs/wip/invisible-characters-fix/` から `docs/invisible-characters-fix/` へ移動・コミット＆プッシュ
- [x] バージョン番号の更新（`v2.11.0` → `v2.11.1`: 5ファイルセット）
- [x] `docs/spec.md` のバージョン更新

### 2. ソースコード修正
- [x] `src/frontend/js/ui/codemirror.js`: `invisibleCharactersPlugin` の走査範囲を `[from, to]` に限定
- [x] `src/frontend/js/ui/codemirror.js`: `indentGuidesPlugin` の Widget 重複登録防止ガードを追加

### 3. ビルドおよび動作確認
- [x] `cargo test` によるテスト実行（全件パス確認）
- [x] `npm run build` によるフロントエンドビルド確認
- [x] 実機検証 パターン1: 折り返し OFF（`Alt + Z`）での 5,000 文字超長大行スクロールテスト（例外なし・不可視文字表示維持）
- [x] 実機検証 パターン2: 折り返し ON での 25,000 文字超長大行スクロールテスト（例外なし・描画維持）
- [x] 実機検証 パターン3: 長大行末尾カーソル配置・改行記号（`↵`）表示テスト
- [x] 実機検証 パターン4: インデントガイド（`Alt + I`）と不可視文字（`Alt + W`）の同時有効化テスト

### 4. 完了報告とクリーンアップ準備
- [x] `docs/invisible-characters-fix/walkthrough.md` の作成
- [x] `docs/history.md` に変更履歴（`v2.11.1`）を最上部に追記
- [x] 実装およびドキュメントのコミット＆プッシュ
- [ ] ユーザーへの完了報告とマージ・クリーンアップ指示待ち
