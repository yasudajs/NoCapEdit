# タスクリスト: インデントガイド（インデント補助線）機能の実装

- [x] **フェーズ1: 実装計画の作成**
  - [x] 機能仕様・動作要件のディスカッション（デフォルト: 無効、ショートカット: `Alt + I`）
  - [x] 実装計画書（`implementation_plan.md`）の作成
  - [x] ユーザーによる実装計画書の承認

- [ ] **フェーズ2: 実装作業の開始（承認後）**
  - [x] `master` ブランチから作業用ブランチ（`feature/indent-guides`）を作成
  - [x] ドキュメントを `docs/wip/indent-guides/` から `docs/indent-guides/` へ移動・コミット＆プッシュ
  - [ ] バージョン番号の更新（`0.2.29` → `0.2.30`、5ファイル一括）
  - [ ] `spec.md` を最新版に更新
  - [ ] Rust側の設定拡張（`src/settings.rs`: `indent_guides` フィールド追加）
  - [ ] フロントエンド状態管理の更新（`state.js`, `settingsManager.js`）
  - [ ] 多言語対応（`i18n.js` に翻訳キー追加）
  - [ ] CodeMirror 6 インデントガイド拡張の実装（`codemirror.js`: プラグイン & Compartment）
  - [ ] エディタ連携・ショートカット実装（`editor.js`, `shortcuts.js` で `Alt + I` 対応）
  - [ ] 設定ドックUIの実装（`index.html`, `settings.js` にセレクトボックス追加）
  - [ ] 各テーマ向けスタイル定義（`style.css`: ガイド線の色・表示制御）
  - [ ] ヘルプ画面およびドキュメント更新（`help.html`, `SHORTCUTS.md`, `USER_GUIDE.md`）
  - [ ] 動作確認・検証（タブ/スペースインデント、空行、ズーム、テーマ切り替え、ショートカットトグル）
  - [ ] 作業結果報告（`walkthrough.md`）の作成
  - [ ] `history.md` にバージョン `0.2.30` の変更履歴を追記
  - [ ] 変更内容のコミット＆プッシュ
