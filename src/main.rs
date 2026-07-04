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
}

#[derive(Debug, Serialize)]
struct SettingsResponse {
    home_folder: String,
    is_first_launch: bool,
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
            format!("{}.txt", base)
        } else {
            format!("{}_{:02}.txt", base, index)
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
        is_first_launch: !AppSettings::exists(),
    }
}

#[tauri::command]
fn save_settings(home_folder: PathBuf) -> Result<(), String> {
    let settings = AppSettings {
        home_folder: home_folder.clone(),
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

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            get_settings,
            save_settings,
            create_auto_file,
            read_text_file,
            save_text_file,
            delete_text_file
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
