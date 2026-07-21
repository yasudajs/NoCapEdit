# フェーズ 1-3: 正規表現コンパイルのキャッシュ化 タスクリスト

- [x] `src/main.rs` の `move_file_or_dir` 関数内にある `Regex::new` を `std::sync::OnceLock` に置き換える
- [x] `src/main.rs` の `copy_file_or_dir` 関数内にある `Regex::new` を `std::sync::OnceLock` に置き換える
- [x] ビルドテスト (`cargo check` および `cargo build`) を実行してエラーが出ないことを確認する
- [ ] 【ユーザー依頼】アプリケーションを起動し、同名ファイルが存在する状態での「ファイル移動」および「ファイルコピー」操作を手動テストする
- [ ] テスト完了後、`docs/history.md` に履歴を追記して最終コミット＆プッシュを行う
