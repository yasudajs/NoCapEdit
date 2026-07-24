//! バックエンドのエラーメッセージ定数定義

pub const ERR_UNAUTHORIZED_PATH: &str = "アクセスが許可されていないパスです";
pub const ERR_PARENT_DIR_NOT_FOUND: &str = "親ディレクトリが見つかりません";
pub const ERR_INVALID_FILE_NAME: &str = "ファイル名が不正です";
pub const ERR_SAME_NAME_EXISTS: &str = "同名のファイルまたはフォルダが既に存在します";
pub const ERR_NOT_FILE_OR_DIR: &str = "指定されたパスはファイルでもディレクトリではありません";
pub const ERR_CIRCULAR_MOVE: &str = "自分自身またはサブフォルダへは移動できません";
pub const ERR_CIRCULAR_COPY: &str = "自分自身またはサブフォルダへはコピーできません";
pub const ERR_NUMBERING_LIMIT_REACHED: &str = "同名ファイル回避の上限に達しました";
