# ウォークスルー: 複数行選択時における行頭左側余白の選択色描画解消

## 1. 概要
複数行選択を行った際に、行頭左側の余白部分（行番号ガターとテキスト文字の間にある16px領域）まで水色の選択背景色（`.cm-selectionBackground`）がはみ出して塗られてしまう不具合を修正しました。
CodeMirror 6 の選択描画アーキテクチャ（`drawSelection` / `RectangleMarker`）に準拠し、左右パディングの適用対象をエディタ全体コンテナ（`.cm-content`）から各行（`.cm-line`）へ移行することで、余白部分には選択色がつかず、テキストの開始位置から綺麗に選択ハイライトが描画されるようになりました。

---

## 2. 実施した変更内容

### 2.1 スタイルおよびテーマ設定の移行
- **[style.css](file:///d:/antigravity/NoCapEdit/src/frontend/style.css)**:
  - `.editor .cm-content` の左右パディングを `0` に変更し、上下のみ `16px 0` を適用。
  - `.editor .cm-line` に左右パディング `0 16px` を適用。
- **[codemirror.js](file:///d:/antigravity/NoCapEdit/src/frontend/js/ui/codemirror.js)**:
  - `baseTheme` 内の `".cm-content"` の左右パディングを `0` に変更（`padding: "16px 0"`）。
  - `baseTheme` 内の `".cm-line"` に左右パディング `0 16px` を設定（`padding: "0 16px"`）。

### 2.2 ルーラー計算フォールバックの補強
- **[ruler.js](file:///d:/antigravity/NoCapEdit/src/frontend/js/ui/ruler.js)**:
  - `getGutterOffset()` のフォールバック2（`.cm-line` の要素矩形を取得するパス）において、`.cm-line` に設定された `paddingLeft` を加算するように補正。1文字目の描画左端座標（0桁目）との完全一致を維持。

### 2.3 バージョン更新と仕様書の改定
- 内部バージョンを `0.2.28` から **`0.2.29`** へインクリメント（対象5ファイル: `Cargo.toml`, `package.json`, `tauri.conf.json`, `nsis/installer.nsi`, `docs/DEVELOPMENT.md`）。
- **[spec.md](file:///d:/antigravity/NoCapEdit/docs/spec.md)** に複数行選択時の余白選択色描画防止仕様を追記。

---

## 3. 動作検証結果

| 検証項目 | 検証内容 | 結果 |
|---|---|---|
| **複数行選択時の行頭余白** | 複数行選択時、開始行・中間行・終了行の行頭左側（16px余白）に選択色がつかず、テキスト先頭位置から揃って描画されること | ✅ 正常 |
| **行末右側余白のはみ出し** | 行末からエディタ右端の16px余白部分に選択色がはみ出さないこと | ✅ 正常 |
| **行番号表示 ON/OFF 連動** | 行番号表示時（ガターあり）および非表示時（Alt+L）の両方で一貫して余白に選択色がつかないこと | ✅ 正常 |
| **ルーラー・ガイド線整合性** | ルーラーの0桁目目盛りおよび縦破線ガイド線がテキスト文字位置と1pxの狂いもなく一致すること | ✅ 正常 |
| **カーソル・キャレット位置** | 行頭（0桁目）および空行でのカーソル表示位置がテキスト先頭と一致すること | ✅ 正常 |
| **フロントエンドビルド** | `npm run build` による Vite バンドルがエラーゼロで完了すること | ✅ 正常 |
| **バックエンド整合性** | `cargo check` および `cargo test`（全5テスト通過）がエラーゼロで完了すること | ✅ 正常 |
