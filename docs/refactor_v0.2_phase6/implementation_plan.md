# Implementation Plan - Phase 6: settings.js のサイドバー関連分離

`settings.js` に混入しているサイドバー関連設定の保存処理をプロバイダーパターン（拡張レジストリ方式）を用いて分離し、`settings.js` のサイドバー依存を解消します。

## ユーザーレビューが必要な事項

- **設定拡張プロバイダーパターンの導入**:
  - `settings.js` 内の `saveApplicationSettings()` から `sidebar_visible` および `sidebar_width` の直接参照を除去します。
  - 代わりに外部モジュールが設定を動的に追加・合成できる `registerSettingsExtraProvider(providerFn)` 関数を `settings.js` に追加し、`sidebar-integration.js` 初期化時にプロバイダーを登録します。
- **`saveSettingsDelay()` 関数の取り扱い**:
  - `saveSettingsDelay()` は `sidebar.js` だけでなく `editor.js`（フォントサイズ・行高さ変更）からも呼ばれているため、`settings.js` の汎用ユーティリティとして保持します。

## 変更内容

### 1. バージョン管理ファイルの更新 (0.2.22 → 0.2.23)

- [Cargo.toml](file:///c:/work/NoCapEdit/Cargo.toml)
- [tauri.conf.json](file:///c:/work/NoCapEdit/tauri.conf.json)
- [nsis/installer.nsi](file:///c:/work/NoCapEdit/nsis/installer.nsi)
- [docs/DEVELOPMENT.md](file:///c:/work/NoCapEdit/docs/DEVELOPMENT.md)

---

### 2. UI / 設定モジュール (Phase 6 実装)

#### [MODIFY] [settings.js](file:///c:/work/NoCapEdit/src/dist/js/ui/settings.js)
- `settingsExtraProviders` 配列と `registerSettingsExtraProvider()` 関数の追加・エクスポート。
- `saveApplicationSettings()` 内でハードコードされている `sidebar_visible` / `sidebar_width` を除去し、登録されたプロバイダーから設定を取得して合成する処理へ変更。
- `saveSettingsDelay()` 関数の責務とコメントの整理。

#### [MODIFY] [sidebar-integration.js](file:///c:/work/NoCapEdit/src/dist/js/ui/sidebar-integration.js)
- `settings.js` から `registerSettingsExtraProvider` をインポート。
- `initSidebarIntegration()` 内で、サイドバー設定（`sidebar_visible`, `sidebar_width`）を提供するプロバイダー関数を登録。

---

## 検証計画

### 手動テスト
1. アプリ起動およびサイドバーの幅変更・表示切り替え（トグル）の実行。
2. アプリを再起動し、サイドバーの表示状態（表示/非表示）と幅が正しく保持されているか確認。
3. エディタの設定（フォントサイズ・テーマ等）の保存が正常に行われるか確認。
4. コンソールエラーが発生していないか確認。
