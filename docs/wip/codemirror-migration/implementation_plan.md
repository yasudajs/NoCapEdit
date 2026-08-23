# CodeMirror (v6) 移行 実装計画書

## 概要

現在 `<textarea>` と標準のブラウザ機能に依存しているエディタ部分を、高機能なエディタライブラリである **CodeMirror (v6)** に置き換える。

これにより以下を実現する：
- タブごとの独立した Undo/Redo 履歴の保持
- 数万行の巨大ファイルの高速描画（仮想スクロール）
- 今後の拡張（シンタックスハイライト、行番号表示など）の基盤整備
- `document.execCommand('insertText')` という非推奨APIへの依存の解消

## 対象ブランチ・バージョン

- **ベースブランチ**: `v0.2`（`master` から新規分岐済み）
- **作業ブランチ**: `feature/codemirror-v6`（実装開始時に `v0.2` から作成）
- **バージョン**: `0.2.0`（v0.2系の初回バージョン）

## 事前決定事項

ディスカッションにて以下の5項目を合意済み：

| # | 項目 | 決定内容 |
|---|---|---|
| 1 | ビルドツール | **Vite + npm を導入**する |
| 2 | ディレクトリ構成 | ソースを `src/frontend/` に移動、ビルド出力先を `src/dist/` とする |
| 3 | 検索・置換 | **CodeMirror 組み込み機能を使用**（既存独自 UI は廃止） |
| 4 | 移行の進め方 | **7ステップ構成**（各ステップで動作確認） |
| 5 | 機能の優先度 | 基本→タブ→外観→操作→検索→整理 の順 |

---

## 作業ステップ

### Step 1: Vite 環境構築 + ディレクトリ移動

エディタの中身には一切手を加えず、ビルド基盤のみを変更する。
既存機能がすべて今まで通り動くことを確認してから次ステップへ進む。

#### [NEW] `package.json`（プロジェクトルート）
- npm プロジェクトとして初期化
- 依存パッケージ: `vite`（devDependencies）
- scripts: `"dev"`, `"build"`, `"preview"` を定義

#### [NEW] `vite.config.js`（プロジェクトルート）
- `root`: `./src/frontend`（ソースディレクトリ）
- `build.outDir`: `../dist`（`src/frontend` からの相対パスで `src/dist` を指す）
- `build.emptyOutDir`: `true`
- `server.port`: Tauri の devPath に合わせたポート番号を設定

#### [NEW] `.gitignore` への追記
- `src/dist/` をビルド成果物として Git 管理対象外にする
- `node_modules/` を追加

#### ディレクトリ移動
- `src/dist/` 配下の全ファイル（HTML, CSS, JS, i18n.js, favicon 等）を `src/frontend/` に移動
- ファイルの中身は一切変更しない

#### [MODIFY] `tauri.conf.json`
- `build.beforeBuildCommand`: `npm run build` に変更
- `build.beforeDevCommand`: `npm run dev` に変更
- `build.devPath`: Vite 開発サーバーの URL（例: `http://localhost:1420`）に変更
- `build.distDir`: `./src/dist`（変更なし）

#### ✅ 確認項目
- `cargo tauri dev` でアプリが正常に起動する
- テキスト入力、ファイル保存/読み込み、タブ切り替え、設定変更がすべて動く
- `cargo tauri build` でビルドが成功する

---

### Step 2: CodeMirror 基本導入

`<textarea>` を CodeMirror の `EditorView` に置き換え、基本的なテキスト編集とファイル入出力を動作させる。

#### npm パッケージの追加
```
npm install codemirror @codemirror/state @codemirror/view @codemirror/commands @codemirror/language
```

#### [MODIFY] `src/frontend/index.html`
- `<textarea id="editor" class="editor"></textarea>` を `<div id="editor" class="editor"></div>` に変更
- `<div id="editorBackdrop">` と `<div id="editorHighlights">` を削除（検索ハイライト用の独自レイヤーは不要になる）
- 検索・置換ウィジェット（`<div id="findReplaceWidget">`）は Step 6 で削除するため、この時点では残す（ただし機能は無効化される）

#### [NEW] `src/frontend/js/ui/codemirror.js`
CodeMirror の初期化と管理を担当する新規モジュール：
- `EditorView` のインスタンス生成・管理
- 基本的な拡張（extensions）の設定:
  - `@codemirror/commands` の `defaultKeymap` と `historyKeymap`
  - `@codemirror/commands` の `history()`
  - プレースホルダー表示
