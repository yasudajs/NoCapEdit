# タスクリスト: 拡張子別ファイルアイコン機能の実装

## フェーズ 1: 実装計画の作成と合意
- [x] アイコンデザイン案の作成と検証（下部2段分バナースタイル、視認性シミュレーション）
- [x] 対象拡張子一覧とカラーリング定義の策定
- [x] 実装計画書（`implementation_plan.md`）の作成と提示
- [x] ユーザーからの実装計画書承認および「作業開始」指示の受領

## フェーズ 2: 実装作業の開始（※ユーザーの作業開始指示後）
- [x] Gitブランチ作成 (`feature/file-type-icons`)
- [x] 作業ドキュメントを `docs/wip/file-type-icons/` から `docs/file-type-icons/` へ移動・コミット
- [x] バージョン番号の更新（MINOR: `v2.12.1` -> `v2.13.0`）
  - [x] `Cargo.toml`
  - [x] `package.json`
  - [x] `tauri.conf.json`
  - [x] `nsis/installer.nsi`
  - [x] `docs/DEVELOPMENT.md`
- [x] `spec.md` の仕様更新
- [ ] アイコン自動生成スクリプトの作成（`scripts/generate_document_icons.py`）
- [ ] 全対応拡張子（47種）のマルチ解像度ICOおよびPNGアイコンの生成（`icons/documents/` 配下）
- [ ] NSISインストーラー（`nsis/installer.nsi`）の更新（各拡張子ごとのProgID、DefaultIcon、アンインストール処理の登録）
- [ ] WiX設定（`wix/file-association.wxs`）の更新
- [ ] 動作確認・検証（アイコン生成、解像度チェック、NSIS構文・ビルド確認）
- [ ] `docs/file-type-icons/walkthrough.md`（ウォークスルー）の作成
- [ ] `docs/history.md` に変更履歴を追記
- [ ] 実装・ドキュメントの最終コミット＆プッシュ
- [ ] ユーザーへの完了報告とクリーンアップ・マージ指示待ち
