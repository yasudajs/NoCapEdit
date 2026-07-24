use std::path::{Path, PathBuf};
use crate::error_messages;

/// 指定された `target_path` が実際に存在し、かつ `base_dir` 配下に安全に含まれているか検証します。
/// 
/// 成功した場合は正規化済み（`canonicalize` 済み）の `PathBuf` を返します。
pub fn verify_safe_path(target_path: &Path, base_dir: &Path) -> Result<PathBuf, String> {
    let target_canon = target_path
        .canonicalize()
        .map_err(|e| e.to_string())?;
    
    let base_canon = base_dir
        .canonicalize()
        .map_err(|e| e.to_string())?;

    if !target_canon.starts_with(&base_canon) {
        return Err(error_messages::ERR_UNAUTHORIZED_PATH.to_string());
    }

    Ok(target_canon)
}

/// まだ存在しないファイル・ディレクトリを含む `target_path` について、
/// その親ディレクトリが `base_dir` 配下に安全に含まれているか検証します。
/// 
/// 成功した場合は、親ディレクトリが正規化された上で結合された安全な `PathBuf` を返します。
pub fn verify_safe_parent_path(target_path: &Path, base_dir: &Path) -> Result<PathBuf, String> {
    let parent = target_path
        .parent()
        .ok_or_else(|| error_messages::ERR_PARENT_DIR_NOT_FOUND.to_string())?;

    let canon_parent = verify_safe_path(parent, base_dir)?;
    
    let file_name = target_path
        .file_name()
        .ok_or_else(|| error_messages::ERR_INVALID_FILE_NAME.to_string())?;

    let full_path = canon_parent.join(file_name);

    let base_canon = base_dir
        .canonicalize()
        .map_err(|e| e.to_string())?;

    if !full_path.starts_with(&base_canon) {
        return Err(error_messages::ERR_UNAUTHORIZED_PATH.to_string());
    }

    Ok(full_path)
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;

    #[test]
    fn test_verify_safe_path_valid() {
        let temp_dir = std::env::temp_dir().join("nocapedit_sec_test_valid");
        let sub_dir = temp_dir.join("sub");
        let file_path = sub_dir.join("test.txt");

        fs::create_dir_all(&sub_dir).unwrap();
        fs::write(&file_path, "hello").unwrap();

        let result = verify_safe_path(&file_path, &temp_dir);
        assert!(result.is_ok());

        let _ = fs::remove_dir_all(&temp_dir);
    }

    #[test]
    fn test_verify_safe_path_traversal() {
        let temp_dir = std::env::temp_dir().join("nocapedit_sec_test_traversal");
        let sub_dir = temp_dir.join("sub");
        let outside_dir = temp_dir.join("outside");
        let outside_file = outside_dir.join("secret.txt");

        fs::create_dir_all(&sub_dir).unwrap();
        fs::create_dir_all(&outside_dir).unwrap();
        fs::write(&outside_file, "secret").unwrap();

        // sub_dir を base_dir として外部ファイルを検証
        let result = verify_safe_path(&outside_file, &sub_dir);
        assert!(result.is_err());
        assert_eq!(result.unwrap_err(), error_messages::ERR_UNAUTHORIZED_PATH);

        let _ = fs::remove_dir_all(&temp_dir);
    }

    #[test]
    fn test_verify_safe_parent_path_new_file() {
        let temp_dir = std::env::temp_dir().join("nocapedit_sec_test_parent");
        fs::create_dir_all(&temp_dir).unwrap();

        let new_file_path = temp_dir.join("new_file.txt");
        assert!(!new_file_path.exists());

        let result = verify_safe_parent_path(&new_file_path, &temp_dir);
        assert!(result.is_ok());

        let _ = fs::remove_dir_all(&temp_dir);
    }
}
