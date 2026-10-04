# ウォークスルー: 行数表示時の境界線余白削除およびルーラー位置整合化 (v2.12.1)

## 1. 概要
行番号表示時におけるエディタ本文左側の余白（16px）を削除して `0px` とし、行番号境界線（ガター右端の縦線）とルーラーの目盛り「0」（およびルーラースペーサー右境界線）が完全に一直線に揃うように改修を行いました。
行番号非表示時は従来どおり左側余白 `16px` を維持します。

---

## 2. 変更内容の詳細

### ① CSS スタイル定義 (`src/frontend/style.css`)
- `.editor.has-line-numbers .cm-line` および `.editor:has(.cm-gutters) .cm-line` に対して `padding: 0 16px 0 0` を適用。
- 行番号非表示時の `.editor .cm-line` は `padding: 0 16px`（左余白 16px）を維持。

### ② CodeMirror テーマおよびクラス制御 (`src/frontend/js/ui/codemirror.js`)
- `baseTheme` に行番号表示時の左余白 0px ルール（`&.has-line-numbers .cm-line, &:has(.cm-gutters) .cm-line`）を追加。
- `initCodeMirror` および `updateLineNumbers(enable)` において、エディタDOMおよびコンテナ要素に `.has-line-numbers` クラスを動的に付け外しする処理を追加。

### ③ ルーラーのフォールバック計算調整 (`src/frontend/js/ui/ruler.js`)
- `getGutterOffset()` 内のフォールバック計算において、行番号表示時（ガターが存在する場合）の計算値を `gutters.offsetWidth`（余白 0px）に更新。行番号非表示時は従来どおり `16px` を維持。

---

## 3. 動作仕様の比較

| 状態 | 左側余白（padding-left） | ルーラースペーサー幅 | ルーラー「0」と境界線の位置関係 |
|---|---|---|---|
| **行数非表示時** | `16px`（従来通り維持） | `16px` | エディタ左端から 16px の位置から目盛り開始 |
| **行数表示時** | **`0px`（無し）** | **ガター幅そのもの** | **行数境界線とルーラー目盛り「0」および境界線が一直線に一致** |

- 行数表示時の選択行ハイライト（`.cm-selectionBackground`）も境界線の直後から途切れず描画されます。
- 行数表示/非表示の切り替え（ショートカット `Alt + L` や設定画面）に即座に追従します。

---

## 4. 検証結果

- **フロントエンドビルド**: `npm run build` が正常完了（エラー・警告なし）。
- **Rustバックエンドチェック**: `cargo check` が正常通過（NoCapEdit v2.12.1）。
- **ユニットテスト**: `cargo test` 全8件が PASS（0 failed）。
- **バージョン管理**: 5つの管理ファイル（`Cargo.toml`, `package.json`, `tauri.conf.json`, `nsis/installer.nsi`, `docs/DEVELOPMENT.md`）を `v2.12.1` に更新。
