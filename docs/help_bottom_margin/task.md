# タスクリスト: ヘルプ画面下部の余白調整

- [ ] **1. バージョン番号の更新（4ファイル一括更新）**
  - [ ] `Cargo.toml`: `0.1.79`
  - [ ] `tauri.conf.json`: `0.1.79`
  - [ ] `nsis/installer.nsi`: `0.1.79.0`
  - [ ] `docs/DEVELOPMENT.md`: `0.1.79`
- [ ] **2. スタイル調整**
  - [ ] `src/dist/help.html`: 下部余白（約30px〜40px）のスタイルを追加
- [ ] **3. 検証**
  - [ ] ビルド確認（`cargo check` / `cargo test`）
  - [ ] ヘルプ画面（`F1`）の最下部余白の表示確認
- [ ] **4. 完了報告ドキュメント作成**
  - [ ] `docs/help_bottom_margin/walkthrough.md` の作成
  - [ ] `docs/history.md` に `0.1.79` の変更履歴を追記
  - [ ] コミット＆プッシュ
