# 実装計画書: Step 4 CSSクラス名 tab-select → settings-select (v0.1.93)

## 概要
`docs/wip/review_v0.1.87_to_v0.1.92.md` で指摘された 🔵参考 #4（設定ダイアログ内のセレクトボックスにおける `class="tab-select"` の汎用・不一致クラス名）に対応し、コンテキストに合致した `class="settings-select"` にリネームしてHTML・CSSのセマンティクスを整理します。

---

## 修正内容

### 1. [MODIFY] [index.html](file:///c:/work/NoCapEdit/src/dist/index.html)
設定ダイアログ内の以下の7箇所の `<select>` 要素のクラス名を `tab-select` から `settings-select` に変更します。
1. `#fontSizeSelectModal`（フォントサイズ）
2. `#lineHeightSelectModal`（行間）
3. `#tabBehaviorSelectModal`（Tabキーの挙動）
4. `#saveModeSelectModal`（保存モード）
5. `#charCountModeSelectModal`（文字数カウント）
6. `#wordWrapSelectModal`（行の折り返し）
7. `#themeSelectModal`（テーマ）

```diff
-                <select id="fontSizeSelectModal" class="tab-select" ...
+                <select id="fontSizeSelectModal" class="settings-select" ...
```

### 2. [MODIFY] [style.css](file:///c:/work/NoCapEdit/src/dist/style.css)
`.tab-select` 関連のスタイル定義（L251-302）を `.settings-select` に変更します。

```diff
 .font-select,
-.tab-select {
+.settings-select {
     height: 32px;
...
 .font-select:hover,
-.tab-select:hover {
+.settings-select:hover {
...
 .font-select:focus,
-.tab-select:focus {
+.settings-select:focus {
...
 .font-select:focus-visible,
-.tab-select:focus-visible {
+.settings-select:focus-visible {
...
 .font-select optgroup,
-.tab-select optgroup {
+.settings-select optgroup {
...
 .font-select option,
-.tab-select option {
+.settings-select option {
```

※ 事前調査により、JavaScriptコード側での `tab-select` クラス名参照は存在しない（すべて id または select タグ名で操作）ことを確認済みです。

---

## バージョンについて
- 本リファクタリング（Step 1〜10）は同一バージョン（`0.1.93`）および同一作業ブランチ内で実施するため、バージョン番号の変更はありません。

---

## 検証計画
1. `cargo test` を実行してテストが正常通過することを確認
2. `npm run tauri dev` でアプリを起動
3. 設定ドック（`Ctrl+,`）を開き、全セレクトボックス（フォント / フォントサイズ / 行間 / Tabキー / 保存モード / 文字数 / 折り返し / テーマ）のスタイル（サイズ、マージン、ボーダー色）が崩れていないことを確認
4. 各項目のホバー、フォーカス、キーボード（Tab / ↑↓）操作が正常に動作することを確認
