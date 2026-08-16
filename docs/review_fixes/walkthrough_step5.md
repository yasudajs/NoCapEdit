# ウォークスルー: Step 5 Shift+Tab アンインデント時カーソル位置修正 🟡

## 変更概要
[`src/dist/js/ui/editor.js`](file:///c:/work/NoCapEdit/src/dist/js/ui/editor.js) の `handleTabKey` において、`Shift+Tab`（インデント削除）実行時の新しいカーソルおよび選択範囲位置の計算を行ごとの正確なオフセット追跡・累積処理に改善しました（W-3）。

## 変更ファイル
- [`src/dist/js/ui/editor.js`](file:///c:/work/NoCapEdit/src/dist/js/ui/editor.js)
  - 複数行選択時の各行のインデント削除文字数を正確に累積・反映
  - 最終行にインデントがない場合や行頭選択時でも選択範囲が前行に過剰に巻き戻らないよう修正

```javascript
            // 各行ごとの削除文字数を反映して正確な新カーソル・選択範囲位置を計算
            let newSelStart = startLinePos;
            let newSelEnd = startLinePos;
            let currentOldPos = startLinePos;
            let currentNewPos = startLinePos;

            for (let i = 0; i < lines.length; i++) {
                const oldLineLen = lines[i].length;
                const newLineLen = newLines[i].length;
                const removed = oldLineLen - newLineLen;
                const nextOldPos = currentOldPos + oldLineLen;

                if (start >= currentOldPos && start <= nextOldPos) {
                    const offsetInLine = start - currentOldPos;
                    const newOffsetInLine = Math.max(0, offsetInLine - removed);
                    newSelStart = currentNewPos + newOffsetInLine;
                }

                if (end >= currentOldPos && end <= nextOldPos) {
                    const offsetInLine = end - currentOldPos;
                    const newOffsetInLine = Math.max(0, offsetInLine - removed);
                    newSelEnd = currentNewPos + newOffsetInLine;
                }

                currentOldPos = nextOldPos + 1;
                currentNewPos += newLineLen + 1;
            }
```

## 検証結果
- **単体テストスクリプト実行**:
  - テスト1（複数行選択で末尾行インデントなし）: 選択範囲が正確に維持されることを確認
  - テスト2（インデント途中キャレット）: 先頭へ安全にクランプされることを確認
- **構文・ビルド確認**:
  - `node --check src/dist/js/ui/editor.js` 正常通過
  - `cargo check` 正常完了
