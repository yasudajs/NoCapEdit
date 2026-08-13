# ユーザープロファイル取得処理の修正計画

リファクタリングレビューで指摘された `src/settings.rs` における `env!("USERPROFILE")` の問題を修正します。
コンパイル時にパスがハードコードされてしまうバグを防ぐため、実行時に環境変数を取得するよう変更します。また、将来的なMacやLinux版の開発を見据え、Windows特有の `USERPROFILE` だけでなく、Unix系OSの `HOME` にもフォールバックする堅牢な実装とします。

## User Review Required

修正内容に問題がないかご確認をお願いいたします。
（この段階ではブランチの作成やソースコードの修正は行っていません）

## Open Questions

特になし

## Proposed Changes

### Rust Backend

#### [MODIFY] [settings.rs](file:///c:/work/NoCapEdit/src/settings.rs)
`AppSettings` の `Default` トレイト実装部分を以下のように修正します。

```rust
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
        }
    }
}
```

## Verification Plan

### Automated Tests
- `cargo check` を実行し、コンパイルエラーが発生しないことを確認します。

### Manual Verification
- アプリを起動し、設定ファイルの読み込みやホームフォルダの初期化に問題が生じないことを確認します。
