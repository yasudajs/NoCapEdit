use std::io::{Read, Write};
use std::net::{TcpListener, TcpStream};
use std::thread;
use tauri::Manager;

const SINGLE_INSTANCE_PORT: u16 = 49423;
const SINGLE_INSTANCE_HOST: &str = "127.0.0.1";

pub fn send_to_existing_instance(path: &str) -> bool {
    if let Ok(mut stream) = TcpStream::connect(format!("{}:{}", SINGLE_INSTANCE_HOST, SINGLE_INSTANCE_PORT)) {
        let _ = stream.write_all(path.as_bytes());
        true
    } else {
        false
    }
}

pub fn start_instance_listener(app_handle: tauri::AppHandle) {
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

pub fn check_primary_or_forward(file_arg: Option<&String>) -> bool {
    let is_primary = match TcpListener::bind(format!("{}:{}", SINGLE_INSTANCE_HOST, SINGLE_INSTANCE_PORT)) {
        Ok(_) => true,
        Err(_) => false,
    };

    if !is_primary {
        if let Some(path) = file_arg {
            send_to_existing_instance(path);
        } else {
            send_to_existing_instance("");
        }
        false
    } else {
        true
    }
}
