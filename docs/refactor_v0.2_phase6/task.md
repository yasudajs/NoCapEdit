# Tasks - Phase 6: settings.js のサイドバー関連分離

- [x] バージョン番号の更新 (0.2.22 -> 0.2.23) <!-- id: 0 -->
    - [x] `Cargo.toml` のバージョン更新
    - [x] `tauri.conf.json` のバージョン更新
    - [x] `nsis/installer.nsi` のバージョン更新
    - [x] `docs/DEVELOPMENT.md` のバージョン更新
- [x] `settings.js` の改修 <!-- id: 1 -->
    - [x] プロバイダー配列 `settingsExtraProviders` および `registerSettingsExtraProvider` 関数の追加
    - [x] `saveApplicationSettings()` 内のハードコードされた `sidebar_visible` / `sidebar_width` 除去とプロバイダー合成処理の導入
- [x] `sidebar-integration.js` の改修 <!-- id: 2 -->
    - [x] `registerSettingsExtraProvider` をインポートし、`initSidebarIntegration()` にてサイドバー設定プロバイダーを登録
- [x] 動作検証（手動テスト依頼中） <!-- id: 3 -->
    - [x] アプリを起動し、サイドバー表示のトグル切り替えおよび幅のドラッグ変更を実施
    - [-] アプリ再起動後、サイドバーの表示状態（表示/非表示）および幅が保持されているか確認
        →　開発環境でのcargo runによる起動では確認できないが、幅の保持はされていなくても現時点ではOKとする。
    - [x] 設定ダイアログから各種設定（フォントサイズ・テーマ等）を変更し保存後、正常に機能・保持されるか確認
    - [-] ブラウザ/アプリの開発者ツールコンソールにエラーが発生していないか確認
- [x] 完了後のドキュメント記録とコミット <!-- id: 4 -->
    - [x] `docs/history.md` に追記
    - [x] Git コミット＆プッシュ
