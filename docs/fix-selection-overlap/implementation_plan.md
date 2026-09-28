# 実装計画書: 文字列選択時のハイライト重複（二重表示）解消

## 1. 概要
NoCapEdit で文字列を選択した際、選択範囲の青色（水色）が上下で濃淡に分かれて二重に重なって見える現象が発生しています。
これは、CodeMirror 6 の拡張機能 `drawSelection()` によるエディタ独自の選択背景レイヤー（`.cm-selectionBackground`）と、ブラウザ標準のテキスト選択ハイライト（`::selection`）の両方に選択色（`var(--editor-selection-bg)`）が適用されていることが原因です。
本改修では、不要な `::selection` のスタイル指定を削除し、均一な1色の選択背景表示に改善します。なお、選択中単語と一致するキーワードを黄色でハイライトする機能（`highlightSelectionMatches`）はそのまま維持します。

## 2. 影響範囲
- `src/frontend/js/ui/codemirror.js`
  - `baseTheme` 定義内の `&.cm-focused .cm-selectionBackground, ::selection` から `::selection` を削除。
- `src/frontend/style.css`
  - `.editor .cm-selectionBackground, .editor .cm-editor ::selection` から `.editor .cm-editor ::selection` を削除。
- 以下の機能には影響を与えません（維持）:
  - 同一単語の一致ハイライト（黄色：`.cm-selectionMatch`）
  - 検索バーのマッチハイライト（黄色/水色：`.cm-searchMatch`）

## 3. 実装手順（フェーズ2開始後のステップ）
1. **ブランチ作成**: `master` から `feature/fix-selection-overlap` ブランチを作成
2. **ドキュメント昇格**: `docs/wip/fix-selection-overlap/` を `docs/fix-selection-overlap/` へ移動してコミット＆プッシュ
3. **バージョン番号の更新**:
   - 内部バージョンを `0.2.20` から `0.2.21` へ更新（5ファイル一括）
     - `Cargo.toml`
     - `package.json`
     - `tauri.conf.json`
     - `nsis/installer.nsi`
     - `docs/DEVELOPMENT.md`
4. **仕様書更新**: `docs/spec.md` の更新
5. **コード修正**:
   - `src/frontend/js/ui/codemirror.js` の `::selection` を削除
   - `src/frontend/style.css` の `::selection` を削除
6. **動作確認・検証**:
   - テキスト選択時に均一な1色（水色）で綺麗に表示されることを確認
   - 単語選択時に、同一キーワードが従来どおり黄色でハイライト表示されることを確認
   - 検索ダイアログや各種テーマ（Light / Soft Dark / Dark）での表示崩れがないことを確認
7. **完了ドキュメント作成**:
   - `docs/fix-selection-overlap/walkthrough.md` の作成
   - `docs/history.md` にバージョン `0.2.21` の変更履歴を追記
   - コミット＆プッシュ

## 4. 検証方法
- `npm run tauri dev` を実行してアプリを起動
- 複数行のテキストを入力し、文字列をマウスドラッグおよびキーボード（Shift+矢印）で選択
- 選択範囲の背景色が上下で濃淡に分かれず、均一な水色1色で描画されていることを目視確認
- 同じ単語が複数あるテキストで単語をダブルクリック選択し、他の該当単語が黄色くハイライトされることを目視確認
