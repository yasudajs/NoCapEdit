# 実装計画書: Step 3 到達不能コード（Dead Code）除去 🟡

## 概要
[`src/dist/js/ui/shortcuts.js`](file:///c:/work/NoCapEdit/src/dist/js/ui/shortcuts.js) において、ズーム拡大の条件判定式に `(e.code === 'Semicolon' && e.shiftKey)` が含まれていますが、直前の `if (e.shiftKey)` ブロックですべての Shift 押下時処理が実行され `return` で終了するため、この条件は **絶対に到達しない（Dead Code）** 状態になっています（W-1）。

コードの可読性と意図の明確化のため、到達不能な条件式を削除・整理します。

## 対象ファイル
- [`src/dist/js/ui/shortcuts.js`](file:///c:/work/NoCapEdit/src/dist/js/ui/shortcuts.js)

## 修正内容の詳細

### [MODIFY] [shortcuts.js](file:///c:/work/NoCapEdit/src/dist/js/ui/shortcuts.js)
ズーム拡大の条件式から到達不能な `|| (e.code === 'Semicolon' && e.shiftKey)` を削除します。

```diff
             // 拡大条件
-            if (e.key === '+' || e.key === '=' || e.key === ';' || e.code === 'NumpadAdd' || e.code === 'Equal' || (e.code === 'Semicolon' && e.shiftKey)) {
+            if (e.key === '+' || e.key === '=' || e.key === ';' || e.code === 'NumpadAdd' || e.code === 'Equal') {
                 e.preventDefault();
                 zoomIn();
             }
```

## 動作確認・検証計画

ズームおよび行間変更のショートカットが従来通りすべて正常に動作することを確認します。

### 1. ズーム操作の確認
- [ ] `Ctrl` + `+`（または `=` / `;` / テンキー `+`）でフォントサイズが拡大することを確認
- [ ] `Ctrl` + `-`（または テンキー `-`）でフォントサイズが縮小することを確認
- [ ] `Ctrl` + `0` でフォントサイズと行間が初期値（リセット）に戻ることを確認

### 2. 行間変更操作の確認（Shift 連動）
- [ ] `Ctrl` + `Shift` + `+`（または `;` / テンキー `+`）で行間が拡大することを確認
- [ ] `Ctrl` + `Shift` + `-`（または テンキー `-`）で行間が縮小することを確認
