# タスクリスト

- [x] `spec.md` の更新
- [ ] `src/dist/main.js` の修正
  - [ ] `updateStatus` 関数のシグネチャ拡張と接頭辞バイパス機能の追加
  - [ ] `updateTabStatus` ヘルパー関数の追加
  - [ ] 各イベントハンドラでのステータス表示呼び出しの差し替え（`createNewTab`, `switchTab`, `handleEditorInput`, `autoSave`, `triggerManualSave` など）
- [ ] 動作確認（手動検証）
  - [ ] 自動保存モードでの動作確認（新規タブ作成、初回自動保存、2回目以降の自動保存、編集中）
  - [ ] 手動保存モードでの動作確認（新規タブ作成、初回手動保存、2回目以降の手動保存、編集中）
  - [ ] 未保存タブと保存済みタブの切り替え時のステータス表示の確認
