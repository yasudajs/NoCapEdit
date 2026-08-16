# ウォークスルー: Step 4 CSSクラス名 tab-select → settings-select (v0.1.93)

## 概要
マスタープラン（`docs/wip/refactor_master_plan_to_v0.1.92.md`）の **Step 4** に基づき、設定ダイアログ内の `<select>` 要素に使用されていた汎用・不一致クラス名 `class="tab-select"` を、コンテキストに合致した `class="settings-select"` にリネームしました。

---

## 変更内容

### 1. index.html 内のクラス名リネーム
[`src/dist/index.html`](file:///c:/work/NoCapEdit/src/dist/index.html) の設定ダイアログ内にある 7 つの `<select>` 要素のクラス名を `settings-select` に変更しました。
- `#fontSizeSelectModal`
- `#lineHeightSelectModal`
- `#tabBehaviorSelectModal`
- `#saveModeSelectModal`
- `#charCountModeSelectModal`
- `#wordWrapSelectModal`
- `#themeSelectModal`

### 2. style.css 内のセレクタ名リネーム
[`src/dist/style.css`](file:///c:/work/NoCapEdit/src/dist/style.css) の `.tab-select` 関連のスタイル定義セレクタをすべて `.settings-select` に変更しました。
- `.settings-select`
- `.settings-select:hover`
- `.settings-select:focus`
- `.settings-select:focus-visible`
- `.settings-select optgroup`
- `.settings-select option`

---

## 検証結果

### 自動テスト (Rust)
```bash
cargo test
```
- `test commands::tests::test_next_available_file_path_single_digit_sequence ... ok`
- 全テスト正常通過。

### 静的検証
- `grep tab-select` にてプロジェクト内の残存使用箇所が 0 件であることを確認。
- `grep settings-select` にて 7 つの `<select>` 要素および `style.css` のセレクタに正しく適用されていることを確認。
