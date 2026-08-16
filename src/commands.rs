use serde::Serialize;
use std::fs;
use std::path::PathBuf;

use crate::settings::{AppSettings, SettingsResponse};
use crate::FILE_EXTENSION;

#[derive(Debug, Serialize)]
pub struct FileInfo {
    pub file_name: String,
    pub file_path: String,
}

fn normalize_crlf(content: &str) -> String {
    let lf = content.replace("\r\n", "\n").replace('\r', "\n");
    lf.replace('\n', "\r\n")
}

fn next_available_file_path(home_folder: &PathBuf, timestamp: &str) -> Result<(String, PathBuf), String> {
    let base = timestamp.to_string();
    let mut index = 0u32;

    loop {
        let file_name = if index == 0 {
            format!("{}{}", base, FILE_EXTENSION)
        } else {
            format!("{}_{}{}", base, index, FILE_EXTENSION)
        };

        let file_path = home_folder.join(&file_name);
        if !file_path.exists() {
            return Ok((file_name, file_path));
        }

        index += 1;
        if index > 9 {
            return Err("fs.error.maxLimitReached".to_string());
        }
    }
}

#[tauri::command]
pub fn get_settings() -> SettingsResponse {
    let settings = AppSettings::load();
    SettingsResponse {
        home_folder: settings.home_folder.to_string_lossy().to_string(),
        theme: settings.theme,
        font_size: settings.font_size,
        font_family: settings.font_family,
        line_height: settings.line_height,
        tab_behavior: settings.tab_behavior,
        save_mode: settings.save_mode,
        char_count_mode: settings.char_count_mode,
        word_wrap: settings.word_wrap,
        is_first_launch: !AppSettings::exists(),
        home_folder_exists: settings.home_folder.exists(),
        app_version: env!("CARGO_PKG_VERSION").to_string(),
    }
}

#[tauri::command]
pub fn save_settings(
    settings: AppSettings,
) -> Result<(), String> {
    // ホームフォルダが存在しなければ作成
    fs::create_dir_all(&settings.home_folder).map_err(|e| e.to_string())?;
    
    settings.save().map_err(|e| e.to_string())
}

#[tauri::command]
pub fn create_and_save_file(
    home_folder: PathBuf,
    timestamp: String,
    content: String,
) -> Result<FileInfo, String> {
    fs::create_dir_all(&home_folder).map_err(|e| e.to_string())?;

    let (file_name, file_path) = next_available_file_path(&home_folder, &timestamp)?;

    // 内容を正規化してアトミック書き込み
    let normalized = normalize_crlf(&content);
    let tmp_path = file_path.with_extension("tmp");
    fs::write(&tmp_path, &normalized).map_err(|e| e.to_string())?;
    fs::rename(&tmp_path, &file_path).map_err(|e| e.to_string())?;

    Ok(FileInfo {
        file_name,
        file_path: file_path.to_string_lossy().to_string(),
    })
}

#[tauri::command]
pub fn read_text_file(file_path: PathBuf) -> Result<String, String> {
    fs::read_to_string(file_path).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn save_text_file(file_path: PathBuf, content: String) -> Result<(), String> {
    let parent = file_path
        .parent()
        .ok_or_else(|| "fs.error.invalidPath".to_string())?
        .to_path_buf();
    fs::create_dir_all(parent).map_err(|e| e.to_string())?;

    let normalized = normalize_crlf(&content);
    let tmp_path = file_path.with_extension("tmp");

    fs::write(&tmp_path, normalized).map_err(|e| e.to_string())?;

    if file_path.exists() {
        fs::remove_file(&file_path).map_err(|e| e.to_string())?;
    }
    fs::rename(&tmp_path, &file_path).map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
pub fn delete_text_file(file_path: PathBuf) -> Result<(), String> {
    if file_path.exists() {
        fs::remove_file(file_path).map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[tauri::command]
pub fn exit_app(app: tauri::AppHandle) {
    app.exit(0);
}

#[tauri::command]
pub fn get_launch_file() -> Option<String> {
    crate::cli::parse_launch_file_arg()
}

#[derive(Debug, Serialize, Clone, PartialEq, Eq)]
pub struct SystemFontInfo {
    family: String,
    is_monospace: bool,
}

#[tauri::command]
pub fn get_system_fonts() -> Vec<SystemFontInfo> {
    let mut db = fontdb::Database::new();
    db.load_system_fonts();
    
    let mut fonts: Vec<SystemFontInfo> = db.faces()
        .filter_map(|face| {
            face.families.first().map(|(name, _)| SystemFontInfo {
                family: name.clone(),
                is_monospace: face.monospaced,
            })
        })
        .collect();
    
    fonts.sort_by(|a, b| a.family.cmp(&b.family));
    fonts.dedup_by(|a, b| a.family == b.family);
    fonts
}

#[tauri::command]
pub fn apply_theme(window: tauri::Window, theme: String) -> Result<(), String> {
    let is_dark = theme != "light";
    crate::theme::apply_to_window(&window, is_dark)
}

#[tauri::command]
pub fn is_debug() -> bool {
    cfg!(debug_assertions)
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs::File;

    #[test]
    fn test_next_available_file_path_single_digit_sequence() {
        let temp_dir = std::env::temp_dir().join(format!("nocapedit_test_{}", uuid::Uuid::new_v4()));
        fs::create_dir_all(&temp_dir).unwrap();

        let ts = "20260816_120000";

        // 1. 重複なし
        let (name0, path0) = next_available_file_path(&temp_dir, ts).unwrap();
        assert_eq!(name0, format!("{}.nctx", ts));
        File::create(&path0).unwrap();

        // 2. 1回目重複 -> _1
        let (name1, path1) = next_available_file_path(&temp_dir, ts).unwrap();
        assert_eq!(name1, format!("{}_1.nctx", ts));
        File::create(&path1).unwrap();

        // 3. 2〜9回目重複 -> _2 .. _9
        for i in 2..=9 {
            let (name, path) = next_available_file_path(&temp_dir, ts).unwrap();
            assert_eq!(name, format!("{}_{}.nctx", ts, i));
            File::create(&path).unwrap();
        }

        // 4. 10回目重複（上限超過） -> エラー
        let err = next_available_file_path(&temp_dir, ts).unwrap_err();
        assert_eq!(err, "fs.error.maxLimitReached");

        // 後始末
        let _ = fs::remove_dir_all(&temp_dir);
    }
}

