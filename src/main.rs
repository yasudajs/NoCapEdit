#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use chrono::Local;

#[derive(Debug, Serialize, Deserialize, Clone)]
struct AppSettings {
    home_folder: PathBuf,
    #[serde(default = "default_theme")]
    theme: String,
    #[serde(default = "default_font_size")]
    font_size: u32,
    #[serde(default = "default_font_family")]
    font_family: String,
}

fn default_theme() -> String {
    "dark".to_string()
}

fn default_font_size() -> u32 {
    13
}

fn default_font_family() -> String {
    "default".to_string()
}

#[derive(Debug, Serialize)]
struct SettingsResponse {
    home_folder: String,
    theme: String,
    font_size: u32,
    font_family: String,
    is_first_launch: bool,
    home_folder_exists: bool,
}

#[derive(Debug, Serialize)]
struct FileInfo {
    file_name: String,
    file_path: String,
}

impl AppSettings {
    fn config_path() -> PathBuf {
        let app_data = dirs::config_dir().unwrap_or_else(|| PathBuf::from("."));
        app_data.join("NoCapEdit").join("config.json")
    }

    fn load() -> Self {
        if let Ok(content) = fs::read_to_string(Self::config_path()) {
            if let Ok(settings) = serde_json::from_str(&content) {
                return settings;
            }
        }
        Self::default()
    }

    fn save(&self) -> Result<(), Box<dyn std::error::Error>> {
        let config_path = Self::config_path();
        if let Some(parent) = config_path.parent() {
            fs::create_dir_all(parent)?;
        }
        let json = serde_json::to_string_pretty(self)?;
        fs::write(config_path, json)?;
        Ok(())
    }

    fn exists() -> bool {
        Self::config_path().exists()
    }
}

impl Default for AppSettings {
    fn default() -> Self {
        let documents = dirs::document_dir()
            .unwrap_or_else(|| PathBuf::from(env!("USERPROFILE")));
        Self {
            home_folder: documents.join("nce"),
            theme: default_theme(),
            font_size: default_font_size(),
            font_family: default_font_family(),
        }
    }
}

fn normalize_crlf(content: &str) -> String {
    let lf = content.replace("\r\n", "\n").replace('\r', "\n");
    lf.replace('\n', "\r\n")
}

fn next_available_file_path(home_folder: &PathBuf) -> Result<(String, PathBuf), String> {
    let base = Local::now().format("%Y%m%d_%H%M%S").to_string();
    let mut index = 0u32;

    loop {
        let file_name = if index == 0 {
            format!("{}.nctx", base)
        } else {
            format!("{}_{:02}.nctx", base, index)
        };

        let file_path = home_folder.join(&file_name);
        if !file_path.exists() {
            return Ok((file_name, file_path));
        }

        index += 1;
        if index > 99 {
            return Err("同名ファイル回避の上限に達しました".to_string());
        }
    }
}

#[tauri::command]
fn get_settings() -> SettingsResponse {
    let settings = AppSettings::load();
    SettingsResponse {
        home_folder: settings.home_folder.to_string_lossy().to_string(),
        theme: settings.theme,
        font_size: settings.font_size,
        font_family: settings.font_family,
        is_first_launch: !AppSettings::exists(),
        home_folder_exists: settings.home_folder.exists(),
    }
}

#[tauri::command]
fn save_settings(home_folder: PathBuf, theme: String, font_size: u32, font_family: String) -> Result<(), String> {
    let settings = AppSettings {
        home_folder: home_folder.clone(),
        theme,
        font_size,
        font_family,
    };
    
    // ホームフォルダが存在しなければ作成
    fs::create_dir_all(&home_folder).map_err(|e| e.to_string())?;
    
    settings.save().map_err(|e| e.to_string())
}

#[tauri::command]
fn create_auto_file(home_folder: PathBuf) -> Result<FileInfo, String> {
    fs::create_dir_all(&home_folder).map_err(|e| e.to_string())?;

    let (file_name, file_path) = next_available_file_path(&home_folder)?;
    fs::write(&file_path, "").map_err(|e| e.to_string())?;

    Ok(FileInfo {
        file_name,
        file_path: file_path.to_string_lossy().to_string(),
    })
}

#[tauri::command]
fn read_text_file(file_path: PathBuf) -> Result<String, String> {
    fs::read_to_string(file_path).map_err(|e| e.to_string())
}

#[tauri::command]
fn save_text_file(file_path: PathBuf, content: String) -> Result<(), String> {
    let parent = file_path
        .parent()
        .ok_or_else(|| "保存先パスが不正です".to_string())?
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
fn delete_text_file(file_path: PathBuf) -> Result<(), String> {
    if file_path.exists() {
        fs::remove_file(file_path).map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[tauri::command]
fn exit_app(app: tauri::AppHandle) {
    app.exit(0);
}

#[tauri::command]
fn get_launch_file() -> Option<String> {
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
struct SystemFontInfo {
    family: String,
    is_monospace: bool,
}

#[tauri::command]
fn get_system_fonts() -> Vec<SystemFontInfo> {
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
fn apply_theme(window: tauri::Window, theme: String) -> Result<(), String> {
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

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            get_settings,
            save_settings,
            create_auto_file,
            read_text_file,
            save_text_file,
            delete_text_file,
            exit_app,
            get_launch_file,
            apply_theme,
            get_system_fonts
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
