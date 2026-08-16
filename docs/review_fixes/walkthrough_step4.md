# ウォークスルー: Step 4 検索バー入力時のデバウンス導入 🟡

## 変更概要
検索・置換機能（[`src/dist/js/ui/findReplace.js`](file:///c:/work/NoCapEdit/src/dist/js/ui/findReplace.js)）において、検索バー表示中のエディタ入力（`input` イベント）に対して **デバウンス（200ms）** を導入しました（W-2）。

## 変更ファイル
- [`src/dist/js/ui/findReplace.js`](file:///c:/work/NoCapEdit/src/dist/js/ui/findReplace.js)
  - `findEditorDebounceTimer` 変数を追加
  - エディタ入力リスナー内で `setTimeout` による 200ms デバウンスを適用
  - `closeFind()` 時に未実行タイマーをクリア

```javascript
    if (elements.editor) {
        elements.editor.addEventListener('scroll', syncBackdropScroll);
        elements.editor.addEventListener('input', () => {
            if (isFindWidgetOpen()) {
                if (findEditorDebounceTimer) {
                    clearTimeout(findEditorDebounceTimer);
                }
                findEditorDebounceTimer = setTimeout(() => {
                    updateMatches(false);
                    findEditorDebounceTimer = null;
                }, 200);
            }
        });
    }
```

## 検証結果
- **構文・ビルド確認**:
  - `node --check src/dist/js/ui/findReplace.js` 正常通過
  - `cargo check` 正常完了
