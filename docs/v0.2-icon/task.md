# タスクリスト：v0.2系 バージョン識別用アイコン適用およびバージョン更新

- [x] バージョン管理ファイルの更新
  - [x] [Cargo.toml](file:///c:/work/NoCapEdit/Cargo.toml)
  - [x] [tauri.conf.json](file:///c:/work/NoCapEdit/tauri.conf.json)
  - [x] [installer.nsi](file:///c:/work/NoCapEdit/nsis/installer.nsi)
  - [x] [DEVELOPMENT.md](file:///c:/work/NoCapEdit/docs/DEVELOPMENT.md)
- [x] アイコンソース画像の配置
  - [x] 生成された JPG デザイン案を PNG に変換し、`icons/icon.png` として配置する
- [x] Tauriアプリアイコンの再生成
  - [x] `cargo tauri icon` を実行してアイコン群を自動更新する
- [x] 動作検証
  - [x] 開発ビルド `cargo tauri dev` での動作・外観確認
  - [x] リリースビルド `cargo tauri build` での動作・外観確認
  - [x] `history.md` への変更履歴追記
  - [ ] 変更内容のコミットとプッシュ
