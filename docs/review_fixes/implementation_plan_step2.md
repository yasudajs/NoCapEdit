# 実装計画書: Step 2 `input` イベント二重発火修正 🔴

## 概要
[`src/dist/js/ui/editor.js`](file:///c:/work/NoCapEdit/src/dist/js/ui/editor.js) の `applyEditorTextWithUndo` 関数において、`document.execCommand('insertText')` が成功するとブラウザが自動的に `input` イベントを発火します。  
しかし、関数の末尾で `elements.editor.dispatchEvent(new Event('input'))` を手動発火しているため、1回のテキスト編集操作に対して `input` イベントが **2回連続で発火** してしまっています（C-2）。

これにより以下の無駄な重複処理が発生しているため、手動発火を `execCommand` 失敗時のフォールバック処理内のみに限定します。
- `onEditorInput` の重複実行（ステータスメトリクス計算、タブ描画 `renderTabs`）
- 自動保存タイマーの無駄なリセット・再設定

## 対象ファイル
- [`src/dist/js/ui/editor.js`](file:///c:/work/NoCapEdit/src/dist/js/ui/editor.js)

## 修正内容の詳細

### [MODIFY] [editor.js](file:///c:/work/NoCapEdit/src/dist/js/ui/editor.js)
`applyEditorTextWithUndo` 内で `execCommand` の成否を判定し、失敗時（フォールバック時）のみ `input` イベントを手動発火します。成功時はブラウザの自動発火に任せ、末尾の手動発火を削除します。

```diff
 export function applyEditorTextWithUndo(replaceStart, replaceEnd, replacementText, newSelectionStart, newSelectionEnd) {
     if (!elements.editor) return;
 
     elements.editor.focus();
     elements.editor.setSelectionRange(replaceStart, replaceEnd);
 
-    // document.execCommand('insertText') を使用することでブラウザネイティブのUndo/Redoスタックに正常に記録
-    if (!document.execCommand('insertText', false, replacementText)) {
-        // execCommand が失敗した場合のフォールバック
+    // document.execCommand('insertText') を使用することでブラウザネイティブのUndo/Redoスタックに正常に記録
+    // 成功時はブラウザが自動的に input イベントを発火する
+    const success = document.execCommand('insertText', false, replacementText);
+    if (!success) {
+        // execCommand が失敗した場合のフォールバック（ブラウザが input イベントを発火しないため手動発火）
         elements.editor.setRangeText(replacementText, replaceStart, replaceEnd, 'end');
+        elements.editor.dispatchEvent(new Event('input'));
     }
 
     if (newSelectionStart !== undefined && newSelectionEnd !== undefined) {
         elements.editor.setSelectionRange(newSelectionStart, newSelectionEnd);
     }
-
-    // 自動保存やステータス表示を連動
-    elements.editor.dispatchEvent(new Event('input'));
 }
```

## 動作確認・検証計画

`applyEditorTextWithUndo` を経由する各操作で、Undo/Redo およびステータス更新・自動保存が従来通り正常に機能することを確認します。

### 1. 基本的なテキスト入力・Undo/Redo 連動
- [ ] 通常のテキスト入力 → `Ctrl+Z` (Undo) → `Ctrl+Y` (Redo) が正常に動作することを確認

### 2. 行操作ショートカットの動作確認
- [ ] 行移動 (`Alt+↑` / `Alt+↓`) → Undo が正常動作することを確認
- [ ] 行複製 (`Alt+Shift+↓`) → Undo が正常動作することを確認
- [ ] 行削除 (`Ctrl+Shift+K`) → Undo が正常動作することを確認

### 3. その他 `applyEditorTextWithUndo` 経由操作の確認
- [ ] タイムスタンプ挿入 (`F5`) → Undo が正常動作することを確認
- [ ] 検索・置換（1件置換・全件置換）→ Undo が正常動作することを確認
- [ ] `Tab` / `Shift+Tab` のインデント・アンインデント → Undo が正常動作することを確認

### 4. ステータスバー・自動保存の連動確認
- [ ] 上記各操作を行った際に、ステータスバーの行・列・文字数カウントおよび未保存マーク（`*`）が即座に追従して更新されることを確認
- [ ] 自動保存モード時に指定秒数後に自動保存が実行されることを確認
