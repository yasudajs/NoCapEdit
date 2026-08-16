# ウォークスルー: Step 2 `input` イベント二重発火修正 🔴

## 変更概要
[`src/dist/js/ui/editor.js`](file:///c:/work/NoCapEdit/src/dist/js/ui/editor.js) の `applyEditorTextWithUndo` 関数において、`document.execCommand('insertText')` 成功時にブラウザが自動発火する `input` イベントに加え、末尾で手動発火していたことによる **`input` イベントの二重発火問題（C-2）** を修正しました。

## 変更ファイル
- [`src/dist/js/ui/editor.js`](file:///c:/work/NoCapEdit/src/dist/js/ui/editor.js)
  - `execCommand` の成否を取得し、失敗時（フォールバック時）のみ `input` イベントを手動発火するように変更
  - 成功時はブラウザの自動発火に任せることで、二重発火（タブ再描画・文字カウント計算・自動保存タイマーリセットの二重実行）を解消

```javascript
    const success = document.execCommand('insertText', false, replacementText);
    if (!success) {
        // execCommand が失敗した場合のフォールバック（ブラウザが input イベントを発火しないため手動発火）
        elements.editor.setRangeText(replacementText, replaceStart, replaceEnd, 'end');
        elements.editor.dispatchEvent(new Event('input'));
    }

    if (newSelectionStart !== undefined && newSelectionEnd !== undefined) {
        elements.editor.setSelectionRange(newSelectionStart, newSelectionEnd);
    }
```

## 検証結果
- **構文・ビルド確認**:
  - `node --check src/dist/js/ui/editor.js` 正常通過
  - `cargo check` 正常完了