- テキスト取得 API: `getContent()` → `view.state.doc.toString()`
- テキスト設定 API: `setContent(text)` → `view.dispatch` でドキュメント全体を置換
- 変更リスナー: `EditorView.updateListener` で変更を検知し、`onEditorInput` 相当の処理を呼び出す
- カーソル位置・選択範囲の取得 API

#### [MODIFY] `src/frontend/js/ui/editor.js`
- `elements.editor.value` を使用していた全箇所を、`codemirror.js` の API 経由に変更
- `elements.editor.selectionStart` / `selectionEnd` を CodeMirror の Selection API に変更
- `updateEditorMetrics()`: CodeMirror の状態から行番号・列・文字数を取得
- `syncCurrentEditorToState()`: CodeMirror からテキストを取得してタブ状態に反映
- `onEditorInput()`: CodeMirror の `updateListener` から呼び出される形に変更
- `applyEditorTextWithUndo()`: CodeMirror の `view.dispatch` ベースに全面書き換え（`document.execCommand` は不要に）
- Tab キー処理（`handleTabKey`）、行操作（`moveLine` 等）、日時挿入は **この時点ではコメントアウトまたは一時無効化**（Step 5 で対応）

#### [MODIFY] `src/frontend/js/state.js`
- `elements.editor` は `<div>` 要素を指すようになる（`EditorView` の親コンテナ）
- 検索関連の DOM 要素（`editorBackdrop`, `editorHighlights` 等）の参照を整理

#### [MODIFY] `src/frontend/js/main.js`
- エディタ初期化処理を CodeMirror の初期化に変更
- `elements.editor` への直接イベントリスナー（`input`, `keydown`, `click` 等）を削除し、CodeMirror のリスナーに置き換え

#### [MODIFY] `src/frontend/js/core/fileSystem.js`
- ファイル読み込み時のテキスト設定を CodeMirror API 経由に変更
- ファイル保存時のテキスト取得を CodeMirror API 経由に変更

#### ✅ 確認項目
- エディタ領域にテキストが入力できる
- Ctrl+Z / Ctrl+Y（Undo/Redo）が動作する
- ファイルの保存・読み込みが正常に動作する
- 自動保存が動作する（入力後3秒で保存）
- ステータスバーにカーソル位置（Ln, Col）と文字数が表示される

---

### Step 3: タブ管理

タブごとに CodeMirror の `EditorState` を保持し、タブ切り替え時に状態（テキスト、Undo 履歴、カーソル位置、スクロール位置）を丸ごと切り替える。

#### [MODIFY] `src/frontend/js/ui/tabs.js`
- タブオブジェクトの構造変更:
  - `content`（文字列）→ `editorState`（`EditorState` オブジェクト）を保持
  - `cursorState`（`selectionStart` / `selectionEnd` / `scrollTop`）は `EditorState` に含まれるため削除
- `switchTab()`:
  - 現在のタブの `EditorState` を `view.state` から取得して保存
  - 新しいタブの `EditorState` を `view.setState()` で復元
  - `elements.editor.value` への代入を廃止
- `createNewTab()`:
  - 初期状態の `EditorState` を生成して保持
- `closeTab()`:
  - タブ削除時のテキスト同期を CodeMirror 経由に変更

#### [MODIFY] `src/frontend/js/ui/codemirror.js`
- `getEditorState()` / `setEditorState(state)` API の追加
- 新規タブ用の初期 `EditorState` 生成関数

#### [MODIFY] `src/frontend/js/ui/editor.js`
- `syncCurrentEditorToState()`: `EditorState` からテキストを取得する方式に変更
  （ただしファイル保存時には `view.state.doc.toString()` でテキストを取得）

#### [MODIFY] `src/frontend/js/core/fileSystem.js`
- ファイル保存時: `tab.content` の代わりに `tab.editorState.doc.toString()` からテキスト取得
- ファイル読み込み時: テキストを含む `EditorState` を生成してタブに設定

#### ✅ 確認項目
- 新規タブが作成できる
- タブ A で編集 → タブ B に切り替え → タブ A に戻ったとき、テキストが保持されている
- タブ A で Undo 操作が、タブ A 固有の編集履歴に基づいて動作する（タブ B の操作に影響されない）
- タブ切り替え時にカーソル位置とスクロール位置が復元される
- タブを閉じてもエラーが発生しない
- ファイルの保存・読み込みが引き続き正常に動作する

---

### Step 4: 外観設定の連携

