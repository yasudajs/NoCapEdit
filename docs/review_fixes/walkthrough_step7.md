# ウォークスルー: Step 7 ハイライト色・フォーカス色の CSS 変数化 🟡

## 変更概要
[`src/dist/style.css`](file:///c:/work/NoCapEdit/src/dist/style.css) において、検索ハイライト色、テキスト選択色、およびフォーカス枠の色を各テーマ定義（Dark / Light / Soft Dark）内の CSS 変数（`--search-match-bg`, `--search-current-bg`, `--editor-selection-bg`, `--focus-outline` 等）として集約・定義しました（W-5）。

## 変更ファイル
- [`src/dist/style.css`](file:///c:/work/NoCapEdit/src/dist/style.css)
  - `:root`, `body.light-theme`, `body.soft-dark-theme` にハイライト・選択・フォーカス色変数を追加
  - ハードコード箇所を `var(--xxx)` に置換

## 検証結果
- **ビルド確認**: `cargo check` 正常完了
- **CSS 整合性確認**: 各テーマで変数が定義され、ハードコード色が CSS 変数参照に統一されたことを確認
