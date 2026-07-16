# v0.2系 タブ移動時のエディタインデント挿入不具合の修正タスクリスト

## ドキュメント整理
- [x] 実装開始時のドキュメント移動 (`docs/wip/v0.2_tab_interception_fix/` → `docs/v0.2_tab_interception_fix/`)

## 実装作業
- [x] [js/main.js](file:///c:/work/NoCapEdit/src/dist/js/main.js) の修正 (エディタの keydown イベントリスナーに Ctrl/Alt キーのガード条件を追加)

## 検証とリリース準備
- [x] 動作検証 (Ctrl+Tab 等のタブ切り替え時にエディタへTab文字が挿入されないことを確認)
- [x] 改定履歴 [docs/history.md](file:///c:/work/NoCapEdit/docs/history.md) の更新 (Ver 0.2.15)
- [x] 実装結果のコミット＆プッシュ
