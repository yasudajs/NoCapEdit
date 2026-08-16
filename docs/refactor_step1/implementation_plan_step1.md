# 実装計画書: Step 1 CSS変数重複の削除 + border短縮記述 (v0.1.93)

## 概要
`docs/wip/review_v0.1.87_to_v0.1.92.md` で指摘された 🔵参考 #5（テーマ間で同値のCSS変数重複）および 🔵参考 #6（`border` の冗長記述）を解消し、CSSの保守性と可読性を向上させます。

---

## 修正内容

### [MODIFY] [style.css](file:///c:/work/NoCapEdit/src/dist/style.css)

#### 1. `body.light-theme` の重複CSS変数削除
`:root`（L8-36）で定義されている以下の変数は `body.light-theme`（L52-60）でも全く同一の値が再定義されているため削除します。
- `--tab-scrollbar-track: transparent;`
- `--search-match-bg: rgba(234, 179, 8, 0.38);`
- `--search-match-border: rgba(234, 179, 8, 0.6);`
- `--search-current-bg: rgba(56, 189, 248, 0.45);`
- `--search-current-border: rgba(14, 165, 233, 0.8);`
- `--editor-selection-bg: rgba(56, 189, 248, 0.3);`
- `--focus-outline: #0ea5e9;`

#### 2. `body.soft-dark-theme` の重複CSS変数削除
同様に、`:root` と全く同一の値である以下の変数を削除します。
- `--tab-scrollbar-thumb: rgba(140, 190, 230, 0.18);`
- `--tab-scrollbar-thumb-hover: rgba(140, 190, 230, 0.40);`
- `--tab-scrollbar-track: transparent;`
- `--search-match-bg: rgba(234, 179, 8, 0.38);`
- `--search-match-border: rgba(234, 179, 8, 0.6);`
- `--search-current-bg: rgba(56, 189, 248, 0.45);`
- `--search-current-border: rgba(14, 165, 233, 0.8);`
- `--editor-selection-bg: rgba(56, 189, 248, 0.3);`
- `--focus-outline: #0ea5e9;`

#### 3. `#settingsDialog .dialog-box` の border 記述短縮
L663-666 の冗長な記述を短縮化します。
```diff
-    border-left: 1px solid var(--border);
-    border-top: none;
-    border-bottom: none;
-    border-right: none;
+    border: none;
+    border-left: 1px solid var(--border);
```

---

## バージョン更新（4ファイル一括）
- `Cargo.toml`: `version = "0.1.93"`
- `tauri.conf.json`: `"version": "0.1.93"`
- `nsis/installer.nsi`: `VERSION "0.1.93"` / `VERSIONWITHBUILD "0.1.93.0"`
- `docs/DEVELOPMENT.md`: ポータブル版ZIP名等を `0.1.93` に更新

---

## 検証計画
1. `npm run tauri dev` でアプリを起動
2. 3テーマ（Dark / Soft Dark / Light）を順次切り替えて確認:
   - 検索ハイライト色（`Ctrl+F` で文字列検索）
   - エディタの選択範囲色
   - フォーカス枠（各ボタンや入力欄フォーカス時）
   - スクロールバーの配色
   - 設定ドック（`Ctrl+,`）の左ボーダー表示
3. 全テーマで見た目の変化や崩れが一切ないことを確認
