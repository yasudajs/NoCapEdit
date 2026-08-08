#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

mod settings;
use settings::{AppSettings, APP_DIR_NAME};
mod instance;
mod commands;

// ウィンドウ設定
const WINDOW_WIDTH: f64 = 900.0;
const WINDOW_HEIGHT: f64 = 600.0;
const WINDOW_MIN_WIDTH: f64 = 400.0;
const WINDOW_MIN_HEIGHT: f64 = 300.0;

pub const FILE_EXTENSION: &str = ".nctx";



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