テーマ・フォント・行間・折り返し・ズームの設定を CodeMirror の拡張（Extension）として適用する。
CodeMirror の Compartment（動的に差し替え可能な拡張スロット）を活用する。

#### [MODIFY] `src/frontend/js/ui/codemirror.js`
- 以下の Compartment を定義:
  - `themeCompartment`: テーマ（背景色、文字色、カーソル色、選択色 等）
  - `fontCompartment`: フォントファミリー・フォントサイズ
  - `lineHeightCompartment`: 行間
  - `wrapCompartment`: 折り返し（`EditorView.lineWrapping`）
- Compartment の動的更新 API を公開:
  - `updateTheme(themeName)`
  - `updateFont(family, size)`
  - `updateLineHeight(lh)`
  - `updateWrap(enable)`

#### [NEW] `src/frontend/js/ui/cmThemes.js`
CodeMirror 用のテーマ定義:
- `darkTheme`: 現在の CSS 変数（`--bg-primary`, `--text-primary` 等）から色を取得し、`EditorView.theme()` で定義
- `softDarkTheme`: ソフトダーク用テーマ
- `lightTheme`: ライト用テーマ
- 各テーマは既存の `style.css` のカラースキームと統一する

#### [MODIFY] `src/frontend/js/ui/editor.js`
- `applyFontSize()`: CSS 変数の設定に加え、CodeMirror の Compartment を更新
- `applyLineHeight()`: 同上
- `applyWordWrap()`: CodeMirror の `lineWrapping` 拡張を Compartment で切り替え
- `zoomIn()` / `zoomOut()` / `resetZoomAndLineHeight()`: Compartment の更新を呼び出す
- `toggleWordWrap()`: タブごとの折り返し状態を CodeMirror に反映

#### [MODIFY] `src/frontend/js/ui/theme.js`
- `applyThemeUI()`: CSS クラスの切り替えに加え、CodeMirror テーマの Compartment を更新

#### [MODIFY] `src/frontend/js/ui/settings.js`
- 設定変更時に CodeMirror の Compartment 更新 API を呼び出す

#### ✅ 確認項目
- ダーク / ソフトダーク / ライト のテーマ切り替えがエディタ領域に即座に反映される
- フォントファミリーの変更がエディタに反映される
- フォントサイズの変更（設定ダイアログ / Ctrl+/-）が反映される
- 行間の変更（設定ダイアログ / Ctrl+Shift+/-）が反映される
- 折り返し ON/OFF（設定ダイアログ / Alt+Z）が反映される
- Ctrl+0 でフォントサイズ・行間がリセットされる

---

### Step 5: エディタ操作

既存のエディタ操作機能を CodeMirror のコマンドシステムに置き換える。
CodeMirror 標準コマンドが利用可能なものはそれを使い、標準にないものはカスタムコマンドを登録する。

#### [MODIFY] `src/frontend/js/ui/codemirror.js`
- キーマップ拡張の追加:
  - `Tab` → `indentMore`（`@codemirror/commands`）
  - `Shift-Tab` → `indentLess`（`@codemirror/commands`）
  - `Alt-ArrowUp` → `moveLineUp`（`@codemirror/commands`）
  - `Alt-ArrowDown` → `moveLineDown`（`@codemirror/commands`）
  - `Shift-Alt-ArrowUp` → `copyLineUp`（`@codemirror/commands`）
  - `Shift-Alt-ArrowDown` → `copyLineDown`（`@codemirror/commands`）
  - `Shift-Alt-k` → `deleteLine`（カスタムコマンドまたは `@codemirror/commands`）
  - `F5` → `insertTimestamp`（カスタムコマンド）
- Tab キーの Compartment: 設定の `tabBehavior`（tab / space2 / space4）に応じて `indentUnit` 拡張を動的に更新

#### [MODIFY] `src/frontend/js/ui/editor.js`
- Step 2 でコメントアウト/無効化していた関数を削除または CodeMirror コマンド呼び出しに置き換え:
  - `handleTabKey()`: 削除（CodeMirror のキーマップで対応）
  - `moveLine()`: 削除（CodeMirror コマンドで対応）
  - `duplicateLine()`: 削除（CodeMirror コマンドで対応）
  - `deleteLine()`: 削除（CodeMirror コマンドで対応）
  - `insertTimestamp()`: CodeMirror の `view.dispatch` で挿入するカスタムコマンドに書き換え
  - `applyEditorTextWithUndo()`: CodeMirror 移行により不要になった場合は削除
  - `getIndentString()`: CodeMirror の `indentUnit` に委譲するため削除
  - `getSelectionLineBounds()`: CodeMirror API に置き換わるため削除

