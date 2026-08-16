# 実装計画書: Step 5 Shift+Tab アンインデント時カーソル位置修正 🟡

## 概要
[`src/dist/js/ui/editor.js`](file:///c:/work/NoCapEdit/src/dist/js/ui/editor.js) の `handleTabKey` において、`Shift+Tab`（インデント削除）を実行した際、複数行選択時の新しい選択終了位置（`newSelectionEnd`）の計算に全行の削除合計文字数 `totalRemovedCount` を一括で減算しています。  
これにより、選択終了行のインデントが削除されなかった場合や行頭付近を選択していた場合に、カーソルや選択範囲が前行のテキスト内に過剰に引き戻されてしまうエッジケース（W-3）が存在します。

行ごとの削除文字数を正確に累積・追跡し、新テキスト上の座標を正確に計算するロジックに修正します。

## 対象ファイル
- [`src/dist/js/ui/editor.js`](file:///c:/work/NoCapEdit/src/dist/js/ui/editor.js)

## 修正内容の詳細

### [MODIFY] [editor.js](file:///c:/work/NoCapEdit/src/dist/js/ui/editor.js)
`handleTabKey` の `Shift+Tab` 処理において、各行の変換後の位置を反復処理で追跡し、`start` および `end` の新しいカーソル/選択範囲位置を正確に算出します。

```diff
             const targetText = value.substring(startLinePos, actualEndLinePos);
             const lines = targetText.split('\n');
 
-            let firstLineRemovedCount = 0;
-            let totalRemovedCount = 0;
-
             const newLines = lines.map((line, idx) => {
-                let removed = 0;
                 let newLine = line;
 
                 if (line.startsWith(indentStr)) {
                     newLine = line.substring(indentStr.length);
-                    removed = indentStr.length;
                 } else if (line.startsWith('\t')) {
                     newLine = line.substring(1);
-                    removed = 1;
                 } else if (line.startsWith(' ')) {
                     const spaceMatch = line.match(/^ +/);
                     if (spaceMatch) {
                         const count = Math.min(spaceMatch[0].length, indentStr.length);
                         newLine = line.substring(count);
-                        removed = count;
                     }
                 }
-
-                if (idx === 0) {
-                    firstLineRemovedCount = removed;
-                }
-                totalRemovedCount += removed;
                 return newLine;
             });
 
+            // 各行ごとの削除文字数を反映して正確な新カーソル・選択範囲位置を計算
+            let newSelStart = startLinePos;
+            let newSelEnd = startLinePos;
+            let currentOldPos = startLinePos;
+            let currentNewPos = startLinePos;
+
+            for (let i = 0; i < lines.length; i++) {
+                const oldLineLen = lines[i].length;
+                const newLineLen = newLines[i].length;
+                const removed = oldLineLen - newLineLen;
+                const nextOldPos = currentOldPos + oldLineLen;
+
+                if (start >= currentOldPos && start <= nextOldPos) {
+                    const offsetInLine = start - currentOldPos;
+                    const newOffsetInLine = Math.max(0, offsetInLine - removed);
+                    newSelStart = currentNewPos + newOffsetInLine;
+                }
+
+                if (end >= currentOldPos && end <= nextOldPos) {
+                    const offsetInLine = end - currentOldPos;
+                    const newOffsetInLine = Math.max(0, offsetInLine - removed);
+                    newSelEnd = currentNewPos + newOffsetInLine;
+                }
+
+                currentOldPos = nextOldPos + 1;
+                currentNewPos += newLineLen + 1;
+            }
+
             const newText = newLines.join('\n');
             applyEditorTextWithUndo(
                 startLinePos,
                 actualEndLinePos,
                 newText,
-                Math.max(startLinePos, start - firstLineRemovedCount),
-                Math.max(startLinePos, end - totalRemovedCount)
+                newSelStart,
+                newSelEnd
             );
```

## 動作確認・検証計画

### 1. 単一行での Shift+Tab
- [ ] インデントがある行で `Shift+Tab` → インデントが削除され、カーソルが適切な位置に残ることを確認
- [ ] インデントがない行で `Shift+Tab` → 変化せずカーソル位置が維持されることを確認

### 2. 複数行選択での Shift+Tab
- [ ] 全行にインデントがある複数行を選択して `Shift+Tab` → 全行のインデントが削除され、選択範囲が維持されることを確認
- [ ] 1行目にインデントがあり、最終行にインデントがない複数行を選択して `Shift+Tab` → 最終行の選択範囲がズレずに正しく維持されることを確認
- [ ] 最終行の行頭を選択した状態で `Shift+Tab` → 選択範囲が崩れないことを確認

### 3. Undo / Redo 連動
- [ ] `Shift+Tab` 後に `Ctrl+Z` (Undo) で元のインデント・選択位置に戻ることを確認
