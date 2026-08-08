pub fn apply_to_window(window: &tauri::Window, is_dark: bool) -> Result<(), String> {
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
