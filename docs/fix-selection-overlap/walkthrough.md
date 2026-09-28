# ウォークスルー: 文字列選択時のハイライト重複（二重表示）解消

## 1. 今回の改修概要
- **バージョン**: `0.2.21`
- **目的**: 文字列選択時に、エディタ独自の選択背景（CodeMirror `drawSelection`）とブラウザ標準のテキスト選択（`::selection`）が重複して描画され、上下で濃淡の段差（色ムラ）が発生していた問題を修正。
- **維持機能**: 単語選択時に同一キーワードを黄色で自動ハイライトする機能（`highlightSelectionMatches`）はそのまま維持。

---

## 2. 変更内容一覧

### ① `src/frontend/js/ui/codemirror.js`
- `baseTheme` 定義内の `&.cm-focused .cm-selectionBackground, ::selection` から `, ::selection` を削除。
- CodeMirror の `drawSelection()` が描画する `.cm-selectionBackground` のみに選択色（`var(--editor-selection-bg)`）を適用。

### ② `src/frontend/style.css`
- `.editor .cm-selectionBackground, .editor .cm-editor ::selection` から `.editor .cm-editor ::selection` を削除。
- ブラウザ標準のネイティブ選択は CodeMirror のデフォルトの透明化（`background: transparent !important`）に任せるように整理。

### ③ バージョン番号の更新
- 内部バージョンを `0.2.20` から `0.2.21` へ更新（4ファイル一括更新: `Cargo.toml`, `tauri.conf.json`, `nsis/installer.nsi`, `docs/DEVELOPMENT.md`、および `package.json`）。

### ④ 仕様書・履歴ドキュメントの更新
- `docs/spec.md`: テキスト選択表示および単語一致ハイライト仕様を追記。
- `docs/history.md`: Ver 0.2.21 の改定履歴を追記。

---

## 3. 検証結果
- **フロントエンドビルド (`npm run build`)**: 正常完了。
- **Rust ビルドチェック (`cargo check`)**: 正常完了（エラーなし）。
- **動作確認**:
  - テキスト選択時、上下の段差や二重の重なりが解消され、行全体に合わせた均一な水色1色で描画されることを確認。
  - 単語を選択した際、同一文書内の他の同一単語が従来どおり黄色でハイライトされることを確認。
