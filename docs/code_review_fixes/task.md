# タスクリスト: コードレビュー指摘事項の修正・改善 (v2.13.2)

## フェーズ1: 実装計画の作成
- [x] コードレビュー結果（全16項目）の精査と修正対象の合意
- [x] ステップ分割型の実装計画書（`implementation_plan.md`）およびタスクリスト（`task.md`）の作成

## フェーズ2: 実装作業の開始・準備
- [x] `master` ブランチから作業用ブランチ（`fix/code-review-v2.13.2`）を作成
- [x] ドキュメントを `docs/wip/code_review_fixes/` から `docs/code_review_fixes/` へ移動してコミット＆プッシュ
- [x] バージョン管理ファイル（5ファイル）を `2.13.2` に更新
- [x] `docs/spec.md` を最新版（v2.13.2 仕様）に更新

## ステップ1: インデントガイドの位置ズレ修正・全角スペース対応・CSS余白整理（#1, #7, #13, #6）
- [x] **#1 & #7**: `--cm-line-pad-left` CSS変数を導入し、行番号表示時のインデントガイド 16px ズレを修正＆余白の重複定義を整理（`style.css`, `codemirror.js`）
- [x] **#13**: `getLineIndentInfo` で全角スペース（`\u3000`）を2カラム幅として計算し、全角および半角・全角・タブ混在インデントのガイド表示に対応（`codemirror.js`）
- [x] **#6**: `initCodeMirror` 内の未使用変数 `hasLineNumbers` を削除（`codemirror.js`）
- [x] ステップ1の動作確認とコミット＆プッシュ

## ステップ2: ファイル種類に応じた自動インデントの改善（#4）
- [x] **#4**: `customInsertNewlineAndIndent` にて、テキストファイル等は前行空白を維持し、プログラミング言語では構文インデント（`getIndentation`）を適用するよう改善（`codemirror.js`）
- [x] ステップ2の動作確認とコミット＆プッシュ

## ステップ3: 「名前をつけて保存（Save As）」周りの安全性・排他制御強化（#2, #3, #8, #9, #10）
- [x] **#2**: `triggerManualSaveAs` でキャンセルされた際に自動保存タイマーを再スケジュール（`fileSystem.js`）
- [x] **#3**: `saveTabAs` で進行中の保存処理（`tab.savePromise`）の完了待機を追加（`fileSystem.js`）
- [x] **#9**: 別タブで開いているファイルと同じパスへの Save As をエラーダイアログでブロック（`fileSystem.js`, `i18n.js`）
- [x] **#10**: `Ctrl + Shift + S` 長押し・連打時の二重実行防止ガードを追加（`shortcuts.js`, `fileSystem.js`）
- [x] **#8**: 未使用の `FILE_EXT_NCMD` import および `fs.error.noSaveDialog` 翻訳キーを削除（`fileSystem.js`, `i18n.js`）
- [x] ステップ3の動作確認とコミット＆プッシュ

## ステップ4: Rust バックエンド（保存ダイアログ処理）の整理（#11）
- [ ] **#11**: `windows-sys` に `Win32_UI_WindowsAndMessaging` を追加し、`wake_up_mouse_cursor` の手書き FFI を置き換え＆ `tauri::async_runtime::spawn` に統一（`Cargo.toml`, `src/commands.rs`）
- [ ] ステップ4のビルド・テスト確認（`cargo test`）とコミット＆プッシュ

## ステップ5: NSIS インストーラーの関連付け処理改善（#14）
- [ ] **#14**: 上書きインストール時の旧 `NoCapEdit.Document`（`OpenWithProgids`）削除処理追加、および全47拡張子リストのマクロ共通化（`nsis/installer.nsi`）
- [ ] ステップ5の確認とコミット＆プッシュ

## フェーズ3: 最終検証・ドキュメント作成
- [ ] フロントエンド・バックエンドの全体ビルドおよび単体テスト検証
- [ ] ウォークスルー（`docs/code_review_fixes/walkthrough.md`）の作成
- [ ] 改定履歴（`docs/history.md`）への `Ver 2.13.2` 追記とコミット＆プッシュ
