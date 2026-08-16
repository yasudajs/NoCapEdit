# タスクリスト: 行削除ショートカットキー変更 (Alt + Shift + K)

## フェーズ1: 計画と承認
- [x] ディスカッションと方針合意 (方針A: 完全移行)
- [x] 実装計画書の作成 (`docs/wip/shortcut_delete_line/implementation_plan.md`)
- [x] ユーザーによる実装計画の承認

## フェーズ2: 実装作業 (承認後)
- [x] 作業ブランチ `feature/shortcut-delete-line` の作成
- [x] ドキュメントフォルダ移動 (`docs/wip/shortcut_delete_line/` -> `docs/shortcut_delete_line/`)
- [x] バージョン更新 (0.1.86 -> 0.1.87)
  - [x] `Cargo.toml`
  - [x] `tauri.conf.json`
  - [x] `nsis/installer.nsi`
  - [x] `docs/DEVELOPMENT.md`
- [x] `docs/spec.md` および `docs/USER_GUIDE.md` の更新
- [x] コード実装
  - [x] `src/dist/js/ui/shortcuts.js` の修正
  - [x] `src/dist/help.html` の修正（Alt+Shift+Kへの変更、およびAlt+Zのテキスト編集最上段への配置移動）
- [x] 動作確認・検証
- [x] `docs/shortcut_delete_line/walkthrough.md` の作成
- [x] `docs/history.md` に v0.1.87 の変更履歴を追記
- [x] コミット & プッシュ
- [x] ユーザーへの完了報告
