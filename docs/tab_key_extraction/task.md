# タスクリスト: Tabキー処理の抽出 (Ver 0.2.40)

- [x] バージョン番号の先行更新 (`0.2.40`) <!-- id: 0 -->
  - [x] `Cargo.toml` の `version` 更新 <!-- id: 1 -->
  - [x] `tauri.conf.json` の `"version"` 更新 <!-- id: 2 -->
  - [x] `nsis/installer.nsi` の `VERSION` / `VERSIONWITHBUILD` 更新 <!-- id: 3 -->
  - [x] `docs/DEVELOPMENT.md` のバージョン文字列更新 <!-- id: 4 -->
- [ ] Tabキー処理の抽出と実装 <!-- id: 5 -->
  - [ ] `src/dist/js/ui/editor.js` に `getIndentString()` および `handleEditorTabKey(e)` を追加 <!-- id: 6 -->
  - [ ] `src/dist/js/main.js` から `handleEditorTabKey` を import して登録部分を1行に単純化 <!-- id: 7 -->
- [ ] ビルド確認および動作検証 <!-- id: 8 -->
- [ ] ユーザー手動テストの依頼 <!-- id: 9 -->
  - [ ] 単一行インデント（Tab）動作確認
  - [ ] 単一行アンインデント（Shift+Tab）動作確認
  - [ ] 複数行インデント動作確認
  - [ ] 複数行アンインデント動作確認
  - [ ] 「Tabキーの挙動」設定変更の反映確認
  - [ ] `Ctrl+Tab` ショートカットの干渉なし確認
  - [ ] 変更状態・ステータスバーの即時更新確認
