#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;

use tauri::Manager;
use std::io::{Read, Write};
use std::net::{TcpListener, TcpStream};
use std::thread;

const SINGLE_INSTANCE_PORT: u16 = 49423;
const SINGLE_INSTANCE_HOST: &str = "127.0.0.1";

// ウィンドウ設定
const WINDOW_WIDTH: f64 = 900.0;
const WINDOW_HEIGHT: f64 = 600.0;
const WINDOW_MIN_WIDTH: f64 = 400.0;
const WINDOW_MIN_HEIGHT: f64 = 300.0;

// デフォルト設定
const DEFAULT_THEME: &str = "dark";
const DEFAULT_FONT_SIZE: u32 = 13;
const DEFAULT_FONT_FAMILY: &str = "default";
const DEFAULT_LINE_HEIGHT: f32 = 1.5;
const DEFAULT_TAB_BEHAVIOR: &str = "tab";
const DEFAULT_SAVE_MODE: &str = "auto";

// パス・ファイル関連設定
const APP_DIR_NAME: &str = "NoCapEdit";
const HOME_DIR_NAME: &str = "nce";
const FILE_EXTENSION: &str = ".nctx";


fn send_to_existing_instance(path: &str) -> bool {
    if let Ok(mut stream) = TcpStream::connect(format!("{}:{}", SINGLE_INSTANCE_HOST, SINGLE_INSTANCE_PORT)) {
        let _ = stream.write_all(path.as_bytes());
        true
    } else {
        false
    }
}

fn start_instance_listener(app_handle: tauri::AppHandle) {
    thread::spawn(move || {
        if let Ok(listener) = TcpListener::bind(format!("{}:{}", SINGLE_INSTANCE_HOST, SINGLE_INSTANCE_PORT)) {
            for stream in listener.incoming() {
                if let Ok(mut stream) = stream {
                    let mut buffer = [0; 1024];
                    if let Ok(size) = stream.read(&mut buffer) {
                        if size > 0 {
                            if let Ok(path) = std::str::from_utf8(&buffer[..size]) {
                                let path_str = path.to_string();
                                if let Some(window) = app_handle.get_window("main") {
                                    let _ = window.unminimize();
                                    let _ = window.set_focus();
                                    if !path_str.is_empty() {
                                        let _ = window.emit("single-instance-file", path_str);
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    });
}

#[derive(Debug, Serialize, Deserialize, Clone)]
struct AppSettings {
    home_folder: PathBuf,
    #[serde(default = "default_theme")]
    theme: String,
    #[serde(default = "default_font_size")]
    font_size: u32,
    #[serde(default = "default_font_family")]
    font_family: String,
    #[serde(default = "default_line_height")]
    line_height: f32,
    #[serde(default = "default_tab_behavior")]
    tab_behavior: String,
    #[serde(default = "default_save_mode")]
    save_mode: String,
    #[serde(default = "default_char_count_mode")]
    char_count_mode: String,
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

#[derive(Debug, Serialize)]
struct SettingsResponse {
    home_folder: String,
    theme: String,
    font_size: u32,
    font_family: String,
    line_height: f32,
    tab_behavior: String,
    save_mode: String,
    char_count_mode: String,
    is_first_launch: bool,
    home_folder_exists: bool,
    app_version: String,
}

#[derive(Debug, Serialize)]
struct FileInfo {
    file_name: String,
    file_path: String,
}

impl AppSettings {
    fn config_path() -> PathBuf {
        let app_data = dirs::config_dir().unwrap_or_else(|| PathBuf::from("."));
        app_data.join(APP_DIR_NAME).join("config.json")
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
            home_folder: documents.join(HOME_DIR_NAME),
            theme: default_theme(),
            font_size: default_font_size(),
            font_family: default_font_family(),
            line_height: default_line_height(),
            tab_behavior: default_tab_behavior(),
            save_mode: default_save_mode(),
            char_count_mode: default_char_count_mode(),
        }
    }
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
fn save_settings(
    home_folder: PathBuf,
    theme: String,
    font_size: u32,
    font_family: String,
    line_height: f32,
    tab_behavior: String,
    save_mode: String,
    char_count_mode: String,
) -> Result<(), String> {
    let settings = AppSettings {
        home_folder: home_folder.clone(),
        theme,
        font_size,
        font_family,
        line_height,
        tab_behavior,
        save_mode,
        char_count_mode,
    };
    
    // ホームフォルダが存在しなければ作成
    fs::create_dir_all(&home_folder).map_err(|e| e.to_string())?;
    
    settings.save().map_err(|e| e.to_string())
}

#[tauri::command]
fn create_and_save_file(
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
    let args: Vec<String> = std::env::args().collect();
    let file_arg = if args.len() > 1 {
        let path = &args[1];
        let path_buf = std::path::Path::new(path);
        let abs_path = if path_buf.is_absolute() {
            path_buf.to_path_buf()
        } else if let Ok(cwd) = std::env::current_dir() {
            cwd.join(path_buf)
        } else {
            path_buf.to_path_buf()
        };
        
        if abs_path.is_file() {
            Some(abs_path.to_string_lossy().to_string())
        } else {
            None
        }
    } else {
        None
    };

    // ポートバインドを試みて重複起動を判定
    let is_primary = match TcpListener::bind(format!("{}:{}", SINGLE_INSTANCE_HOST, SINGLE_INSTANCE_PORT)) {
        Ok(_) => true,
        Err(_) => false,
    };

    if !is_primary {
        if let Some(path) = file_arg {
            send_to_existing_instance(&path);
        } else {
            send_to_existing_instance("");
        }
        std::process::exit(0);
    }

    tauri::Builder::default()
        .setup(|app| {
            let app_handle = app.handle();
            start_instance_listener(app_handle);

            let window = tauri::WindowBuilder::new(
                app,
                "main",
                tauri::WindowUrl::App("index.html".into())
            )
            .title(format!("{} [ Ver {} ]", APP_DIR_NAME, env!("CARGO_PKG_VERSION")))
            .inner_size(WINDOW_WIDTH, WINDOW_HEIGHT)
            .min_inner_size(WINDOW_MIN_WIDTH, WINDOW_MIN_HEIGHT)
            .resizable(true)
            .fullscreen(false)
            .build()?;
            
            // 起動時のテーマを適用
            let settings = AppSettings::load();
            let theme = settings.theme;
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
        })
        .invoke_handler(tauri::generate_handler![
            get_settings,
            save_settings,
            create_and_save_file,
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
