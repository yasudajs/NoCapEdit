# タスクリスト: 文字列選択時のハイライト重複（二重表示）解消

- [x] 作業ブランチの作成 (`feature/fix-selection-overlap`)
- [x] ドキュメントの昇格 (`docs/wip/fix-selection-overlap/` -> `docs/fix-selection-overlap/`) とコミット・プッシュ
- [x] バージョン番号の更新 (`0.2.20` -> `0.2.21`, 4ファイル更新)
- [x] 仕様書 (`docs/spec.md`) の更新
- [ ] ソースコード修正
  - [ ] `src/frontend/js/ui/codemirror.js`: `baseTheme` 内の `::selection` 削除
  - [ ] `src/frontend/style.css`: `.editor .cm-editor ::selection` 削除
- [ ] 動作確認・検証
  - [ ] 文字列選択時の背景色が均一な1色（水色）になっていることを確認
  - [ ] 選択中単語と一致するキーワードが黄色ハイライトされる機能が維持されていることを確認
  - [ ] 各種テーマ（Light / Soft Dark / Dark）での表示確認
- [ ] 完了報告・ドキュメント更新
  - [ ] `docs/fix-selection-overlap/walkthrough.md` の作成
  - [ ] `docs/history.md` にバージョン `0.2.21` の変更履歴を追記
  - [ ] コミット＆プッシュ
