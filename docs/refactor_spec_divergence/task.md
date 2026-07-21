# 乖離修正 3-1: タスクリスト

- [x] `src/dist/i18n.js` の辞書に `status_ready_auto` と `status_ready_manual` を追加する
- [x] `src/dist/js/main.js` の `updateStatus('準備完了')` を、保存モードを判定して `t('...')` を呼び出す形に修正する
- [x] `src/dist/js/ui/settings.js` の2箇所の `updateStatus('準備完了')` も同様に修正する
- [x] `src/dist/js/ui/tabs.js` の `updateStatus('保存準備完了')` のハードコーディングも同様に修正する
- [x] ビルドを実行し、保存モード切替時にステータスバーの表示が正しく切り替わるか検証する
