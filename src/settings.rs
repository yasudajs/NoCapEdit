use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;

// デフォルト設定
const DEFAULT_THEME: &str = "dark";
const DEFAULT_FONT_SIZE: u32 = 20;
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
        let mut settings = if let Ok(content) = fs::read_to_string(Self::config_path()) {
            if let Ok(s) = serde_json::from_str(&content) {
                s
            } else {
                Self::default()
            }
        } else {
            Self::default()
        };

        // 異常値防止: フロントエンドの選択可能範囲と一致させてサニタイズ
        settings.font_size = settings.font_size.clamp(8, 72);
        settings.line_height = settings.line_height.clamp(1.0, 3.0);

        settings
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

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_settings_clamp_ranges() {
        let mut s = AppSettings::default();

        // 下限超過テスト
        s.font_size = 0;
        s.line_height = 0.5;
        s.font_size = s.font_size.clamp(8, 72);
        s.line_height = s.line_height.clamp(1.0, 3.0);
        assert_eq!(s.font_size, 8);
        assert_eq!(s.line_height, 1.0);

        // 上限超過テスト
        s.font_size = 999;
        s.line_height = 10.0;
        s.font_size = s.font_size.clamp(8, 72);
        s.line_height = s.line_height.clamp(1.0, 3.0);
        assert_eq!(s.font_size, 72);
        assert_eq!(s.line_height, 3.0);
    }
}
