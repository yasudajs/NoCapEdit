use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;

// デフォルト設定
const DEFAULT_THEME: &str = "dark";
const DEFAULT_FONT_SIZE: u32 = 13;
const DEFAULT_FONT_FAMILY: &str = "default";
const DEFAULT_LINE_HEIGHT: f32 = 1.5;
const DEFAULT_TAB_BEHAVIOR: &str = "tab";
const DEFAULT_SAVE_MODE: &str = "auto";

// パス・ファイル関連設定
pub const APP_DIR_NAME: &str = "NoCapEdit";
pub const HOME_DIR_NAME: &str = "nce";

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct AppSettings {
    pub home_folder: PathBuf,
    #[serde(default = "default_theme")]
    pub theme: String,
    #[serde(default = "default_font_size")]
    pub font_size: u32,
    #[serde(default = "default_font_family")]
    pub font_family: String,
    #[serde(default = "default_line_height")]
    pub line_height: f32,
    #[serde(default = "default_tab_behavior")]
    pub tab_behavior: String,
    #[serde(default = "default_save_mode")]
    pub save_mode: String,
    #[serde(default = "default_char_count_mode")]
    pub char_count_mode: String,
    #[serde(default = "default_word_wrap")]
    pub word_wrap: bool,
}

fn default_theme() -> String {
    DEFAULT_THEME.to_string()
}

fn default_font_size() -> u32 {
    DEFAULT_FONT_SIZE
}

fn default_font_family() -> String {
    DEFAULT_FONT_FAMILY.to_string()
}

fn default_line_height() -> f32 {
    DEFAULT_LINE_HEIGHT
}

fn default_tab_behavior() -> String {
    DEFAULT_TAB_BEHAVIOR.to_string()
}

fn default_save_mode() -> String {
    DEFAULT_SAVE_MODE.to_string()
}

fn default_char_count_mode() -> String {
    "with_newline".to_string()
}

fn default_word_wrap() -> bool {
    true
}

#[derive(Debug, Serialize)]
pub struct SettingsResponse {
    pub home_folder: String,
    pub theme: String,
    pub font_size: u32,
    pub font_family: String,
    pub line_height: f32,
    pub tab_behavior: String,
    pub save_mode: String,
    pub char_count_mode: String,
    pub word_wrap: bool,
    pub is_first_launch: bool,
    pub home_folder_exists: bool,
    pub app_version: String,
}

impl AppSettings {
    pub fn config_path() -> PathBuf {
        let app_data = dirs::config_dir().unwrap_or_else(|| PathBuf::from("."));
        app_data.join(APP_DIR_NAME).join("config.json")
    }

    pub fn load() -> Self {
        if let Ok(content) = fs::read_to_string(Self::config_path()) {
            if let Ok(settings) = serde_json::from_str(&content) {
                return settings;
            }
        }
        Self::default()
    }

    pub fn save(&self) -> Result<(), Box<dyn std::error::Error>> {
        let config_path = Self::config_path();
        if let Some(parent) = config_path.parent() {
            fs::create_dir_all(parent)?;
        }
        let json = serde_json::to_string_pretty(self)?;
        fs::write(config_path, json)?;
        Ok(())
    }

    pub fn exists() -> bool {
        Self::config_path().exists()
    }
}

impl Default for AppSettings {
    fn default() -> Self {
        let documents = dirs::document_dir()
            .unwrap_or_else(|| {
                let profile = std::env::var("USERPROFILE")
                    .or_else(|_| std::env::var("HOME"))
                    .unwrap_or_else(|_| ".".to_string());
                PathBuf::from(profile)
            });
        Self {
            home_folder: documents.join(HOME_DIR_NAME),
            theme: default_theme(),
            font_size: default_font_size(),
            font_family: default_font_family(),
            line_height: default_line_height(),
            tab_behavior: default_tab_behavior(),
            save_mode: default_save_mode(),
            char_count_mode: default_char_count_mode(),
            word_wrap: default_word_wrap(),
        }
    }
}
