# i18n リファクタリング Step 1.3: editor.js の多言語化対応

`docs/wip/i18n_refactor/master_plan.md` に記載されている「Step 1.3: `editor.js`」の実装計画書です。

## User Review Required

> [!IMPORTANT]
> - プレースホルダーの対応: `<textarea placeholder="入力準備完了">` を `main.js` から動的に `t('editor.placeholder')` をセットするよう変更します。
> - メトリクスの多言語化と語順対応: 言語によって「数字＋単位（1行）」と「単位＋数字（Ln 1）」の語順が入れ替わる問題に対応するため、`i18n.js` の `window.t` 関数を拡張し、**テンプレート変数の置換機能**（例: `{line}行`）を追加します。

## Open Questions

（解決済み）
メトリクスの英略称について、ユーザー合意により日本語化（行、列、文字など）し、フォーマットもそれに合わせた形に調整することとなりました。
また、言語ごとの語順の違い（日本語「1行」vs 英語「Ln 1」）を吸収するため、`t()` 関数を変数置換に対応させる方針としました。

## Proposed Changes

### `src/dist/i18n.js`

1. **`window.t` 関数の拡張**
   第2引数としてオブジェクト `params` を受け取り、文字列内の `{変数名}` を置換する機能を追加します。
   ```javascript
   window.t = function(key, params = {}) {
       if (!key || typeof key !== 'string') return key;
       const keys = key.split('.');
       let current = DICT[currentLang];
       for (const k of keys) {
           if (current && typeof current === 'object' && k in current) {
               current = current[k];
           } else {
               return key;
           }
       }
       
       if (typeof current === 'string') {
           let result = current;
           for (const [k, v] of Object.entries(params)) {
               result = result.replace(new RegExp(`\\{${k}\\}`, 'g'), v);
           }
           return result;
       }
       return key;
   };
   ```

2. **辞書へのキー追加**
   言語ごとの語順を制御できるように、変数を埋め込んだフォーマット文字列を定義します。
   ```javascript
       editor: {
           placeholder: "入力準備完了",
           metrics: {
               position: "{line}行, {col}列",
               selection: "{selected} / {total} 文字",
               length: "{total} 文字",
               font: "フォント {size} pt",
               lh: "行間 x {lh}"
           }
       }
   ```
   ※（参考）将来的に英語対応する際は、以下のように定義するだけでUI側のコード変更なしに対応できます。
   `position: "Ln {line}, Col {col}"` / `length: "{total} chars"`

### `src/dist/js/ui/editor.js`

メトリクス文字列の構築部分を拡張した `t()` を使った形に修正します。

#### [MODIFY] [editor.js](file:///c:/work/NoCapEdit/src/dist/js/ui/editor.js)
- **メトリクス（文字数）の置換**
  - `${selectedChars} / ${chars} chars` -> `t('editor.metrics.selection', { selected: selectedChars, total: chars })`
  - `${chars} chars` -> `t('editor.metrics.length', { total: chars })`
- **メトリクス（全体のフォーマット）の置換**
  - 変更前: `` `Ln ${line}, Col ${col} | ${charDisplay} | Font ${fs} pt | LH x ${lh.toFixed(1)}` ``
  - 変更後: 
    ```javascript
    const positionStr = t('editor.metrics.position', { line, col });
    const fontStr = t('editor.metrics.font', { size: fs });
    const lhStr = t('editor.metrics.lh', { lh: lh.toFixed(1) });
    elements.statusMetrics.textContent = `${positionStr} | ${charDisplay} | ${fontStr} | ${lhStr}`;
    ```

### `src/dist/index.html`

- `<textarea id="editor" class="editor" placeholder="入力準備完了"></textarea>`
  から `placeholder="入力準備完了"` を削除します（空文字にします）。

### `src/dist/js/main.js`

#### [MODIFY] [main.js](file:///c:/work/NoCapEdit/src/dist/js/main.js)
- 初期化関数 `init()` の最後（UI構築完了時）に、プレースホルダーをセットする処理を追加します。
  - `elements.editor.placeholder = t('editor.placeholder');`

## Verification Plan

### Manual Verification
1. アプリを起動した際、テキストエリアのプレースホルダーが「入力準備完了」と表示されることを確認。
2. エディタ下部のメトリクス表示が「1行, 1列 | 0 文字 | フォント 13 pt | 行間 x 1.5」のような日本語フォーマットで正しく変数展開されて表示されることを確認。
