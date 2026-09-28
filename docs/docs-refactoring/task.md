# ドキュメント整理・再編集 タスクリスト (task.md)

## 準備・ブランチ作成
- [x] 作業用ブランチ `feature/docs-refactoring` の作成
- [x] WIPドキュメントを `docs/wip/docs-refactoring/` から `docs/docs-refactoring/` へ移動・コミット＆プッシュ
- [ ] バージョン番号の更新（`0.2.21` → `0.2.22`）※5ファイル更新
  - [ ] `Cargo.toml`
  - [ ] `package.json`
  - [ ] `src-tauri/tauri.conf.json`
  - [ ] `nsis/installer.nsi`
  - [ ] `docs/DEVELOPMENT.md`

## ドキュメント整理・リファクタリング
- [ ] `docs/ARCHITECTURE.md` の改定
  - [ ] 目次・全体構造の整理
  - [ ] 設定値・定数の一元管理（ハイブリッドアプローチ）の追記
  - [ ] プロセス間通信（シングルインスタンス）連携フローの追記
  - [ ] ファイル関連付け（ProgID、SupportedTypes等）および専用アイコン設計の追記
- [ ] `docs/spec.md` の改定
  - [ ] 目次の再編と過密セクション（旧4.4）の分割（テキスト編集 / ファイル保存と安全保護 / ファイルオープンと安全ガード）
  - [ ] 項番の再採番（4.4〜4.11）
  - [ ] 内部アーキテクチャ詳細（定数管理、アイコンのピクセル仕様等）の ARCHITECTURE.md への委託・簡潔化
  - [ ] 矛盾・古い情報の解消（「5.1 将来の拡張候補」からの削除、相対パスリンク修正、ショートカット記述の整合）
- [ ] リンク・整合性・フォーマットの検証

## ドキュメント・履歴の作成
- [ ] `docs/docs-refactoring/walkthrough.md` の作成
- [ ] `docs/history.md` にバージョン `0.2.22` の変更履歴を追記
- [ ] コミット＆プッシュおよびユーザーへの完了報告
