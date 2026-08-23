#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

mod settings;
use settings::{AppSettings, APP_DIR_NAME};
mod commands;
mod cli;
mod theme;
use tauri::Manager;

// ウィンドウ設定
const WINDOW_WIDTH: f64 = 900.0;
const WINDOW_HEIGHT: f64 = 600.0;
const WINDOW_MIN_WIDTH: f64 = 400.0;
const WINDOW_MIN_HEIGHT: f64 = 300.0;

pub const FILE_EXTENSION: &str = ".nctx";

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_single_instance::init(|app, argv, cwd| {
            if let Some(window) = app.get_window("main") {
                let _ = window.unminimize();
                let _ = window.set_focus();

                if let Some(file_path) = cli::parse_file_arg_from_argv(&argv, Some(&cwd)) {
                    let _ = window.emit("single-instance-file", file_path);
                }
            }
        }))
        .setup(|app| {
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
            
            let _ = theme::apply_to_window(&window, is_dark);
            
            // 万が一フロントエンド側からの表示通知が届かなかった場合のフェイルセーフ
            let fallback_window = window.clone();
            std::thread::spawn(move || {
                std::thread::sleep(std::time::Duration::from_millis(1500));
                if let Ok(is_visible) = fallback_window.is_visible() {
                    if !is_visible {
                        let _ = fallback_window.show();
                    }
                }
            });

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::get_settings,
            commands::save_settings,
            commands::create_and_save_file,
            commands::read_text_file,
            commands::save_text_file,
            commands::delete_text_file,
            commands::exit_app,
            commands::get_launch_file,
            commands::apply_theme,
            commands::get_system_fonts,
            commands::is_debug
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
