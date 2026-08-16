# 実装計画書: Step 6 `applyWordWrap` 呼び出し前の安全性強化・コメント整理 🟡

## 概要
[`src/dist/js/ui/editor.js`](file:///c:/work/NoCapEdit/src/dist/js/ui/editor.js) の `applyWordWrap` 関数および設定画面（[`src/dist/js/ui/settings.js`](file:///c:/work/NoCapEdit/src/dist/js/ui/settings.js)）において、全タブ閉鎖時やエディタ要素が存在しない状態でも安全に動作するよう、ガード処理の意図を明確にするコメントと JSDoc を整備します（W-4）。

## 対象ファイル
- [`src/dist/js/ui/editor.js`](file:///c:/work/NoCapEdit/src/dist/js/ui/editor.js)

## 修正内容の詳細

### [MODIFY] [editor.js](file:///c:/work/NoCapEdit/src/dist/js/ui/editor.js)
`applyWordWrap` 関数に詳細な JSDoc コメントを追加し、エディタ要素が存在しない場合（全タブ閉鎖時など）の安全な早期リターン挙動を明記します。

```diff
+/**
+ * エディタの折り返し設定（soft / off）を適用する
+ * ※ 全タブ閉鎖時など elements.editor が存在しない場合は安全に早期リターンする
+ * @param {boolean} enable - 折り返しを有効にするかどうか
+ */
 export function applyWordWrap(enable) {
     if (!elements.editor) return;
     elements.editor.wrap = enable ? 'soft' : 'off';
```

## 動作確認・検証計画

### 1. 通常時の折り返し切り替え動作確認
- [ ] `Alt+Z` で折り返し（soft / off）がトグル切り替えできることを確認
- [ ] 設定ダイアログ（`Ctrl+,`）から折り返し設定を変更し、エディタに即時反映されることを確認

### 2. 全タブ閉鎖時の安全性確認
- [ ] すべてのタブを閉じた状態で設定ダイアログを開き、折り返し設定を変更・保存してもエラーが発生しないことを確認

### 3. タブ切り替え時の折り返し状態維持確認
- [ ] 複数タブを開いた状態でタブごとに折り返し状態が正しく同期・維持されることを確認
