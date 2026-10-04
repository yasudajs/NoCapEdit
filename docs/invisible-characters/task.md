# 不可視文字の表示（空白・タブ・改行記号の可視化） 実装タスク一覧

## フェーズ 1: 計画と合意（現在）
- [x] 機能要件・デザイン（半角・全角・タブ・改行記号、ショートカットキー）のディスカッション
- [x] 実装計画書（`docs/wip/invisible-characters/implementation_plan.md`）の作成
- [x] ユーザーによる実装計画書の承認および「作業開始」指示の受領

---

## フェーズ 2: 実装作業（作業開始指示後に実施）

### 1. 準備と環境設定
- [x] `master` ブランチから作業用ブランチ（例: `feature/invisible-characters`）の作成
- [x] ドキュメントを `docs/wip/invisible-characters/` から `docs/invisible-characters/` へ移動・コミット＆プッシュ
- [x] バージョン番号の更新（`v2.10.3` → `v2.11.0`: 5ファイルセット）
- [x] `docs/spec.md` の更新

### 2. バックエンド（Rust）実装
- [x] `src/settings.rs` に `invisible_characters` 設定項目を追加
- [x] `src/settings.rs` に単体テストを追加し `cargo test` で検証

### 3. フロントエンド基本設定・状態管理
- [x] `src/frontend/i18n.js` に不可視文字表示関連の多言語テキストを定義
- [x] `src/frontend/js/state.js` に `invisibleCharacters` プロパティおよび要素キャッシュを追加
- [x] `src/frontend/index.html` に設定セレクトボックスを追加
- [x] `src/frontend/js/core/settingsManager.js` の保存処理に対応
- [x] `src/frontend/js/ui/settings.js` のダイアログ読み込み・保存・ナビゲーションに対応

### 4. CodeMirror 拡張・スタイル実装
- [x] `src/frontend/style.css` にテーマ変数 `--invisible-char-color` および各不可視文字スタイルを追加
- [x] `src/frontend/js/ui/codemirror.js` に `invisibleCharsCompartment`, `NewlineWidget`, `invisibleCharactersPlugin`, `updateInvisibleCharacters` を実装・統合

### 5. エディタ制御・タブ連携・ショートカット
- [x] `src/frontend/js/ui/editor.js` に `applyInvisibleCharacters`, `toggleInvisibleCharacters` を追加
- [x] `src/frontend/js/ui/tabs.js` でタブ個別の不可視文字状態の保持・復元を実装
- [x] `src/frontend/js/ui/shortcuts.js` に `Alt + W` ショートカット処理を追加

### 6. ヘルプ画面・ドキュメント更新
- [x] `src/frontend/help.html` に `Alt + W` を追加
- [x] `docs/SHORTCUTS.md` に `Alt + W` を追加
- [x] `docs/USER_GUIDE.md` に不可視文字表示機能の説明を追加

### 7. 検証・品質確認
- [x] `cargo test` によるテスト実行
- [x] フロントエンドビルド確認（`npm run build`）
- [x] 表示・挙動・テーマ切り替え・タブ切り替え等の動作確認

### 8. 完了報告とクリーンアップ準備
- [x] `docs/invisible-characters/walkthrough.md` の作成
- [x] `docs/history.md` に変更履歴（`v2.11.0`）を最上部に追記
- [x] 実装およびドキュメントのコミット＆プッシュ
- [ ] ユーザーへの完了報告とマージ・クリーンアップ指示待ち
