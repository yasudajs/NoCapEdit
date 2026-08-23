# NoCapEdit 改定履歴 (Changelog) - v0.2系

NoCapEdit v0.2系のバージョンアップおよび仕様変更の履歴です。
新しいバージョンを上に記載しています。

> [!NOTE]
> Ver 0.1系の改定履歴については、[Ver 0.1系 改定履歴 (history_v0.1.md)](history_v0.1.md) を参照してください。

---

## 改定履歴一覧

### Ver 0.2.5 | 2026-08-23 | yasudajs
- **CodeMirror移行 Step 5: エディタ操作（インデント・行移動/複製/削除・日時挿入）**
  - **コマンドシステムへの統合**: 行の上下移動（`Alt + ↑/↓`）、行の複製（`Alt + Shift + ↑/↓`）、行の削除（`Alt + Shift + K`）、インデント（`Tab` / `Shift + Tab`）を CodeMirror 6 標準のコマンドシステム（`@codemirror/commands`）およびキーマップに完全移行
  - **日時挿入コマンド（F5）の実装**: `insertTimestampCommand` を新設し、現在日時（`YYYY/MM/DD HH:mm`）を CodeMirror のトランザクションとして挿入、Undo/Redo と完全連動
  - **旧実装のクリーンアップ**: 旧 textarea 依存の行操作処理（`moveLine`, `duplicateLine`, `deleteLine`, `handleTabKey`）を `editor.js` から完全削除し、グローバルショートカット側の二重定義も解消

---

### Ver 0.2.4 | 2026-08-23 | yasudajs
- **CodeMirror移行 Step 4: 外観設定の連携（テーマ・フォント・行間・折り返し・ズーム）**
  - **Compartment による動的設定制御**: `codemirror.js` に `wrapCompartment`, `indentCompartment`, `themeCompartment` を導入し、エディタを再構築することなく折り返し（Word Wrap）やインデント幅を瞬時に動的再設定できる構造を構築
  - **タブごとの折り返し状態の完全連動**: `tabs.js` のタブ切り替え処理と `applyWordWrap` を連動させ、タブ固有の折り返し設定（`Alt + Z` による切り替え含む）がタブ切り替え時に即座に反映されるよう改善
  - **CSS変数とCodeMirrorテーマの統合**: `style.css` の CSS 変数（フォントサイズ、行間、フォントファミリー、テーマ配色、選択ハイライト色）と CodeMirror のテーマ拡張を統合し、テーマ切り替えやズーム操作（`Ctrl + +/-`）が滑らかに連動
  - **設定画面との連携**: `settings.js` でのインデント設定・折り返し設定の変更が即座に CodeMirror に反映されるよう更新

---

### Ver 0.2.3 | 2026-08-23 | yasudajs
- **CodeMirror移行 Step 3: タブ管理（EditorState ごとの分離と独立 Undo）**
  - **タブごとの EditorState 保持**: 各タブオブジェクトに CodeMirror の `EditorState` を直接保持させ、タブ切り替え時に `setEditorState()` で状態（ドキュメント内容、選択範囲、カーソル位置、Undo/Redo履歴）を丸ごと復元する設計に刷新
  - **独立した Undo/Redo 履歴の実現**: タブ間で Undo/Redo 履歴が混ざる問題を完全に解決し、タブごとの完全独立した編集履歴管理を達成
  - **状態管理 API の拡充**: `codemirror.js` に `createTabState()`, `getEditorState()`, `setEditorState()` を追加し、新規タブ作成時・ファイル読み込み時・タブ切り替え時の状態生成フローを一本化
  - **タブ・ファイル操作との連携**: `tabs.js`, `fileSystem.js`, `editor.js` の状態同期ロジックを `EditorState` ベースに更新

---

### Ver 0.2.2 | 2026-08-23 | yasudajs
- **CodeMirror移行 Step 2: CodeMirror基本導入**
  - **エディタエンジンの置換**: HTMLの `<textarea>` を CodeMirror (v6) の `EditorView` に置き換え、高機能エディタ基盤を初期導入
  - **CodeMirror管理モジュールの新設**: `src/frontend/js/ui/codemirror.js` を作成し、インスタンス管理、テキスト取得・設定、メトリクス算出、選択範囲制御、Undo履歴連動 API を実装
  - **日本語IMEインライン入力の不具合修正**: `drawSelection` / `dropCursor` 拡張の追加および入力中の不要なタブ全再描画を抑制し、日本語IME変換候補のカーソル位置追従を正常化
  - **エディタUI連携の刷新**: `src/frontend/js/ui/editor.js` を CodeMirror API 連携に改修し、ステータスバーのカーソル位置（Ln, Col）・文字数カウントおよび自動保存タイマーとの接続を完了
  - **タブ・設定・検索連携の改修**: `tabs.js`, `settings.js`, `findReplace.js` 内のエディタ直接参照を CodeMirror API 経由に更新し、フォーカス復元やテキスト同期の整合性を確保
  - **エディタスタイルの整備**: `style.css` に CodeMirror 用のレイアウト・フォント・カーソル・選択色スタイルを定義し、既存UIデザインと統合

---

### Ver 0.2.1 | 2026-08-23 | yasudajs
- **CodeMirror移行 Step 1: Vite環境構築とディレクトリ移動**
  - **フロントエンドソースの移動**: 従来の `src/dist/` 配下のソースコード全般を `src/frontend/` に移動し、ソースとビルド成果物の分離を実施
  - **ビルドツール（Vite）の導入**: プロジェクトルートに `package.json` および `vite.config.js` を新規作成し、Vite による高速なバンドル・開発サーバー環境を構築
  - **Tauri連携設定の更新**: `tauri.conf.json` の `beforeBuildCommand` を `npm run build`、`beforeDevCommand` を `npm run dev`、`devPath` を `http://localhost:1420` に更新
  - **マルチページビルド対応**: `vite.config.js` にて `index.html` および `help.html` の両方をバンドル対象に設定
  - **Git管理対象の最適化**: `.gitignore` にビルド成果物（`/src/dist/`）および npm 依存関係（`/node_modules/`）を追加

---

### Ver 0.2.0 | 2026-08-23 | yasudajs
- **v0.2系開発開始・事前準備**
  - **ベースブランチの整備**: `master` よりクリーンな `v0.2` ブランチを再作成し、旧v0.2ブランチを `archive/v0.2-sidebar-explorer` にアーカイブ退避
  - **CodeMirror (v6) 移行計画の策定**: 事前ディスカッションに基づき、Vite導入・ディレクトリ構成・検索置換方針・7ステップ構成・機能優先度を定めた実装計画書（`docs/codemirror-migration/implementation_plan.md`）を作成
  - **仕様書の更新**: `docs/spec.md` の対象バージョンを0.2.x系に更新し、開発技術（Vite, CodeMirror）および検索・置換の仕様改定を反映
  - **内部バージョンの更新**: バージョン管理4ファイル（`Cargo.toml` 等）を `0.2.0` に更新
