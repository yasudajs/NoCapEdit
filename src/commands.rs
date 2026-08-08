use serde::Serialize;
use std::fs;
use std::path::PathBuf;

use crate::settings::{AppSettings, SettingsResponse};
use crate::FILE_EXTENSION;

#[derive(Debug, Serialize)]
pub struct FileInfo {
    file_name: String,
    file_path: String,
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
            format!("{}_{:02}{}", base, index, FILE_EXTENSION)
        };

        let file_path = home_folder.join(&file_name);
        if !file_path.exists() {
            return Ok((file_name, file_path));
        }

        index += 1;
        if index > 99 {
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
    let args: Vec<String> = std::env::args().collect();
    if args.len() > 1 {
        let path = &args[1];
        if std::path::Path::new(path).is_file() {
            return Some(path.clone());
        }
    }
    None
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
    
    #[cfg(target_os = "windows")]
    {
        use windows_sys::Win32::Graphics::Dwm::{DwmSetWindowAttribute, DWMWA_USE_IMMERSIVE_DARK_MODE};
        use windows_sys::Win32::Foundation::HWND;

        if let Ok(hwnd) = window.hwnd() {
            let hwnd_raw = hwnd.0 as HWND;
            let value = if is_dark { 1i32 } else { 0i32 };
            unsafe {
                DwmSetWindowAttribute(
                    hwnd_raw,
                    DWMWA_USE_IMMERSIVE_DARK_MODE as u32,
                    &value as *const _ as *const _,
                    std::mem::size_of::<i32>() as u32,
                );
            }
        }
    }
    
    Ok(())
}

#[tauri::command]
pub fn is_debug() -> bool {
    cfg!(debug_assertions)
}
