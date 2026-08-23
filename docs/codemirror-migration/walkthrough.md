# CodeMirror (v6) 移行完了ウォークスルー (Walkthrough)

## 概要
NoCapEdit のエディタ基盤を従来の HTML `<textarea>` から **CodeMirror (v6)** へ完全移行いたしました。
事前策定した7段階の実装計画（Step 1 〜 Step 7）に基づき、各ステップでビルドおよび実機動作確認を行いながら安全かつ確実に移行を完了いたしました。

---

## ステップ別の実施内容と達成成果

### Step 1: Vite 環境構築 + ディレクトリ移動 (Ver 0.2.1)
- **ソース構成の分離**: `src/dist/` を `src/frontend/` に移動し、ソースコードとビルド出力を明確に分離。
- **Vite の導入**: 高速な ES Modules バンドルおよび開発サーバー環境を導入。
- **マルチページ対応**: `index.html` と `help.html` の両方をバンドル対象に設定。

### Step 2: CodeMirror 基本導入 (Ver 0.2.2)
- **エディタエンジンの置換**: `<textarea id="editor">` を `<div id="editor">` および CodeMirror の `EditorView` に置換。
- **管理モジュールの新設**: `src/frontend/js/ui/codemirror.js` を作成し、エディタ初期化・テキスト/メトリクス取得・選択制御・Undo履歴連動 API を実装。
- **日本語IMEインライン入力修正**: `drawSelection` / `dropCursor` 拡張の導入および入力中の不要なタブ全再描画を抑制し、日本語IME変換候補のカーソル位置追従を正常化。

### Step 3: タブ管理（EditorState ごとの分離と独立 Undo） (Ver 0.2.3)
- **タブごとの EditorState 保持**: 各タブに CodeMirror の `EditorState` を直接保持させ、タブ切り替え時に `setEditorState()` で状態（ドキュメント内容、選択範囲、カーソル位置、Undo/Redo履歴）を丸ごと復元する設計に刷新。
- **独立した編集履歴**: タブ間で Undo/Redo 履歴が混ざる問題を完全解決。

### Step 4: 外観設定の連携（テーマ・フォント・行間・折り返し・ズーム） (Ver 0.2.4)
- **Compartment による動的設定制御**: `wrapCompartment`, `indentCompartment`, `themeCompartment` を導入し、エディタを破棄することなく折り返し（Word Wrap）やインデント幅を動的再設定可能に。
- **タブ固有の折り返し状態連動**: タブ切り替えおよび `Alt + Z` による折り返し設定をタブごとに完全保持・連動。
- **テーマ・フォント・ズーム連動**: CSS変数と CodeMirror テーマを統合し、テーマ変更や `Ctrl + +/-` ズームが即座に反映。

### Step 5: エディタ操作（インデント・行移動/複製/削除・日時挿入） (Ver 0.2.5)
- **コマンドシステム統合**: 行の上下移動（`Alt + ↑/↓`）、行複製（`Alt + Shift + ↑/↓`）、行削除（`Alt + Shift + K`）、インデント（`Tab` / `Shift + Tab`）を CodeMirror 6 標準コマンドシステムへ完全移行。
- **日時挿入（F5）のUndo連動**: `insertTimestampCommand` を新設し、タイムスタンプ挿入後も `Ctrl + Z` / `Ctrl + Y` と完全に連動。
- **旧実装の削除**: 旧 textarea 依存の行操作コードを完全削除。

### Step 6: 検索・置換（@codemirror/search の導入と独自UIの廃止） (Ver 0.2.6)
- **公式検索・置換エンジンの統合**: `@codemirror/search` を導入し、エディタ上部（`search({ top: true })`）に高機能な検索・置換パネルを統合。
- **選択単語ハイライト**: `highlightSelectionMatches` 拡張により、テキスト選択時に同一単語が自動で強調表示される機能を追加。
- **独自UIの完全撤去**: 旧 `findReplace.js`（約390行）および HTML/CSS の独自ウィジェットを完全削除し、コードベースを大幅にスリム化。

### Step 7: 最終クリーンアップ、全体動作検証 (Ver 0.2.7)
- 全モジュールのリファクタリング・未使用コードの撤去確認。
- `npm run build`、`cargo check`、`cargo build`、`cargo build --release` のすべてが正常に通ることを検証。

---

## 変更された主要ファイル一覧

| ファイル | 変更内容の概要 |
|---|---|
| `package.json` / `vite.config.js` | 新規作成。Vite ビルド環境および CodeMirror 依存関係の定義 |
| `src/frontend/js/ui/codemirror.js` | 新規作成。CodeMirror 6 のラッパー、Compartment、キーマップ、テーマ統合 |
| `src/frontend/index.html` | `<textarea>` および旧検索・バックドロップ要素の完全削除、div#editor への置換 |
| `src/frontend/style.css` | 旧検索・textarea スタイルの削除、CodeMirror エディタ・パネルスタイルの定義 |
| `src/frontend/js/ui/tabs.js` | `EditorState` ベースのタブ管理、独立 Undo/Redo、折り返し連動 |
| `src/frontend/js/ui/editor.js` | メトリクス算出・テキスト同期・ズーム制御の CodeMirror API 連携、旧コード削除 |
| `src/frontend/js/ui/settings.js` | Compartment / CodeMirror API 連携（フォント・行間・折り返し・インデント） |
| `src/frontend/js/ui/shortcuts.js` | エディタ専用キーの委託、グローバルショートカットの整理 |
| `src/frontend/js/core/fileSystem.js` | `createTabState` による外部ファイル読み込み・新規作成対応 |
| `src/frontend/js/state.js` | 旧検索・バックドロップ用 DOM キャッシュの削除 |
| `src/frontend/js/ui/findReplace.js` | **完全削除**（CodeMirror 組み込み検索へ一本化） |
| `docs/history.md` | v0.2系専用の改定履歴ファイルとして再構築・各Stepの履歴記録 |
| `docs/history_v0.1.md` | v0.1系の履歴をアーカイブ保存 |
| `docs/spec.md` | CodeMirror (v6), Vite 導入に伴う技術仕様の更新 |

---

## 検証結果まとめ

- [x] **Vite ビルド**: `npm run build` 正常終了（33 modules transformed, 出力エラーなし）
- [x] **Rust コンパイル**: `cargo check`, `cargo build` 正常終了
- [x] **Rust リリースビルド**: `cargo build --release` 正常終了
- [x] **日本語IME入力**: インライン入力・変換候補追従の正常動作確認済み
- [x] **タブ独立 Undo/Redo**: タブごとの編集履歴・カーソル位置復元の正常動作確認済み
- [x] **外観・ズーム連携**: テーマ切替、フォント/行間変更、ズーム（`Ctrl + +/-`）、折り返しトグル（`Alt + Z`）確認済み
- [x] **エディタ操作**: インデント（Tab/Shift+Tab）、行移動/複製/削除、日時挿入（F5）確認済み
- [x] **検索・置換**: `Ctrl + F`, `Ctrl + H`, `F3`, 選択単語ハイライト、置換実行・Undo連動確認済み
