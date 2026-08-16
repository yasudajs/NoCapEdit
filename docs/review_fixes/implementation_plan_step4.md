# 実装計画書: Step 4 検索バー入力時のデバウンス導入 🟡

## 概要
検索・置換機能（[`src/dist/js/ui/findReplace.js`](file:///c:/work/NoCapEdit/src/dist/js/ui/findReplace.js)）において、検索ウィジェットが開いている状態でエディタで文字を入力すると、1キーストロークごとに同期的に `updateMatches(false)`（全文検索＋DOMハイライト再構築）が実行されます。  
大きなファイルで多数の一致箇所がある場合や高速タイピング時に入力がもたつく原因となるため、エディタの `input` イベントハンドラに **デバウンス（200ms）** を導入します（W-2）。

## 対象ファイル
- [`src/dist/js/ui/findReplace.js`](file:///c:/work/NoCapEdit/src/dist/js/ui/findReplace.js)

## 修正内容の詳細

### [MODIFY] [findReplace.js](file:///c:/work/NoCapEdit/src/dist/js/ui/findReplace.js)
1. モジュールスコープにデバウンスタイマー変数 `let findEditorDebounceTimer = null;` を定義
2. エディタの `input` イベントリスナー内でデバウンス（200ms）を適用
3. `closeFind()` 実行時に未実行のタイマーをクリア

```diff
+let findEditorDebounceTimer = null;
 
 export function closeFind() {
     if (!elements.findReplaceWidget) return;
+    if (findEditorDebounceTimer) {
+        clearTimeout(findEditorDebounceTimer);
+        findEditorDebounceTimer = null;
+    }
     elements.findReplaceWidget.classList.add('hidden');
     if (elements.editorHighlights) {
...
     if (elements.editor) {
         elements.editor.addEventListener('scroll', syncBackdropScroll);
         elements.editor.addEventListener('input', () => {
             if (isFindWidgetOpen()) {
-                updateMatches(false);
+                if (findEditorDebounceTimer) {
+                    clearTimeout(findEditorDebounceTimer);
+                }
+                findEditorDebounceTimer = setTimeout(() => {
+                    updateMatches(false);
+                    findEditorDebounceTimer = null;
+                }, 200);
             }
         });
     }
```

## 動作確認・検証計画

### 1. 検索バー表示中のエディタ入力確認
- [ ] `Ctrl+F` で検索バーを開き、テキストを検索してハイライトを表示させる
- [ ] 検索バーを開いた状態でエディタ内にテキストを高速入力し、入力の遅延・引っ掛かりがないことを確認
- [ ] 入力停止後（約200ms後）、ハイライトおよび一致件数が正しく追従して更新されることを確認

### 2. 検索バーの開閉・再オープン時の動作確認
- [ ] タイピング直後に `Esc` キーで検索バーを閉じた際、タイマーが正常にクリアされエラーが出ないことを確認
- [ ] 再度 `Ctrl+F` で検索バーを開いた際、正常にハイライトが表示されることを確認

### 3. タブ切り替え時の同期確認
- [ ] 検索バーを開いた状態で別タブへ切り替え、ハイライトが即座に同期されることを確認
