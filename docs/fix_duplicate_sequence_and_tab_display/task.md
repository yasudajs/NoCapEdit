# タスクリスト：同名衝突連番の1桁化と保存モード別タブ名表示の統一

## フェーズ 1: 実装計画とディスカッション（現在）
- [x] 原因調査と仕様検討
- [x] 実装計画書（`implementation_plan.md`）の作成と提示
- [ ] ユーザーによる実装計画書の承認

---

## フェーズ 2: 実装作業（承認後に着手）
- [ ] 作業用ブランチの作成（`master` から派生）
- [ ] ドキュメントの移動（`docs/wip/fix_duplicate_sequence_and_tab_display/` → `docs/fix_duplicate_sequence_and_tab_display/`）
- [ ] バージョン番号の更新（`0.1.89` → `0.1.90`）
  - [ ] `Cargo.toml`
  - [ ] `tauri.conf.json`
  - [ ] `nsis/installer.nsi`
  - [ ] `docs/DEVELOPMENT.md`
- [ ] 仕様書（`docs/spec.md`）の更新
- [ ] バックエンド（Rust）の実装
  - [ ] `src/commands.rs`: `next_available_file_path` の連番フォーマットを `_1`〜`_9`、上限を 9（10回目でエラー）に変更
- [ ] フロントエンド（JavaScript）の実装
  - [ ] `src/dist/js/utils/helpers.js`: `AUTO_FILE_REGEX` を `_\d+`（1桁以上）に更新
  - [ ] `src/dist/js/ui/tabs.js`: `formatTabDisplayName` の正規表現および手動保存モード時の角括弧付与共通化
- [ ] 動作確認・検証
  - [ ] 外部から開いた `_1` 連番ファイルのタブ表示検証（手動保存時 `[日時-1]`、自動保存時 `日時-1`）
  - [ ] 外部から開いた一般ファイル（`aaaa.nctx`, `memo.txt`）のタブ表示検証（手動保存時 `[aaaa]`, `[memo]`、自動保存時 `aaaa`, `memo`）
  - [ ] 同秒ファイル衝突時の連番生成（`_1`〜`_9`）と上限エラーの検証
  - [ ] 設定画面でのモード切替時のタブ名動的更新検証
- [ ] ウォークスルー（`docs/fix_duplicate_sequence_and_tab_display/walkthrough.md`）の作成
- [ ] 変更履歴（`docs/history.md`）の追記
- [ ] コミット＆プッシュ
