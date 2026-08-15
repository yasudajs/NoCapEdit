#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

mod settings;
use settings::{AppSettings, APP_DIR_NAME};
mod instance;
mod commands;
mod cli;
mod theme;

// ウィンドウ設定
const WINDOW_WIDTH: f64 = 900.0;
const WINDOW_HEIGHT: f64 = 600.0;
const WINDOW_MIN_WIDTH: f64 = 400.0;
const WINDOW_MIN_HEIGHT: f64 = 300.0;

pub const FILE_EXTENSION: &str = ".nctx";



fn main() {
    let file_arg = cli::parse_launch_file_arg();

    if !instance::check_primary_or_forward(file_arg.as_ref()) {
        std::process::exit(0);
    }

    tauri::Builder::default()
        .setup(|app| {
            let app_handle = app.handle();
            instance::start_instance_listener(app_handle);

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
            .visible(true)
            .build()?;
            
            // デバッグ用: 起動時にDevToolsを開く
            #[cfg(debug_assertions)]
            window.open_devtools();
            
            // 起動時のテーマを適用
            let settings = AppSettings::load();
            let theme = settings.theme;
            let is_dark = theme != "light";
            
            let _ = theme::apply_to_window(&window, is_dark);
            
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
