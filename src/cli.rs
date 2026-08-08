pub fn parse_launch_file_arg() -> Option<String> {
    let args: Vec<String> = std::env::args().collect();
    if args.len() > 1 {
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
    }
}
