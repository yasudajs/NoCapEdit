# タスクリスト: 行削除ショートカットキー変更 (Alt + Shift + K)

## フェーズ1: 計画と承認
- [x] ディスカッションと方針合意 (方針A: 完全移行)
- [x] 実装計画書の作成 (`docs/wip/shortcut_delete_line/implementation_plan.md`)
- [ ] ユーザーによる実装計画の承認

## フェーズ2: 実装作業 (承認後)
- [ ] 作業ブランチ `feature/shortcut-delete-line` の作成
- [ ] ドキュメントフォルダ移動 (`docs/wip/shortcut_delete_line/` -> `docs/shortcut_delete_line/`)
- [ ] バージョン更新 (0.1.86 -> 0.1.87)
  - [ ] `Cargo.toml`
  - [ ] `tauri.conf.json`
  - [ ] `nsis/installer.nsi`
  - [ ] `docs/DEVELOPMENT.md`
- [ ] `docs/spec.md` および `docs/USER_GUIDE.md` の更新
- [ ] コード実装
  - [ ] `src/dist/js/ui/shortcuts.js` の修正
  - [ ] `src/dist/help.html` の修正
- [ ] 動作確認・検証
- [ ] `docs/shortcut_delete_line/walkthrough.md` の作成
- [ ] `docs/history.md` に v0.1.87 の変更履歴を追記
- [ ] コミット & プッシュ
- [ ] ユーザーへの完了報告
