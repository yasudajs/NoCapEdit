# Tasks - Phase 6: settings.js のサイドバー関連分離

- [ ] バージョン番号の更新 (0.2.22 -> 0.2.23) <!-- id: 0 -->
    - [ ] `Cargo.toml` のバージョン更新
    - [ ] `tauri.conf.json` のバージョン更新
    - [ ] `nsis/installer.nsi` のバージョン更新
    - [ ] `docs/DEVELOPMENT.md` のバージョン更新
- [ ] `settings.js` の改修 <!-- id: 1 -->
    - [ ] プロバイダー配列 `settingsExtraProviders` および `registerSettingsExtraProvider` 関数の追加
    - [ ] `saveApplicationSettings()` 内のハードコードされた `sidebar_visible` / `sidebar_width` 除去とプロバイダー合成処理の導入
- [ ] `sidebar-integration.js` の改修 <!-- id: 2 -->
    - [ ] `registerSettingsExtraProvider` をインポートし、`initSidebarIntegration()` にてサイドバー設定プロバイダーを登録
- [ ] 動作検証 <!-- id: 3 -->
    - [ ] アプリ起動・設定保存・再起動時のサイドバー表示状態および幅の保持確認
    - [ ] エディタ設定保存およびコンソールエラーの有無確認
- [ ] 完了後のドキュメント記録とコミット <!-- id: 4 -->
    - [ ] `docs/history.md` に追記
    - [ ] Git コミット＆プッシュ