#### [MODIFY] `src/frontend/js/ui/shortcuts.js`
- CodeMirror のキーマップで処理するキー（Tab, Alt+↑↓ 等）をショートカット側から除外
- CodeMirror が処理しないグローバルショートカット（Ctrl+T, Ctrl+W, Ctrl+Q 等）はそのまま維持

#### ✅ 確認項目
- Tab キーで設定に応じたインデントが挿入される
- Shift+Tab でアンインデントされる
- Alt+↑↓ で行が移動する
- Shift+Alt+↑↓ で行が複製される
- Shift+Alt+K で行が削除される
- F5 で現在日時が挿入される
- Ctrl+Tab / Ctrl+Shift+Tab でタブ切り替えが動作する
- Ctrl+Z / Ctrl+Y が正常に動作する（インデント操作後も含む）
- 上記操作時に設定画面が開いている場合は、エディタ操作が干渉しない

---

### Step 6: 検索・置換

CodeMirror の `@codemirror/search` 拡張を導入し、既存の独自検索・置換 UI を廃止する。

#### npm パッケージの追加
```
npm install @codemirror/search
```

#### [MODIFY] `src/frontend/js/ui/codemirror.js`
- `@codemirror/search` の拡張を追加:
  - `search()`: 検索パネル
  - `searchKeymap`: 検索関連のキーマップ（Ctrl+F, Ctrl+H 等）
  - `highlightSelectionMatches()`: 選択テキストのハイライト

#### [DELETE] `src/frontend/js/ui/findReplace.js`
- 独自検索・置換モジュールを完全削除

#### [MODIFY] `src/frontend/index.html`
- 検索・置換ウィジェットの HTML（`<div id="findReplaceWidget">` ブロック全体）を削除

#### [MODIFY] `src/frontend/style.css`
- 検索・置換関連の CSS（`.find-replace-widget`, `.search-match` 等）を削除
- CodeMirror の検索パネルに対するテーマ整合用のスタイルを追加

#### [MODIFY] `src/frontend/js/state.js`
- 検索関連の DOM 要素キャッシュ（`findReplaceWidget`, `findInput`, `matchCaseBtn`, `findMatchCount`, `findPrevBtn`, `findNextBtn`, `closeFindBtn`, `replaceRow`, `replaceInput`, `replaceOneBtn`, `replaceAllBtn`）を削除

#### [MODIFY] `src/frontend/js/ui/shortcuts.js`
- 検索関連のショートカット（Ctrl+F, Ctrl+H）を削除（CodeMirror のキーマップが処理）
- `isFindWidgetOpen` のインポートと Esc キー処理を削除

#### [MODIFY] `src/frontend/js/main.js`
- `setupFindReplaceEvents()` の呼び出しを削除
- `findReplace.js` のインポートを削除

#### ✅ 確認項目
- Ctrl+F で CodeMirror の検索パネルが表示される
- Ctrl+H で置換パネルが表示される
- 検索文字列のハイライトが動作する
- 次を検索 / 前を検索 が動作する
- 置換 / すべて置換 が動作する
- 大文字・小文字の区別オプションが動作する
- Esc で検索パネルが閉じ、エディタにフォーカスが戻る
- 検索パネルのスタイルがテーマ（ダーク / ソフトダーク / ライト）と統一されている

---

### Step 7: クリーンアップ・最終検証

不要になったコード・HTML 要素を削除し、全機能の統合テストを実施する。

#### クリーンアップ対象
- `src/frontend/js/ui/editor.js` から不要になった関数・ヘルパーの最終削除
  - textarea 固有のロジック（`wrap` 属性操作、`setSelectionRange` 等）
  - `applyEditorTextWithUndo()`（`document.execCommand` ベースの処理）
- `src/frontend/index.html` から不要な HTML 要素の削除
  - `editorBackdrop` / `editorHighlights`（Step 2 で削除済みだが最終確認）
- `src/frontend/style.css` から不要な CSS の削除
  - `.editor` の textarea 固有スタイル
  - `.editor-backdrop`, `.editor-highlights` 関連スタイル
  - `.word-wrap-off` クラス（CodeMirror の拡張で制御するため）
- `src/frontend/js/state.js` から不要な DOM 要素参照の最終整理
  - `editorBackdrop`, `editorHighlights` の削除

