# 実装計画書: Step 8 `execCommand` 非推奨 API のリスクコメント追記 🔵

## 概要
[`src/dist/js/ui/editor.js`](file:///c:/work/NoCapEdit/src/dist/js/ui/editor.js) の `applyEditorTextWithUndo` 関数において使用している `document.execCommand('insertText')` は、W3C 仕様上は非推奨（deprecated）となっています。  
しかし、標準の `<textarea>` 要素においてブラウザネイティブの Undo/Redo スタックを破壊せずにテキストを差し替える**事実上唯一の標準的手法**であり、現行の Tauri v1（WebView2 / Chromium）環境では安定して動作します。

将来の WebView アップデート時やメンテナが意図を把握できるよう、非推奨 API 使用の背景・リスク・代替手段に関する詳細コメントを追記します（I-1）。

## 対象ファイル
- [`src/dist/js/ui/editor.js`](file:///c:/work/NoCapEdit/src/dist/js/ui/editor.js)

## 修正内容の詳細

### [MODIFY] [editor.js](file:///c:/work/NoCapEdit/src/dist/js/ui/editor.js)
`applyEditorTextWithUndo` 関数に JSDoc および非推奨 API の背景に関する注記コメントを追記します。

```diff
- // Undo/Redoスタックを破壊せずに選択範囲のテキストを置換するヘルパー
+ /**
+  * Undo/Redoスタックを破壊せずに選択範囲のテキストを置換するヘルパー
+  * 
+  * ※ 注意: document.execCommand('insertText') は W3C 仕様上 deprecated ですが、
+  *   textarea においてブラウザネイティブの Undo/Redo スタックを維持する事実上唯一の手法です。
+  *   Tauri v1 (WebView2 / Chromium) 環境では安定動作します。
+  *   失敗時は setRangeText + 手動 input イベント発火にフォールバックします。
+  */
  export function applyEditorTextWithUndo(replaceStart, replaceEnd, replacementText, newSelectionStart, newSelectionEnd) {
```

## 動作確認・検証計画

### 1. 構文・ビルド確認
- [x] `node --check src/dist/js/ui/editor.js` で構文エラーがないことを確認
- [x] `cargo check` でビルドが正常に通ることを確認

### 2. テキスト編集・Undo 連動確認
- [x] テキスト入力・編集後に `Ctrl+Z` (Undo) が正常に動作することを確認
