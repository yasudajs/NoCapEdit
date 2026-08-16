# ヘルプ画面のテーマ連動機能 実装計画書 (help-window-theme-sync)

ヘルプ画面（ショートカット一覧）のウィンドウにおいて、テーマ（Dark / Soft Dark / Light）に応じたタイトルバー色の適用、および設定変更時のリアルタイム同期を実現します。

## 概要・背景
- 現在、ヘルプ画面（`help_screen`）は `shortcuts.js` から独立した `WebviewWindow` として動的に生成されます。
- ヘルプ画面の起動時に Rust 側コマンド `invoke('apply_theme', { theme })`（Windows DWM API を使用したタイトルバーダーク化）が呼び出されていないため、OS 標準のライト（白）タイトルバーのまま表示される問題があります。
- また、メイン画面とヘルプ画面間でテーマ変更を同期するイベント通信（Tauri Event による `emit` / `listen`）が存在しないため、ヘルプ画面を開いたままメイン画面でテーマを変更してもヘルプ画面に反映されません。

## 変更内容

### 1. Tauri API ラッパーの拡張 ([`tauri.js`](file:///c:/work/NoCapEdit/src/dist/js/core/tauri.js))
- `window.__TAURI__.event.emit` を `emit` としてエクスポートし、フロントエンド側からウィンドウ間イベント送信を行えるようにします。

### 2. メイン画面からのテーマ変更イベント送信 ([`settings.js`](file:///c:/work/NoCapEdit/src/dist/js/ui/settings.js))
- `onThemeChange(newTheme)` 内で、メイン画面のテーマ更新および設定保存時に、`emit('theme-changed', { theme: newTheme })` を呼び出して全ウィンドウへ変更をブロードキャストします。

### 3. ヘルプ画面のテーマ適用およびリアルタイム同期 ([`help.js`](file:///c:/work/NoCapEdit/src/dist/js/help.js))
- テーマ適用用の共通処理 `applyTheme(theme)` を定義します：
  - `document.body` のクラス（`light-theme`, `soft-dark-theme`）を更新
  - Tauri の `invoke('apply_theme', { theme })` を呼び出してヘルプウィンドウのネイティブタイトルバー色を Windows DWM に反映
- `DOMContentLoaded` 時：
  - URL パラメータから受け取ったテーマ（またはデフォルト）で `applyTheme` を実行
- イベントリスナーの登録：
  - `listen('theme-changed', (event) => { applyTheme(event.payload.theme); })` を登録し、起動中にメイン画面側でテーマが変更された際にリアルタイムに追従

---

## 変更対象ファイル一覧

### フロントエンド
#### [MODIFY] [tauri.js](file:///c:/work/NoCapEdit/src/dist/js/core/tauri.js)
- `emit` のエクスポートを追加

#### [MODIFY] [settings.js](file:///c:/work/NoCapEdit/src/dist/js/ui/settings.js)
- `emit` をインポートし、`onThemeChange` で `theme-changed` イベントを発行

#### [MODIFY] [help.js](file:///c:/work/NoCapEdit/src/dist/js/help.js)
- `invoke`, `listen` を `core/tauri.js` からインポート
- `applyTheme(theme)` 関数を定義（DOMクラス切り替え + `apply_theme` 呼び出し）
- `DOMContentLoaded` での初期テーマ適用
- `listen('theme-changed', ...)` によるイベント受信・同期処理を追加

---

## バージョン管理およびドキュメント

### バージョン更新対象（0.1.91 -> 0.1.92）
- `Cargo.toml`
- `src-tauri/tauri.conf.json`
- `nsis/installer.nsi`
- `docs/DEVELOPMENT.md`

### 仕様書・履歴
- `spec.md`: ヘルプ画面のテーマ連動およびマルチウィンドウテーマ同期の仕様を反映
- `docs/history.md`: Ver 0.1.92 の変更履歴を追記

---

## 検証手順

### 手動検証
1. **初期表示確認（各テーマ）**:
   - メイン画面の設定で「Dark」を選択した状態で `F1` を押し、ヘルプ画面のタイトルバーおよび本文がダークテーマで表示されることを確認。
   - 同様に「Soft Dark」「Light」を選択した状態で `F1` を押し、ヘルプ画面がそれぞれのテーマ（Soft Dark / Light）で表示されることを確認。
2. **リアルタイム同期確認**:
   - `F1` を押してヘルプ画面を開いた状態にする。
   - メイン画面で設定ダイアログを開き、テーマを「Dark」→「Light」→「Soft Dark」と順次切り替える。
   - ヘルプ画面が開いたまま即座にタイトルバーおよび本文の色が切り替わることを確認。
3. **ビルド検証**:
   - `cargo check` および `cargo build` でエラー・警告がないことを確認。
