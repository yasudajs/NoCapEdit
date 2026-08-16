# ヘルプ画面のテーマ連動機能 ウォークスルー (help-window-theme-sync)

ヘルプ画面（ショートカット一覧）のウィンドウにおいて、テーマ（Dark / Soft Dark / Light）に応じたネイティブタイトルバー色の適用、および設定変更時のリアルタイム同期を実装しました。

## 変更内容の概要

### 1. Tauri API ラッパーの拡充 ([`tauri.js`](file:///c:/work/NoCapEdit/src/dist/js/core/tauri.js))
- `export const emit = tauriApi?.event?.emit || null;` を追加し、ウィンドウ間のイベントブロードキャストをフロントエンドから利用可能にしました。

### 2. テーマ変更イベントのブロードキャスト ([`settings.js`](file:///c:/work/NoCapEdit/src/dist/js/ui/settings.js))
- `onThemeChange(newTheme)` 内で、テーマ変更時に `emit('theme-changed', { theme: newTheme })` を呼び出し、全ウィンドウへ通知するようにしました。

### 3. ヘルプ画面でのテーマ適用とイベント同期 ([`help.js`](file:///c:/work/NoCapEdit/src/dist/js/help.js))
- `applyTheme(theme)` 関数を実装：
  - `document.body` の CSS クラス（`light-theme`, `soft-dark-theme`）を更新
  - Tauri の `invoke('apply_theme', { theme: validTheme })` を呼び出して、ヘルプウィンドウのネイティブタイトルバー色（Windows DWM API）を即座に更新
- `DOMContentLoaded` 時に URL パラメータからテーマを取得して `applyTheme` を実行
- `listen('theme-changed', ...)` を登録し、起動中にメイン画面側でテーマが変更された際にヘルプ画面を開いたままリアルタイムにテーマ・タイトルバー色を追従

---

## 変更ファイル一覧

| ファイル | 変更内容 |
|---|---|
| [`src/dist/js/core/tauri.js`](file:///c:/work/NoCapEdit/src/dist/js/core/tauri.js) | `emit` API のエクスポートを追加 |
| [`src/dist/js/ui/settings.js`](file:///c:/work/NoCapEdit/src/dist/js/ui/settings.js) | `onThemeChange` で `theme-changed` イベントをブロードキャスト |
| [`src/dist/js/help.js`](file:///c:/work/NoCapEdit/src/dist/js/help.js) | `apply_theme` コマンド呼び出しと `theme-changed` 受信・リアルタイム同期を実装 |
| [`Cargo.toml`](file:///c:/work/NoCapEdit/Cargo.toml) | バージョンを `0.1.92` に更新 |
| [`tauri.conf.json`](file:///c:/work/NoCapEdit/tauri.conf.json) | バージョンを `0.1.92` に更新 |
| [`nsis/installer.nsi`](file:///c:/work/NoCapEdit/nsis/installer.nsi) | バージョンを `0.1.92` / `0.1.92.0` に更新 |
| [`docs/DEVELOPMENT.md`](file:///c:/work/NoCapEdit/docs/DEVELOPMENT.md) | ポータブル版 ZIP 名を `0.1.92` に更新 |
| [`docs/spec.md`](file:///c:/work/NoCapEdit/docs/spec.md) | ヘルプ画面のテーマ連動およびリアルタイム同期仕様を追記 |
| [`docs/history.md`](file:///c:/work/NoCapEdit/docs/history.md) | Ver 0.1.92 の改定履歴を追記 |

---

## 検証結果

- **ビルド・単体テスト**:
  - `cargo check`: エラー・警告なしで成功
  - `cargo test`: ユニットテスト全件パス (1 passed, 0 failed)
  - `cargo build`: デバッグビルド成功
