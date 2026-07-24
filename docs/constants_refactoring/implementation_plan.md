# 実装計画書: 設定値・定数の一元管理 (`src/constants.rs` の導入)

## 概要
`src/main.rs` に直接記述されている各種定数（ウィンドウサイズ、一重起動通信ポート、デフォルト設定値、ファイルパス情報など）および各関数内のマジックナンバー（ファイルツリーの許可拡張子リスト、同名ファイルの連番作成上限など）を、新設する `src/constants.rs` に分離・一元管理します。

## ユーザー確認事項
- 今回のリファクタリングでは、機能変更や挙動の変更はなく、内部構造の整理（定数の抽出・モジュール化）のみを行います。

## 変更内容

### バックエンド (Rust)

#### [NEW] [constants.rs](file:///c:/work/NoCapEdit/src/constants.rs)
- 各種定数を `pub const` として集約定義：
  - 一重起動用設定 (`SINGLE_INSTANCE_PORT`, `SINGLE_INSTANCE_HOST`)
  - ウィンドウ設定 (`WINDOW_WIDTH`, `WINDOW_HEIGHT`, `WINDOW_MIN_WIDTH`, `WINDOW_MIN_HEIGHT`)
  - アプリデフォルト設定 (`DEFAULT_THEME`, `DEFAULT_FONT_SIZE`, `DEFAULT_FONT_FAMILY`, `DEFAULT_LINE_HEIGHT`, `DEFAULT_TAB_BEHAVIOR`, `DEFAULT_SAVE_MODE`, `DEFAULT_CHAR_COUNT_MODE`, `DEFAULT_SIDEBAR_VISIBLE`, `DEFAULT_SIDEBAR_WIDTH`)
  - パス・ファイル関連 (`APP_DIR_NAME`, `HOME_DIR_NAME`, `FILE_EXTENSION`)
  - 共通マジックナンバー (`ALLOWED_TREE_EXTENSIONS`: `["txt", "md", "nctx", "json", "csv"]`, `MAX_FILE_NUMBERING_INDEX`: `9`)

#### [MODIFY] [main.rs](file:///c:/work/NoCapEdit/src/main.rs)
- `mod constants;` を宣言。
- 冒頭の個別 `const` 定義を削除し、`constants::` 経由で参照するよう変更。
- `read_directory` や `next_available_file_path`, `move_file_or_dir`, `copy_file_or_dir` 内のハードコード定数を `constants::` 参照に変更。

---

## 検証計画

### 自動テスト・ビルド検証
- `cargo check` および `cargo build` を実行し、型チェック・コンパイルエラーがないことを確認する。

### 手動検証
- アプリケーションが問題なく起動し、デフォルト設定やウィンドウサイズが正しく反映されること。
- 新規ファイルの作成・同名ファイル保存時の連番処理が正常に機能すること。
- サイドバーのファイルツリーで対象拡張子のファイルが正しく表示されること。
