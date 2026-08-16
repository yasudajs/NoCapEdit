# 実装計画書: Step 10 変更履歴・ドキュメント更新と最終検証

## 概要
Ver 0.1.86（コードレビュー指摘事項・不具合修正）の全実装作業（Step 1 〜 Step 9）が完了したため、[`docs/history.md`](file:///c:/work/NoCapEdit/docs/history.md) に今回のバージョンの変更履歴を追記し、バージョン管理ファイル（4ファイル）の整合性確認、および全体のビルド検証を行います。

## 対象ファイル
- [`docs/history.md`](file:///c:/work/NoCapEdit/docs/history.md)
- [`docs/spec.md`](file:///c:/work/NoCapEdit/docs/spec.md)（必要に応じて更新確認）

## 修正内容の詳細

### 1. [MODIFY] [history.md](file:///c:/work/NoCapEdit/docs/history.md)
最上部に Ver 0.1.86 の改定履歴を追加します。

```markdown
### Ver 0.1.86 | 2026-08-16 | yasudajs
- コードレビュー指摘事項に基づく不具合修正・品質改善
  - **全件置換の特殊文字エスケープ不具合修正**: `findReplace.js` の `replaceAll` において、置換文字列内の `$` パターン（`$1`, `$&` 等）が正規表現パターンとして意図せず展開されるバグを修正
  - **置換ボタンのホバースタイル統一**: `index.html` および `style.css` において、[置換] ボタンの常時薄青色スタイルを解除し、マウスホバー時のみ薄青（アクセント色）に変化するよう統一
  - **input イベント二重発火防止**: `editor.js` の `applyEditorTextWithUndo` において、`execCommand` 成功時の手動 `input` イベント発火を削除し、再描画や自動保存タイマーリセットの二重実行を防止
  - **ショートカット判定の到達不能コード除去**: `shortcuts.js` のズーム拡大条件式から Dead Code（`|| (e.code === 'Semicolon' && e.shiftKey)`）を削除
  - **検索バー入力時のデバウンス導入**: `findReplace.js` のエディタ入力リスナーに 200ms デバウンスを導入し、検索バー表示中の高速入力パフォーマンスを改善
  - **Shift+Tab カーソル計算改善**: `editor.js` の `handleTabKey` において、複数行選択時の行ごとのインデント削除文字数を正確に累積・追跡し、選択範囲ズレを解消
  - **安全性強化とコメント整備**: `editor.js` の `applyWordWrap` に全タブ閉鎖時ガードの JSDoc を追加、および `applyEditorTextWithUndo` に `execCommand` 非推奨 API 使用の背景・注記コメントを追記
  - **ハイライト色・フォーカス色の CSS 変数化**: `style.css` の検索ハイライト色・選択色・フォーカス枠の色を各テーマ定義の CSS 変数（`--search-match-bg`, `--search-current-bg`, `--editor-selection-bg`, `--focus-outline` 等）へ集約
  - **テーマ値のホワイトリスト検証追加**: `help.js` において、URL パラメータから受け取るテーマ値のホワイトリストバリデーション（`['dark', 'soft-dark', 'light']`）を追加
```

### 2. バージョン管理ファイルの整合性確認
- `Cargo.toml`: `version = "0.1.86"`
- `tauri.conf.json`: `"version": "0.1.86"`
- `nsis/installer.nsi`: `VERSION "0.1.86"` / `VERSIONWITHBUILD "0.1.86.0"`
- `docs/DEVELOPMENT.md`: `NoCapEdit_v0.1.86_x64_portable.zip`

## 動作確認・検証計画

### 1. バージョン番号の整合性確認
- [ ] 4つのバージョン管理ファイルがすべて `0.1.86` で統一されていることを確認

### 2. ビルド・構文検証
- [ ] `cargo check` がエラーなく正常に完了することを確認
- [ ] `cargo build`（開発ビルド）が正常に完了することを確認

### 3. ドキュメント整合性確認
- [ ] `docs/history.md` に Ver 0.1.86 の変更内容が漏れなく記載されていることを確認
