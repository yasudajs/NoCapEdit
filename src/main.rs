#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;

#[derive(Debug, Serialize, Deserialize, Clone)]
struct AppSettings {
    home_folder: PathBuf,
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

#[tauri::command]
fn get_settings() -> AppSettings {
    AppSettings::load()
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

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            get_settings,
            save_settings
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
