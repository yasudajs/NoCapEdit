# タスクリスト: 「名前をつけて保存」機能の追加

## 準備フェーズ（ユーザー承認後）
- [x] 作業ブランチの作成 (`master` から作成)
- [x] ドキュメントの配置移動 (`docs/wip/save-as/` → `docs/save-as/`)
- [x] バージョン番号の更新（新機能追加のため MINOR アップデート: `v2.11.1` → `v2.12.0`）
  - [x] `Cargo.toml`
  - [x] `package.json`
  - [x] `tauri.conf.json`
  - [x] `nsis/installer.nsi`
  - [x] `docs/DEVELOPMENT.md`
- [x] 仕様書（`docs/spec.md`）の更新
- [x] ドキュメント更新コミット＆プッシュ

## 実装フェーズ
- [x] `src/frontend/i18n.js` に多言語テキストを追加
- [x] `src/frontend/js/core/fileSystem.js` の `saveTabAs` 改善および `triggerManualSaveAs` 関数の実装
- [x] `src/frontend/js/ui/shortcuts.js` に `Ctrl + Shift + S` のショートカットハンドラを追加
- [x] `src/frontend/help.html` にショートカット説明を追加
- [x] `docs/SHORTCUTS.md` の更新
- [x] 実装コミット＆プッシュ

## 検証・テストフェーズ
- [x] 新規未保存タブでの「名前をつけて保存」動作確認（初期フォルダ・初期ファイル名・拡張子変更）
- [x] 既存ファイルタブでの「名前をつけて保存」動作確認（元ファイルの保持・新ファイルへの追従）
- [x] 新規フォルダ作成および別ドライブへの保存確認
- [x] ダイアログキャンセル時の挙動確認
- [x] ショートカットヘルプ画面（`F1`）の表示確認
- [x] 自動テスト（`cargo test` / `npm run build`）の実行

## 完了報告フェーズ
- [x] `docs/save-as/walkthrough.md` の作成
- [x] `docs/history.md` にバージョン変更履歴を追記
- [x] 完了ドキュメントのコミット＆プッシュ
- [x] ユーザーへの作業完了報告

## 追加修正フェーズ: マウスカーソル最前面表示対策（ユーザー承認後）
- [ ] `src/commands.rs` に親ウィンドウ紐付け保存ダイアログコマンド `show_save_dialog` を実装
- [ ] `src/main.rs` に `show_save_dialog` コマンドを登録
- [ ] `src/frontend/js/core/fileSystem.js` で `show_save_dialog` を呼び出すように変更し、キーイベント消化の待機を追加
- [ ] ビルドおよびテストの実行（`cargo test`, `npm run build`）
- [ ] マウスカーソル表示およびダイアログ動作の検証
- [ ] ウォークスルー（`walkthrough.md`）および改定履歴（`history.md`）の更新
- [ ] 修正コミット＆プッシュ
