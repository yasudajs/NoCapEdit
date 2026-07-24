# [実装計画書] 2-2. パス区切り文字のハードコード修正（クロスプラットフォーム対応）

## 概要
フロントエンド（JavaScript）全体に散在しているパス区切り文字のハードコード（`\` や `+ '/' +` による手動結合等）を解消し、`utils/helpers.js` に定義する共通ヘルパー関数（`joinPath` 等）へ一元化します。これにより、Windows / macOS / Linux のいずれのOS環境においても堅牢に動作するクロスプラットフォーム対応のパス処理構造を実現します。

## 変更内容

### [Component Name] フロントエンド Core & Helpers
#### [MODIFY] [helpers.js](file:///c:/work/NoCapEdit/src/dist/js/utils/helpers.js)
- `joinPath(...parts)` ヘルパー関数を新規追加します。
  - 各パーツのバックスラッシュ（`\`）をスラッシュ（`/`）へ変換
  - 先頭・末尾の重複するスラッシュを適切に処理して安全に結合
- 既存の `getParentPath`, `getFileNameFromPath`, `normalizePathForComparison` の処理を共通ロジックに整合させます。

### [Component Name] フロントエンド UI モジュール
#### [MODIFY] [sidebar.js](file:///c:/work/NoCapEdit/src/dist/js/ui/sidebar.js)
- ファイル/フォルダの作成、ドラッグ＆ドロップ移動、コピー＆ペースト、リネーム等の各処理において、手動で行われていた `destParentPath.replace(/\\/g, '/').replace(/\/$/, '') + '/' + fileName` 等のパス文字列結合を `joinPath()` に置き換えます。

#### [MODIFY] [sidebar-integration.js](file:///c:/work/NoCapEdit/src/dist/js/ui/sidebar-integration.js)
- サイドバーの外部イベント連携処理における手動パス結合・置換を `joinPath()` や共通ヘルパー関数へ置き換えます。

#### [MODIFY] [main.js](file:///c:/work/NoCapEdit/src/dist/js/main.js)
- リネーム時のパス末尾抽出等の手動文字列操作を共通ヘルパー関数へ置き換えます。

---

## 検証計画

### 自動テスト
- 現在の構成でビルドエラーや構文エラーが発生しないことを確認 (`cargo check` または `cargo tauri dev` での起動検証)

### 手動検証 (ユーザーテスト)
- サイドバーでのファイル・フォルダ作成
- サイドバーでの名前変更（リネーム）
- サイドバー内でのドラッグ＆ドロップによるファイル移動
- コピー＆ペースト（複製）動作
- ファイルの保存および開く動作の確認
