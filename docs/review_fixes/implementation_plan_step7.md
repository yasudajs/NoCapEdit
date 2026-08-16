# 実装計画書: Step 7 ハイライト色・フォーカス色の CSS 変数化 🟡

## 概要
[`src/dist/style.css`](file:///c:/work/NoCapEdit/src/dist/style.css) において、検索ハイライト色（通常一致・現在選択）、テキスト選択色、および検索ウィジェットボタンのフォーカスアウトライン色が直接ハードコード（`rgba(234, 179, 8, ...)` や `rgb(14, 165, 233)`）されています。  
テーマ追加時の保守性向上およびテーマ間の一貫性を高めるため、これらを CSS 変数（`--search-match-bg`, `--search-current-bg`, `--editor-selection-bg`, `--focus-outline` 等）として各テーマ定義に集約します（W-5）。

## 対象ファイル
- [`src/dist/style.css`](file:///c:/work/NoCapEdit/src/dist/style.css)

## 修正内容の詳細

### [MODIFY] [style.css](file:///c:/work/NoCapEdit/src/dist/style.css)
1. `:root` (Dark), `body.light-theme`, `body.soft-dark-theme` の各テーマ定義にハイライト・フォーカス用 CSS 変数を追加
2. ハードコードされた色値を `var(--xxx)` に置換

```diff
 :root {
     /* Dark テーマ (完全な黒ベース) */
     ...
     --tab-scrollbar-track: transparent;
+    
+    /* ハイライト・選択色・フォーカス */
+    --search-match-bg: rgba(234, 179, 8, 0.38);
+    --search-match-border: rgba(234, 179, 8, 0.6);
+    --search-current-bg: rgba(56, 189, 248, 0.45);
+    --search-current-border: rgba(14, 165, 233, 0.8);
+    --editor-selection-bg: rgba(56, 189, 248, 0.3);
+    --focus-outline: #0ea5e9;
...
 .icon-btn:focus-visible,
 .toggle-btn:focus-visible,
 .action-btn:focus-visible {
-    outline: 2px solid rgb(14, 165, 233);
+    outline: 2px solid var(--focus-outline);
     outline-offset: 1px;
 }
...
 .editor-highlights mark.search-match {
-    background-color: rgba(234, 179, 8, 0.38);
+    background-color: var(--search-match-bg);
     color: transparent;
     border-radius: 2px;
-    box-shadow: 0 0 0 1px rgba(234, 179, 8, 0.6);
+    box-shadow: 0 0 0 1px var(--search-match-border);
 }
 
 .editor-highlights mark.search-match.current {
-    background-color: rgba(56, 189, 248, 0.45);
+    background-color: var(--search-current-bg);
     color: transparent;
     border-radius: 2px;
-    box-shadow: 0 0 0 2px rgba(14, 165, 233, 0.8);
+    box-shadow: 0 0 0 2px var(--search-current-border);
 }
...
 .editor::selection {
-    background-color: rgba(56, 189, 248, 0.3);
+    background-color: var(--editor-selection-bg);
     color: inherit;
 }
```

## 動作確認・検証計画

### 1. 検索ハイライトの表示確認
- [x] `Ctrl+F` で検索を行い、通常の一致箇所（黄ハイライト）および現在選択中の一致箇所（水色ハイライト）が正しく表示されることを確認

### 2. テキスト選択色の確認
- [x] 通常のエディタ内テキスト選択時に薄い水色背景で選択されることを確認

### 3. テーマ切り替え時の追従確認
- [x] Dark / Soft Dark / Light の3テーマそれぞれで検索ハイライト・選択色・フォーカス枠が正常に表示されることを確認

### 4. ボタンフォーカス枠の確認
- [NG] 検索ウィジェット内のボタンを Tab キーでフォーカスした際、フォーカス枠が正しく表示されることを確認
  → 検索枠が出ている時、Tabを押すと、フォーカスは移動するが、検索ウィジェットから外れてエディタ側にフォーカスが移ってしまい、戻ってこない。
