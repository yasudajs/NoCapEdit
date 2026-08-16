# ウォークスルー: Step 3 到達不能コード（Dead Code）除去 🟡

## 変更概要
[`src/dist/js/ui/shortcuts.js`](file:///c:/work/NoCapEdit/src/dist/js/ui/shortcuts.js) において、ズーム拡大判定式内に含まれていた到達不能コード（`|| (e.code === 'Semicolon' && e.shiftKey)`）を削除しました（W-1）。

## 変更ファイル
- [`src/dist/js/ui/shortcuts.js`](file:///c:/work/NoCapEdit/src/dist/js/ui/shortcuts.js)
  - 拡大判定式から `|| (e.code === 'Semicolon' && e.shiftKey)` を削除し、意図を明確化

```javascript
            // 拡大条件
            if (e.key === '+' || e.key === '=' || e.key === ';' || e.code === 'NumpadAdd' || e.code === 'Equal') {
                e.preventDefault();
                zoomIn();
            }
```

## 検証結果
- **構文・ビルド確認**:
  - `node --check src/dist/js/ui/shortcuts.js` 正常通過
  - `cargo check` 正常完了
