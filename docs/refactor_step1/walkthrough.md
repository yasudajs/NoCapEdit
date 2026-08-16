# ウォークスルー: Step 1 CSS変数重複の削除 + border短縮記述 (v0.1.93)

## 概要
マスタープラン（`docs/wip/refactor_master_plan_to_v0.1.92.md`）の **Step 1** に基づき、`src/dist/style.css` 内の冗長なCSS変数重複定義の削除および設定ドックの `border` 記述の簡素化を実施しました。

---

## 変更内容

### 1. テーマ別重複CSS変数の削除
[`src/dist/style.css`](file:///c:/work/NoCapEdit/src/dist/style.css) の `:root` で既に共通定義されている以下の変数が、`body.light-theme` および `body.soft-dark-theme` で同値で再定義されていたため削除しました。
- `--search-match-bg`
- `--search-match-border`
- `--search-current-bg`
- `--search-current-border`
- `--editor-selection-bg`
- `--focus-outline`
- `--tab-scrollbar-track`
- `--tab-scrollbar-thumb` / `--tab-scrollbar-thumb-hover`（Soft Dark テーマ側）

### 2. 設定ドック border 記述の簡素化
[`src/dist/style.css`](file:///c:/work/NoCapEdit/src/dist/style.css) の `#settingsDialog .dialog-box` における4方向の個別指定を短縮化しました。
```diff
-    border-left: 1px solid var(--border);
-    border-top: none;
-    border-bottom: none;
-    border-right: none;
+    border: none;
+    border-left: 1px solid var(--border);
```

### 3. バージョン更新 (v0.1.93)
- `Cargo.toml`: `0.1.93`
- `tauri.conf.json`: `0.1.93`
- `nsis/installer.nsi`: `0.1.93` / `0.1.93.0`
- `docs/DEVELOPMENT.md`: `0.1.93`

---

## 検証結果

### 自動テスト (Rust)
```bash
cargo test
```
- `test commands::tests::test_next_available_file_path_single_digit_sequence ... ok`
- 全テスト正常通過。

### 差分確認
- `git diff src/dist/style.css` にて意図通りの変数削除・border短縮を確認。
- 各テーマ（Dark / Soft Dark / Light）で表示崩れや変数値の欠落がないことを確認。
