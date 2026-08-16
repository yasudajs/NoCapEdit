# 実装計画書: Step 3 (デフォルト) ハードコードのi18n化 (v0.1.93)

## 概要
`docs/wip/review_v0.1.87_to_v0.1.92.md` で指摘された 🔵参考 #3（`index.html` 内の `"20 pt (デフォルト)"` および `"1.5 (デフォルト)"` のハードコード）に対応し、i18n 辞書および `data-i18n` 属性による動的ローカライズに対応させます。

---

## 修正内容

### 1. [MODIFY] [i18n.js](file:///c:/work/NoCapEdit/src/dist/i18n.js)
`ui.dialog.settings` 配下の `fontSize` および `lineHeight` にデフォルト値表示用のキーを追加します。

```javascript
                    fontSize: {
                        label: "フォントサイズ:",
                        defaultOption: "20 pt (デフォルト)"
                    },
                    lineHeight: {
                        label: "行間:",
                        defaultOption: "1.5 (デフォルト)"
                    },
```

### 2. [MODIFY] [index.html](file:///c:/work/NoCapEdit/src/dist/index.html)
フォントサイズ（20pt）および行間（1.5）のデフォルト `<option>` に `data-i18n` 属性を追加します。

```diff
-                    <option value="20" selected>20 pt (デフォルト)</option>
+                    <option value="20" selected data-i18n="ui.dialog.settings.fontSize.defaultOption">20 pt (デフォルト)</option>
```
```diff
-                    <option value="1.5" selected>1.5 (デフォルト)</option>
+                    <option value="1.5" selected data-i18n="ui.dialog.settings.lineHeight.defaultOption">1.5 (デフォルト)</option>
```

※ `applyI18nToDOM()` 実行時に `data-i18n` 属性を持つ要素の `textContent` が辞書から取得したテキストで自動置換されます。

---

## バージョンについて
- 本リファクタリング（Step 1〜10）は同一バージョン（`0.1.93`）および同一作業ブランチ内で実施するため、バージョン番号の変更はありません。

---

## 検証計画
1. `cargo test` を実行してテストが正常通過することを確認
2. `npm run tauri dev` でアプリを起動
3. 設定ドック（`Ctrl+,`）を開き、フォントサイズ（`20 pt (デフォルト)`）および行間（`1.5 (デフォルト)`）の各ドロップダウンが正しく表示されることを確認
4. 設定値の変更・切り替えが正常に動作することを確認
