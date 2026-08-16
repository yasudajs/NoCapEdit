# ウォークスルー: Step 3 (デフォルト) ハードコードのi18n化 (v0.1.93)

## 概要
マスタープラン（`docs/wip/refactor_master_plan_to_v0.1.92.md`）の **Step 3** に基づき、`src/dist/index.html` 内のフォントサイズ（20pt）および行間（1.5）のデフォルト option 要素におけるハードコード表記を、`i18n.js` の辞書定義および `data-i18n` 属性による動的ローカライズに改修しました。

---

## 変更内容

### 1. i18n 辞書へのキー追加
[`src/dist/i18n.js`](file:///c:/work/NoCapEdit/src/dist/i18n.js) の `ui.dialog.settings` 配下に `defaultOption` キーを追加しました。
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

### 2. index.html への `data-i18n` 属性付与
[`src/dist/index.html`](file:///c:/work/NoCapEdit/src/dist/index.html) の該当 `<option>` 要素に `data-i18n` 属性を追加しました。
```diff
-                    <option value="20" selected>20 pt (デフォルト)</option>
+                    <option value="20" selected data-i18n="ui.dialog.settings.fontSize.defaultOption">20 pt (デフォルト)</option>
```
```diff
-                    <option value="1.5" selected>1.5 (デフォルト)</option>
+                    <option value="1.5" selected data-i18n="ui.dialog.settings.lineHeight.defaultOption">1.5 (デフォルト)</option>
```

---

## 検証結果

### 自動テスト (Rust)
```bash
cargo test
```
- `test commands::tests::test_next_available_file_path_single_digit_sequence ... ok`
- 全テスト正常通過。

### 差分確認
- `git diff` にて意図通りの辞書追加および `data-i18n` 属性追加を確認。
