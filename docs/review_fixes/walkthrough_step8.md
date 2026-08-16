# ウォークスルー: Step 8 `execCommand` 非推奨 API のリスクコメント追記 🔵

## 変更概要
[`src/dist/js/ui/editor.js`](file:///c:/work/NoCapEdit/src/dist/js/ui/editor.js) の `applyEditorTextWithUndo` 関数において、`document.execCommand('insertText')` 非推奨 API 使用の背景・WebView2 環境での動作前提・フォールバックに関する詳細な JSDoc コメントを追記しました（I-1）。

## 変更ファイル
- [`src/dist/js/ui/editor.js`](file:///c:/work/NoCapEdit/src/dist/js/ui/editor.js)
  - `applyEditorTextWithUndo` に JSDoc および非推奨 API に関する注記コメントを追加

```javascript
/**
 * Undo/Redoスタックを破壊せずに選択範囲のテキストを置換するヘルパー
 * 
 * ※ 注意: document.execCommand('insertText') は W3C 仕様上 deprecated ですが、
 *   textarea においてブラウザネイティブの Undo/Redo スタックを維持する事実上唯一の手法です。
 *   Tauri v1 (WebView2 / Chromium) 環境では安定動作します。
 *   失敗時は setRangeText + 手動 input イベント発火にフォールバックします。
 * 
 * @param {number} replaceStart - 置換開始インデックス
 * @param {number} replaceEnd - 置換終了インデックス
 * @param {string} replacementText - 挿入する置換テキスト
 * @param {number} [newSelectionStart] - 置換後の新しい選択開始位置
 * @param {number} [newSelectionEnd] - 置換後の新しい選択終了位置
 */
```

## 検証結果
- **構文・ビルド確認**:
  - `node --check src/dist/js/ui/editor.js` 正常通過
  - `cargo check` 正常完了
