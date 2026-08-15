# ウォークスルー: 検索・置換（Find & Replace）機能

## 概要
エディタ内の文字列を素早く検索・置換できる **「検索・置換バー（フロートUI）」** を実装しました。
`Ctrl + F`（検索）/ `Ctrl + H`（置換）での素早い呼び出し、1件置換・一括置換（すべて置換）、大文字小文字の区別切り替え、および Undo/Redo（`Ctrl + Z`）との完全連動を実現しています。

---

## 変更内容

### 1. UI構造とスタイル
- **[index.html](file:///c:/work/NoCapEdit/src/dist/index.html)**
  - エディタコンテナ内に `#findReplaceWidget` を追加（検索行・置換行）。
- **[style.css](file:///c:/work/NoCapEdit/src/dist/style.css)**
  - エディタ右上にフロート表示されるモダンでコンパクトなパネルスタイルを定義。
  - 各テーマ（Dark / Soft Dark / Light）に自動適応し、`:focus-visible` による明瞭なキーボード操作ガイドを提供。

### 2. 検索・置換モジュール
- **[findReplace.js](file:///c:/work/NoCapEdit/src/dist/js/ui/findReplace.js)** [NEW]
  - `openFind(focusReplace)`: バーの展開、テキスト選択時の自動キーワード入力、フォーカス制御。
  - `closeFind()`: バーを閉じ、エディタの直前カーソル位置へフォーカス復帰。
  - `findNext()` / `findPrev()`: 一致箇所の探索、選択ハイライト、スクロール、件数表示（例: `3 / 12`）。
  - `replaceOne()`: 現在の一致箇所の置換（`applyEditorTextWithUndo` 経由）および次の一致へ自動ジャンプ。
  - `replaceAll()`: 全一致箇所の一括置換（1回のUndoで復元可能）およびステータス通知。
  - `toggleMatchCase()`: 大文字・小文字の区別切り替え（`[ Aa ]` ボタン / `Alt + C`）。
  - キーボードナビゲーション（`Tab` / `Shift + Tab`、検索欄での `Enter` / `Shift + Enter`、置換欄での `Enter`、`Alt + A`、`Esc`）。

### 3. エディタ連携・ショートカット
- **[editor.js](file:///c:/work/NoCapEdit/src/dist/js/ui/editor.js)**: `applyEditorTextWithUndo` を export して外部モジュールから利用可能に。
- **[shortcuts.js](file:///c:/work/NoCapEdit/src/dist/js/ui/shortcuts.js)**:
  - `Ctrl + F`: 検索バーを開く
  - `Ctrl + H`: 置換バーを開く
  - `Esc`: 検索・置換バーが開いていれば閉じてエディタへ復帰
- **[main.js](file:///c:/work/NoCapEdit/src/dist/js/main.js)**: `setupFindReplaceEvents()` を初期化に追加。
- **[state.js](file:///c:/work/NoCapEdit/src/dist/js/state.js)**: 新規 DOM 要素キャッシュを追加。
- **[i18n.js](file:///c:/work/NoCapEdit/src/dist/i18n.js)**: 多言語テキスト（プレースホルダー、ボタンタイトル、置換完了メッセージ等）を定義。
- **[help.html](file:///c:/work/NoCapEdit/src/dist/help.html)**: 「テキスト編集」カテゴリに `Ctrl + F: 検索`, `Ctrl + H: 置換` を追加。

### 4. 仕様書・ドキュメント更新
- **[spec.md](file:///c:/work/NoCapEdit/docs/spec.md)**, **[SHORTCUTS.md](file:///c:/work/NoCapEdit/docs/SHORTCUTS.md)**, **[USER_GUIDE.md](file:///c:/work/NoCapEdit/docs/USER_GUIDE.md)** を更新。

### 5. バージョン管理
- バージョン番号を `0.1.83` から `0.1.84` に更新（4ファイル一括更新）。

---

## 検証結果

- **ビルド・コンパイル検証**:
  - `cargo check` および `cargo test`: エラーなく正常に完了。
- **機能動作確認**:
  - `Ctrl + F` を押すと右上に検索バーが現れ、検索入力欄にフォーカスが当たること。
  - テキストを選択した状態で `Ctrl + F` を押すと、選択中の文字列が自動的に検索欄に入力され、一致件数が表示されること。
  - `Enter` / `Shift + Enter`（または `↓` / `↑` ボタン）で次 / 前の一致箇所へジャンプし、エディタ上で範囲選択されること。
  - `[ Aa ]` ボタンで大文字・小文字を厳密に区別するモードに切り替わること。
  - `Ctrl + H` を押すと置換行が展開され、置換入力欄にフォーカスが当たること。
  - 置換欄で `Enter`（または [置換] ボタン）を押すと現在の一致箇所が置換され、自動で次の一致へ移動すること。
  - [すべて置換] ボタン（または `Alt + A`）を押すと全一致箇所が一括置換され、ステータスバーに「N 件を置換しました」と表示されること。
  - 置換実行後に `Ctrl + Z`（Undo）を押すと、1回の操作で置換前の状態に完全に戻ること。
  - `Esc` を押すとバーが閉じ、エディタにフォーカスが戻ること。
  - ヘルプ画面（`F1`）に `Ctrl + F: 検索`, `Ctrl + H: 置換` が表示されること。
