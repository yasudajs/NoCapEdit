use std::path::Path;

pub fn parse_file_arg_from_argv(args: &[String], cwd_str: Option<&str>) -> Option<String> {
    if args.len() > 1 {
        let path = &args[1];
        let path_buf = Path::new(path);
        let abs_path = if path_buf.is_absolute() {
            path_buf.to_path_buf()
        } else if let Some(cwd) = cwd_str {
            Path::new(cwd).join(path_buf)
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

pub fn parse_launch_file_arg() -> Option<String> {
    let args: Vec<String> = std::env::args().collect();
    parse_file_arg_from_argv(&args, None)
}