#### 最終検証項目（全機能統合テスト）
- **基本操作**: テキスト入力、Undo/Redo（Ctrl+Z/Y）
- **ファイル操作**: 新規作成、保存（自動・手動）、読み込み、別名保存
- **タブ操作**: 新規タブ（Ctrl+T）、タブ閉じる（Ctrl+W）、タブ切り替え（Ctrl+Tab）、タブごとの Undo 独立
- **外観設定**: テーマ切り替え、フォント変更、フォントサイズ変更、行間変更、折り返し切り替え
- **ズーム**: Ctrl+/- で拡大縮小、Ctrl+Shift+/- で行間変更、Ctrl+0 でリセット
- **エディタ操作**: Tab インデント / Shift+Tab アンインデント、行移動（Alt+↑↓）、行複製（Shift+Alt+↑↓）、行削除（Shift+Alt+K）、日時挿入（F5）
- **検索・置換**: Ctrl+F 検索、Ctrl+H 置換、ハイライト、次/前、置換/すべて置換
- **その他**: Ctrl+S 手動保存、Ctrl+Q 終了、Ctrl+E エクスプローラー、F1 ヘルプ、Ctrl+, 設定
- **エッジケース**: 空タブの保存動作、巨大テキスト（1万行以上）のパフォーマンス、全タブ閉じた際の動作

---

## 影響を受けるファイル一覧

### 新規作成
| ファイル | ステップ | 説明 |
|---|---|---|
| `package.json` | Step 1 | npm プロジェクト定義 |
| `vite.config.js` | Step 1 | Vite ビルド設定 |
| `src/frontend/js/ui/codemirror.js` | Step 2 | CodeMirror 初期化・管理 |
| `src/frontend/js/ui/cmThemes.js` | Step 4 | CodeMirror テーマ定義 |

### 変更
| ファイル | ステップ | 主な変更内容 |
|---|---|---|
| `.gitignore` | Step 1 | `src/dist/`, `node_modules/` を追加 |
| `tauri.conf.json` | Step 1 | ビルドコマンド・devPath の変更 |
| `index.html` | Step 2, 6 | textarea→div、検索UI削除 |
| `js/ui/editor.js` | Step 2-5, 7 | CodeMirror API への全面書き換え |
| `js/state.js` | Step 2, 6, 7 | DOM 要素参照の整理 |
| `js/main.js` | Step 2, 6 | 初期化処理・イベント登録の変更 |
| `js/core/fileSystem.js` | Step 2, 3 | テキスト取得/設定の API 変更 |
| `js/ui/tabs.js` | Step 3 | EditorState ベースのタブ管理 |
| `js/ui/theme.js` | Step 4 | CodeMirror テーマ連携 |
| `js/ui/settings.js` | Step 4 | Compartment 更新 API 呼び出し |
| `js/ui/shortcuts.js` | Step 5, 6 | CodeMirror キーマップとの役割分担 |
| `style.css` | Step 6, 7 | 不要スタイル削除、CM パネルスタイル追加 |

### 削除
| ファイル | ステップ | 理由 |
|---|---|---|
| `js/ui/findReplace.js` | Step 6 | CodeMirror の `@codemirror/search` で代替 |

### ディレクトリ移動（Step 1）
| 移動元 | 移動先 |
|---|---|
| `src/dist/*` | `src/frontend/*` |

---

## バージョン管理

実装開始時に以下の4ファイルのバージョンを `0.2.0` に更新する：

| ファイル | 更新箇所 |
|---|---|
| `Cargo.toml` | `version = "0.2.0"` |
| `tauri.conf.json` | `"version": "0.2.0"` |
| `nsis/installer.nsi` | `VERSION "0.2.0"` / `VERSIONWITHBUILD "0.2.0.0"` |
| `docs/DEVELOPMENT.md` | ZIP ファイル名中のバージョン文字列 |

---

## 作業量の見積もり

| ステップ | 見積もり | 備考 |
|---|---|---|
| Step 1 | 約 20〜30 分 | ファイル移動と設定変更のみ |
| Step 2 | 約 60〜90 分 | 最も変更量が多い中核作業 |
| Step 3 | 約 30〜45 分 | タブ管理のリファクタリング |
| Step 4 | 約 30〜45 分 | Compartment の設計と実装 |
| Step 5 | 約 20〜30 分 | 標準コマンドの活用で比較的軽量 |
| Step 6 | 約 15〜20 分 | 既存コードの削除が中心 |
| Step 7 | 約 20〜30 分 | クリーンアップと検証 |
| **合計** | **約 3〜5 時間** | 各ステップ間の確認時間を含む |
