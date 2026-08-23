# [実装計画] 検索・置換パネル UI の刷新（右上フロート2行レイアウトの復元）

## 1. 概要
CodeMirror 6 への移行時に仮導入されていたデフォルトの横長英語検索パネルを廃止し、Ver 0.1 系で採用されていた**右上フロート型・コンパクトな2行レイアウト（日本語対応・大文字区別Aa内包・件数表示・スムーズスクロール）**に刷新します。

---

## 2. UI 設計仕様

### 2.1 外観とレイアウト（Ver 0.1 系デザインの完全再現）
- **配置**: エディタ右上にフロート表示（`top: 10px; right: 20px;`）、角丸カード＋ドロップシャドウ
- **テーマ連動**: ダーク / ソフトダーク / ライトの各テーマ配色に完全対応
- **1行目（検索段）**:
  - `[検索入力欄  Aa]` （大文字/小文字区別の `Aa` トグルボタンを入力欄内に内包）
  - `0 / 0` （マッチ件数・現在位置表示。マッチなし時は赤色表示）
  - `▲` （前のマッチへ移動）
  - `▼` （次のマッチへ移動）
  - `✕` （閉じる）
- **2行目（置換段）**:
  - `[置換入力欄]`
  - `[置換]` ボタン
  - `[すべて置換]` ボタン

### 2.2 操作性とキーボードショートカット
- `Ctrl + F`: 検索パネルを開く（エディタでテキストを選択中の場合はその単語を初期セットし全選択フォーカス）
- `Ctrl + H`: 検索・置換パネルを開く（置換段を表示して展開）
- `Enter`: 次のマッチへ移動（`▼`）
- `Shift + Enter`: 前のマッチへ移動（`▲`）
- `Alt + C`: 大文字/小文字区別（`Aa`）の切り替え
- `Alt + A`: すべて置換
- `Esc`: パネルを閉じてエディタにフォーカスを復帰

---

## 3. 実装方針とモジュール構成

### 3.1 `findReplace.js` の新設 (`src/frontend/js/ui/findReplace.js`)
- 検索状態（クエリ、マッチ一覧、現在インデックス、大文字小文字フラグ）の管理
- CodeMirror 6 の `EditorView` と連携したマッチ検索とエディタ選択範囲の更新
- 単一置換（`replaceOne`）および一括置換（`replaceAll`）
  - CodeMirror の `editorView.dispatch({ changes: ... })` を使用し、**Undo/Redo 履歴を完全に保持**
- 検索マッチ位置への自動スクロール（`editorView.dispatch({ scrollIntoView: true })`）

### 3.2 `codemirror.js` の調整 (`src/frontend/js/ui/codemirror.js`)
- CodeMirror 6 デフォルトの検索パネル（`search({ top: true })`）のキーマップ干渉を解除
- カスタム検索ハイライトとの協調動作

### 3.3 HTML / CSS の配置 (`index.html`, `style.css`)
- `src/frontend/index.html` に `findReplaceWidget` の DOM 構造を追加
- `src/frontend/style.css` に Ver 0.1 系の洗練されたフロートカードスタイルを移植・最適化

### 3.4 多言語対応 (`src/frontend/i18n.js`)
- 検索・置換関連のプレースホルダー、ツールチップ、置換完了メッセージの翻訳定義を最新化

---

## 4. 変更対象ファイル

### [NEW] [findReplace.js](file:///c:/work/NoCapEdit/src/frontend/js/ui/findReplace.js)
- 検索・置換のロジック、イベントリスナー、DOM 連携をカプセル化した新規モジュール。

### [MODIFY] [index.html](file:///c:/work/NoCapEdit/src/frontend/index.html)
- 検索・置換ウィジェットの HTML 構造を追加。

### [MODIFY] [style.css](file:///c:/work/NoCapEdit/src/frontend/style.css)
- 検索・置換パネル、トグルボタン、マッチ件数表示等のスタイルを追加。

### [MODIFY] [codemirror.js](file:///c:/work/NoCapEdit/src/frontend/js/ui/codemirror.js)
- 検索パネルの重複起動防止と、テキスト置換・選択範囲操作 API の整備。

### [MODIFY] [shortcuts.js](file:///c:/work/NoCapEdit/src/frontend/js/ui/shortcuts.js)
- `Ctrl + F`, `Ctrl + H` をカスタム検索・置換パネルの開閉に接続。

### [MODIFY] [main.js](file:///c:/work/NoCapEdit/src/frontend/js/main.js)
- 起動時の `findReplace.js` 初期化呼び出しを追加。

### [MODIFY] [i18n.js](file:///c:/work/NoCapEdit/src/frontend/i18n.js)
- 検索・置換関連の翻訳キーを整備。

---

## 5. バージョン管理と履歴
- 内部バージョン: `0.2.10`
- `docs/history.md` に Ver 0.2.10 として記録

---

## 6. 検証計画

### 動作確認手順
1. `Ctrl + F` を押し、エディタ右上にコンパクトな検索パネルが表示されることを確認
2. テキストを入力し、リアルタイムに `1 / 5` などの件数が表示され、`Enter` / `Shift + Enter` で前後に移動できることを確認
3. `Aa` ボタン（`Alt + C`）で大文字・小文字の区別が切り替わることを確認
4. `Ctrl + H` を押し、2行目に置換入力欄と `置換` / `すべて置換` ボタンが表示されることを確認
5. 置換を実行し、正常にテキストが置き換わること、および `Ctrl + Z`（Undo）で一括で元に戻せることを確認
6. `Esc` または `✕` ボタンでパネルが閉じ、エディタに入力フォーカスが戻ることを確認
7. ダーク / ソフトダーク / ライトの各テーマでデザインが崩れないことを確認
