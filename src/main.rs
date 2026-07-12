#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use std::sync::Mutex;
use notify::{RecommendedWatcher, Watcher, RecursiveMode, Event};

use tauri::Manager;
use std::io::{Read, Write};
use std::net::{TcpListener, TcpStream};
use std::thread;

struct WatcherState {
    watcher: Option<RecommendedWatcher>,
    current_path: Option<PathBuf>,
}

struct WatcherManager(Mutex<WatcherState>);

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
    #[serde(default = "default_sidebar_visible")]
    sidebar_visible: bool,
    #[serde(default = "default_sidebar_width")]
    sidebar_width: u32,
}

fn default_sidebar_visible() -> bool {
    false
}

fn default_sidebar_width() -> u32 {
    220
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

#[derive(Debug, Serialize)]
struct TreeFileInfo {
    file_name: String,
    file_path: String,
    is_dir: bool,
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
            sidebar_visible: default_sidebar_visible(),
            sidebar_width: default_sidebar_width(),
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

#[derive(serde::Serialize, Clone)]
struct FileChangeEventPayload {
    event_type: String, // "create", "remove", "rename", "modify"
    detail: String,     // "from", "to", "both", "" など
    paths: Vec<String>,
}

fn handle_watch_event(app_handle: &tauri::AppHandle, event: Event) {
    use notify::event::{EventKind, ModifyKind, RenameMode};
    
    // デバッグログ出力（ユーザー環境調査用）
    if let Ok(mut file) = std::fs::OpenOptions::new().create(true).append(true).open("debug_notify.log") {
        use std::io::Write;
        let _ = writeln!(file, "Raw Event: {:?}", event);
    }

    let (event_type, detail) = match event.kind {
        EventKind::Create(_) => ("create", ""),
        EventKind::Remove(_) => ("remove", ""),
        EventKind::Modify(ModifyKind::Name(mode)) => {
            match mode {
                RenameMode::From => ("rename", "from"),
                RenameMode::To => ("rename", "to"),
                RenameMode::Both => ("rename", "both"),
                _ => ("rename", "other"),
            }
        },
        EventKind::Modify(_) => ("modify", ""),
        _ => return, // 他のイベントは無視
    };

    let paths: Vec<String> = event.paths.iter()
        .map(|p| p.to_string_lossy().to_string())
        .collect();

    if !paths.is_empty() {
        let payload = FileChangeEventPayload {
            event_type: event_type.to_string(),
            detail: detail.to_string(),
            paths,
        };
        let _ = app_handle.emit_all("file-system-changed", payload);
    }
}

fn start_watching(app_handle: &tauri::AppHandle, path: PathBuf) -> Result<(), String> {
    let state = app_handle.state::<WatcherManager>();
    let mut lock = state.0.lock().map_err(|e| e.to_string())?;

    // すでに同じパスを監視中なら何もしない
    if let Some(ref current) = lock.current_path {
        if current == &path {
            return Ok(());
        }
    }

    // 古い監視を停止
    if let Some(mut old_watcher) = lock.watcher.take() {
        if let Some(ref old_path) = lock.current_path {
            let _ = old_watcher.unwatch(old_path);
        }
    }

    let app_handle_clone = app_handle.clone();

    // 新しい監視の作成
    let mut watcher = RecommendedWatcher::new(move |res| {
        match res {
            Ok(event) => {
                handle_watch_event(&app_handle_clone, event);
            }
            Err(e) => eprintln!("watch error: {:?}", e),
        }
    }, notify::Config::default()).map_err(|e| e.to_string())?;

    // パスが存在することを確認した上で監視
    if path.exists() {
        watcher.watch(&path, RecursiveMode::Recursive).map_err(|e| e.to_string())?;
    }

    lock.watcher = Some(watcher);
    lock.current_path = Some(path);

    Ok(())
}

#[tauri::command]
fn save_settings(
    settings: AppSettings,
    app_handle: tauri::AppHandle,
) -> Result<(), String> {
    // ホームフォルダが存在しなければ作成
    fs::create_dir_all(&settings.home_folder).map_err(|e| e.to_string())?;
    
    let home_folder = settings.home_folder.clone();
    settings.save().map_err(|e| e.to_string())?;

    // 監視パスの切り替え
    let _ = start_watching(&app_handle, home_folder);

    Ok(())
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
fn read_directory(path: Option<String>) -> Result<Vec<TreeFileInfo>, String> {
    let settings = AppSettings::load();
    let home_folder = settings.home_folder;
    
    let target_path = if let Some(p) = path {
        PathBuf::from(p)
    } else {
        home_folder.clone()
    };

    if !target_path.exists() {
        return Ok(Vec::new());
    }

    // セキュリティチェック: target_path が home_folder の配下にあること
    let target_canon = target_path.canonicalize().map_err(|e| e.to_string())?;
    let home_canon = home_folder.canonicalize().map_err(|e| e.to_string())?;
    if !target_canon.starts_with(&home_canon) {
        return Err("アクセスが許可されていないディレクトリです".to_string());
    }

    let mut result = Vec::new();
    let entries = fs::read_dir(target_canon).map_err(|e| e.to_string())?;

    for entry in entries.flatten() {
        let path = entry.path();
        let is_dir = path.is_dir();
        
        let file_name = if let Some(name) = path.file_name() {
            name.to_string_lossy().to_string()
        } else {
            continue;
        };

        if !is_dir {
            // 許可された拡張子のみ
            if let Some(ext) = path.extension() {
                let ext_str = ext.to_string_lossy().to_lowercase();
                if !["txt", "md", "nctx", "json", "csv"].contains(&ext_str.as_str()) {
                    continue;
                }
            } else {
                continue;
            }
        }

        result.push(TreeFileInfo {
            file_name,
            file_path: path.to_string_lossy().to_string(),
            is_dir,
        });
    }

    // ソート: フォルダが先、ファイルが後。それぞれアルファベット順
    result.sort_by(|a, b| {
        match (a.is_dir, b.is_dir) {
            (true, false) => std::cmp::Ordering::Less,
            (false, true) => std::cmp::Ordering::Greater,
            _ => a.file_name.to_lowercase().cmp(&b.file_name.to_lowercase()),
        }
    });

    Ok(result)
}

#[tauri::command]
fn delete_text_file(file_path: PathBuf) -> Result<(), String> {
    if file_path.exists() {
        fs::remove_file(file_path).map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[tauri::command]
fn create_file_or_dir(parent_path: String, name: String, is_dir: bool) -> Result<String, String> {
    let settings = AppSettings::load();
    let home_folder = settings.home_folder;
    let parent = if parent_path.is_empty() {
        home_folder.clone()
    } else {
        PathBuf::from(parent_path)
    };

    // セキュリティチェック
    let canon_parent = parent.canonicalize().map_err(|e| e.to_string())?;
    let canon_home = home_folder.canonicalize().map_err(|e| e.to_string())?;
    if !canon_parent.starts_with(&canon_home) {
        return Err("アクセスが許可されていないパスです".to_string());
    }

    let mut target_path = canon_parent.join(&name);

    if is_dir {
        // フォルダの連番衝突回避
        let mut count = 0;
        while target_path.exists() {
            count += 1;
            let final_name = format!("{}_{:02}", name, count);
            target_path = canon_parent.join(&final_name);
        }
        fs::create_dir(&target_path).map_err(|e| e.to_string())?;
    } else {
        // ファイルの連番衝突回避
        let path_for_ext = PathBuf::from(&name);
        let ext = path_for_ext.extension()
            .map(|e| e.to_string_lossy().to_string())
            .unwrap_or_else(|| "nctx".to_string());
        
        let stem = path_for_ext.file_stem()
            .map(|s| s.to_string_lossy().to_string())
            .unwrap_or_else(|| "名称未設定".to_string());

        let mut count = 0;
        while target_path.exists() {
            count += 1;
            let final_name = format!("{}_{:02}.{}", stem, count, ext);
            target_path = canon_parent.join(&final_name);
        }
        fs::write(&target_path, "").map_err(|e| e.to_string())?;
    }

    Ok(target_path.to_string_lossy().to_string())
}

#[tauri::command]
fn rename_file_or_dir(old_path: String, new_name: String) -> Result<String, String> {
    let settings = AppSettings::load();
    let home_folder = settings.home_folder;
    let old = PathBuf::from(old_path);

    // セキュリティチェック
    let canon_old = old.canonicalize().map_err(|e| e.to_string())?;
    let canon_home = home_folder.canonicalize().map_err(|e| e.to_string())?;
    if !canon_old.starts_with(&canon_home) {
        return Err("アクセスが許可されていないパスです".to_string());
    }

    let parent = canon_old.parent().ok_or_else(|| "親ディレクトリが見つかりません".to_string())?;
    let new_path = parent.join(&new_name);

    // セキュリティチェック（新しいパスも home_folder 配下にあること）
    if !new_path.starts_with(&canon_home) {
        return Err("アクセスが許可されていないパスです".to_string());
    }

    if new_path.exists() {
        return Err("同名のファイルまたはフォルダが既に存在します".to_string());
    }

    fs::rename(&canon_old, &new_path).map_err(|e| e.to_string())?;

    Ok(new_path.to_string_lossy().to_string())
}

#[tauri::command]
fn trash_file_or_dir(file_path: String) -> Result<(), String> {
    let settings = AppSettings::load();
    let home_folder = settings.home_folder;
    let path = PathBuf::from(file_path);

    // セキュリティチェック
    let canon_path = path.canonicalize().map_err(|e| e.to_string())?;
    let canon_home = home_folder.canonicalize().map_err(|e| e.to_string())?;
    if !canon_path.starts_with(&canon_home) {
        return Err("アクセスが許可されていないパスです".to_string());
    }

    trash::delete(canon_path).map_err(|e| e.to_string())?;
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
            let settings = AppSettings::load();
            let home_folder = settings.home_folder.clone();

            // WatcherState の初期化と管理登録
            app.manage(WatcherManager(Mutex::new(WatcherState {
                watcher: None,
                current_path: None,
            })));

            let app_handle = app.handle();
            start_instance_listener(app_handle.clone());

            // 起動時に監視を開始
            let app_handle_clone = app_handle.clone();
            tauri::async_runtime::spawn(async move {
                let _ = start_watching(&app_handle_clone, home_folder);
            });

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
            .visible(false)
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
            read_directory,
            create_file_or_dir,
            rename_file_or_dir,
            trash_file_or_dir,
            exit_app,
            get_launch_file,
            apply_theme,
            get_system_fonts
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
