# タスク：ファイル遅延作成（Deferred File Creation）

- [ ] Rustバックエンドの実装
  - [ ] `next_available_file_path` の引数に `timestamp` を追加し、タイムスタンプをフロントから受け取るよう修正
  - [ ] `create_and_save_file` コマンドを追加（指定したタイムスタンプでアトミックに新規作成＆保存）
  - [ ] `create_auto_file` コマンドを削除
  - [ ] `invoke_handler` に `create_and_save_file` を登録し、`create_auto_file` を削除
- [ ] フロントエンドの実装
  - [ ] `createNewTab` 内で、自動保存モードの場合でも `create_auto_file` を呼ばずに `filePath` を空、タイムスタンプのみを記録し `fileName` を `${timestamp}.nctx` に設定
  - [ ] タブオブジェクトの初期構造に `createdTimestamp` を追加
  - [ ] `saveTabIfDirty` で `!tab.filePath` かつ空文字列（`trim() === ''`）の場合は保存処理をスキップして `isDirty = false` にリセットする処理を追加
  - [ ] `saveTabIfDirty` で `!tab.filePath` の場合に `create_and_save_file` を呼び出すように変更
  - [ ] `shouldDeleteEmptyFile` で `!tab.filePath` の場合は削除不要として `false` を返す処理を追加
  - [ ] `openExistingFile` などの既存ファイル読み込み時、タブオブジェクトに `createdTimestamp: ""` を付加して構造を統一
- [ ] 動作確認（ビルド・テスト）
  - [ ] `cargo build` が成功することを確認
- [ ] 実装完了後のドキュメントクリーンアップ
  - [ ] `docs/deferred_file_creation/` フォルダを完全に削除する
