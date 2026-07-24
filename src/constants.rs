// 一重起動（プロセス間通信）設定
pub const SINGLE_INSTANCE_PORT: u16 = 49423;
pub const SINGLE_INSTANCE_HOST: &str = "127.0.0.1";

// ウィンドウ設定
pub const WINDOW_WIDTH: f64 = 900.0;
pub const WINDOW_HEIGHT: f64 = 600.0;
pub const WINDOW_MIN_WIDTH: f64 = 400.0;
pub const WINDOW_MIN_HEIGHT: f64 = 300.0;

// デフォルト設定
pub const DEFAULT_THEME: &str = "dark";
pub const DEFAULT_FONT_SIZE: u32 = 13;
pub const DEFAULT_FONT_FAMILY: &str = "default";
pub const DEFAULT_LINE_HEIGHT: f32 = 1.5;
pub const DEFAULT_TAB_BEHAVIOR: &str = "tab";
pub const DEFAULT_SAVE_MODE: &str = "auto";
pub const DEFAULT_CHAR_COUNT_MODE: &str = "with_newline";
pub const DEFAULT_SIDEBAR_VISIBLE: bool = false;
pub const DEFAULT_SIDEBAR_WIDTH: u32 = 220;

// パス・ファイル関連設定
pub const APP_DIR_NAME: &str = "NoCapEdit";
pub const HOME_DIR_NAME: &str = "nce";
pub const FILE_EXTENSION: &str = ".nctx";

// サイドバーツリーで表示許可する拡張子リスト
pub const ALLOWED_TREE_EXTENSIONS: &[&str] = &["txt", "md", "nctx", "json", "csv"];

// 同名ファイル・フォルダの連番回避上限数
pub const MAX_FILE_NUMBERING_INDEX: u32 = 9;

// 空ディレクトリ判定でスキップするOS自動生成メタデータファイル名リスト
pub const IGNORED_METADATA_FILES: &[&str] = &[
    ".DS_Store",
    "Thumbs.db",
    "desktop.ini",
    ".Trashes",
];

// 空ディレクトリ判定でスキップするOS自動生成メタデータファイルのプレフィックス
pub const IGNORED_METADATA_PREFIXES: &[&str] = &[
    "._",
];

