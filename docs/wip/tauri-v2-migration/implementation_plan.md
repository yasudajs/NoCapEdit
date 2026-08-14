# Tauri v2 移行および標準ファイル構成への再編計画

## 概要
現在 Tauri 1.5 ＋ Vanilla JS（ビルドツールなし）という独自構成で動いている本プロジェクトを、Tauri v2 の最新推奨アーキテクチャへと刷新します。
レガシーな環境を脱却し、今後の機能拡張（CodeMirrorの導入など）をスムーズに行えるよう、Viteベースのビルド環境と、バックエンドコードの `src-tauri` 分離という「ネイティブ（標準的）なファイル構成」を構築します。

## 目標バージョン
- **Tauri Core / Tauri Build**: v2.11.5
- **@tauri-apps/api および各種プラグイン**: 最新の v2 系

## 予想される作業量
**大規模（3〜4時間程度）**
段階的に小さなコミットを積み重ねながら、確実にマイグレーションを進めます。

---

## 移行後の目標ディレクトリ構成

```text
NoCapEdit/
├── package.json          (Vite, @tauri-apps/cli, フロントエンドのTauri依存関係)
├── vite.config.js        (フロントエンドのビルド設定)
├── index.html            (Viteのエントリポイント)
├── src/                  (フロントエンド専用ディレクトリ)
│   ├── i18n.js           (旧 src/dist/i18n.js から移動)
│   ├── js/               (旧 src/dist/js から移動)
│   └── style.css         (旧 src/dist/style.css から移動)
├── src-tauri/            (Tauri/Rust専用ディレクトリ)
│   ├── Cargo.toml        (v2.11.5向けに更新)
│   ├── Cargo.lock
│   ├── tauri.conf.json   (v2スキーマ対応)
│   ├── build.rs
│   ├── capabilities/     (v2の新しい権限管理)
│   ├── icons/            (旧 icons/ から移動)
│   ├── nsis/             (旧 nsis/ から移動)
│   ├── wix/              (旧 wix/ から移動)
│   └── src/
│       ├── main.rs       (プラグインベースに書き換え)
│       ├── commands.rs   (Window→WebviewWindow 等の型変更)
│       ├── instance.rs   (Emitterトレイト追加、get_webview_window化)
│       ├── theme.rs      (Window→WebviewWindow型変更)
│       ├── settings.rs   (変更なし)
│       └── cli.rs        (変更なし)
```

> **備考**: `src-tauri/` に `Cargo.toml` を移動するため、`target/` ディレクトリは `src-tauri/target/` に生成される。  
> NSISインストーラー内のハードコードされたバイナリパス（`MAINBINARYSRCPATH`）は、移行後のパスに合わせて更新する。

---

## Proposed Changes (詳細ステップとコミット計画)

一気に変更するとビルドエラーの特定が困難になるため、以下の小ステップに分けて「修正・検証・コミット」を繰り返します。

### ステップ1: Tauriプロジェクトの `src-tauri` 分離（v1のまま）
`src-tauri/` 分離を先に行うことで、Tauri v1のまま標準的なディレクトリ構成となり、後続のVite導入やv2移行がTauri公式ドキュメントの手順に沿いやすくなる。
- **作業**:
  1. `src-tauri/` ディレクトリおよび `src-tauri/src/` ディレクトリを作成。
  2. Rust・Tauri関連ファイルを `src-tauri/` 配下へ移動:
     - ルートから: `Cargo.toml`, `Cargo.lock`, `tauri.conf.json`, `build.rs`, `icons/`, `nsis/`, `wix/`
     - `src/` から: `main.rs`, `commands.rs`, `instance.rs`, `settings.rs`, `theme.rs`, `cli.rs` → `src-tauri/src/` へ
  3. `src-tauri/Cargo.toml` のソースパスが `src-tauri/src/main.rs` を正しく指すよう確認。
  4. `src-tauri/tauri.conf.json` の `devPath` / `distDir` パスを、`src-tauri/` からの相対パスに更新（例: `"../src/dist"`）。
  5. `src-tauri/nsis/installer.nsi` のハードコードされた絶対パス `MAINBINARYSRCPATH` を、`src-tauri/target/release/` に修正。
  6. `.gitignore` の `target/` パスを `src-tauri/target/` に更新。
- **検証**: `cd src-tauri && cargo build` が成功し、`npx tauri dev`（または `cargo tauri dev`）でアプリが従来通り起動することを確認（Tauri v1のまま、ディレクトリ構成のみ変更された状態）。
- **コミット**: `chore: Tauriプロジェクトのsrc-tauriディレクトリへの分離`

### ステップ2: フロントエンドへの Vite 導入とディレクトリ再配置
- **作業**:
  1. ルートに `package.json` を作成し、Vite および `@tauri-apps/cli`（v2系）を `devDependencies` にインストール。`scripts` にTauriコマンドのショートカットを定義:
     ```json
     {
       "scripts": {
         "dev": "vite",
         "build": "vite build",
         "tauri": "tauri"
       },
       "devDependencies": {
         "@tauri-apps/cli": "^2",
         "vite": "^6"
       }
     }
     ```
  2. 現在の `src/dist/` 以下のフロントエンドファイルを再配置:
     - `src/dist/index.html` → ルート直下 `index.html`
     - `src/dist/js/` → `src/js/`
     - `src/dist/style.css` → `src/style.css`
     - `src/dist/i18n.js` → `src/i18n.js`
     - `src/dist/favicon.*` → ルート直下 `public/` または適切な配置先
  3. 移動完了後、空になった `src/dist/` ディレクトリを削除。
  4. `index.html` のスクリプト・スタイル読み込みを Vite 仕様に修正:
     - `<link rel="stylesheet" href="/src/style.css">`
     - `<script type="module" src="/src/js/main.js"></script>`
  5. `vite.config.js` を作成し、開発用スクリプト (`npm run dev`, `npm run build`) を設定。
  6. `src-tauri/tauri.conf.json` の `devPath` / `distDir` を Vite 連携に変更:
     - `devPath`: Vite 開発サーバーのURL（例: `"http://localhost:1420"`）
     - `distDir`: Vite ビルド出力先（例: `"../dist"`）
     - `beforeDevCommand`: `"npm run dev"`
     - `beforeBuildCommand`: `"npm run build"`
- **検証**: `npx tauri dev` でアプリが正常に起動し、フロントエンドが表示されることを確認（まだTauri v1の状態）。
- **コミット**: `chore: フロントエンド環境へのVite導入とディレクトリ再配置`

### ステップ3: Tauriコアおよび Cargo 依存関係の v2.11.5 への更新
- **作業**:
  1. `src-tauri/Cargo.toml` の `tauri` および `tauri-build` のバージョンを `2.11.5` に更新。
  2. v1 の `features` 指定（`window-set-title`, `shell-open`, `dialog-open`, `dialog-save` 等）を削除。
  3. v2 でプラグイン化された機能の Rust 側依存関係を追加:
     - `tauri-plugin-shell`
     - `tauri-plugin-dialog`
     - `tauri-plugin-fs`
  4. v1 の `custom-protocol` feature を削除（v2 では不要）。
- **コミット**: `chore: RustバックエンドのTauri v2依存関係更新`

### ステップ4: `tauri.conf.json` の v2 スキーマ移行
- **作業**:
  1. v2 スキーマの `$schema` 参照を追加。
  2. `allowlist` セクションを完全に削除。
  3. `"withGlobalTauri": true` を削除（v2 + Vite環境ではESMインポートを使用するため不要）。
  4. `build` セクションのキー名を v2 仕様に変更（`devPath` → `devUrl`, `distDir` → `frontendDist` 等）。
  5. `package` セクションを削除し、対応する設定をトップレベルに移動（v2形式: `"productName"`, `"version"` はトップレベル）。
  6. `bundle` セクション内の `nsis`/`wix` のパス参照が `src-tauri/` からの相対パスで正しいことを確認。
  7. `src-tauri/capabilities/` ディレクトリを作成し、権限設定ファイル（`default.json`）を作成:
     - `core:default`（基本権限）
     - `shell:allow-open`（URLおよびフォルダを開く）
     - `dialog:allow-save`, `dialog:allow-open`（ファイルダイアログ）
     - その他、アプリで使用する権限
- **検証**: `tauri.conf.json` のJSON構文が正しいこと、capabilities が正しく定義されていること。
- **コミット**: `chore: tauri.conf.jsonをv2スキーマへ移行`

### ステップ5: Rust バックエンドの v2 API対応
- **作業**:
  以下の全ファイルを v2 API に対応させる:

  **`src-tauri/src/main.rs`**:
  1. Tauri 初期化コードにプラグイン登録を追加（`.plugin(tauri_plugin_shell::init())`, `.plugin(tauri_plugin_dialog::init())`, `.plugin(tauri_plugin_fs::init())`）。
  2. `tauri::WindowBuilder` → `tauri::WebviewWindowBuilder` に変更。
  3. `tauri::WindowUrl::App(...)` → `tauri::WebviewUrl::App(...)` に変更。

  **`src-tauri/src/commands.rs`**:
  4. `apply_theme` コマンドの引数 `window: tauri::Window` → `window: tauri::WebviewWindow` に変更。

  **`src-tauri/src/instance.rs`**:
  5. `use tauri::Emitter;` のインポートを追加（v2ではイベント発火が `Emitter` トレイトに分離）。
  6. `app_handle.get_window("main")` → `app_handle.get_webview_window("main")` に変更。

  **`src-tauri/src/theme.rs`**:
  7. 引数の型 `&tauri::Window` → `&tauri::WebviewWindow` に変更。
  8. `window.hwnd()` の戻り値の型処理を v2 に合わせて調整。

  **変更不要のファイル**: `settings.rs`（Tauri API未使用）、`cli.rs`（Tauri API未使用）

- **検証**: `cd src-tauri && cargo build` が成功することを確認。
- **コミット**: `refactor(rust): Tauri v2 APIへの対応とプラグイン初期化`

### ステップ6: フロントエンドの JS API の npm / v2 対応
- **作業**:
  1. `package.json` に v2 系の npm パッケージを追加:
     - `@tauri-apps/api`（core, event, window 等）
     - `@tauri-apps/plugin-shell`
     - `@tauri-apps/plugin-dialog`
  2. **`src/js/core/tauri.js`**（メイン変更箇所 — Tauri APIラッパーモジュール）:
     - `window.__TAURI__` 経由の全アクセスを ESM インポートに書き換え:
       - `window.__TAURI__.tauri.invoke` → `import { invoke } from '@tauri-apps/api/core'`
       - `window.__TAURI__.event.listen` → `import { listen } from '@tauri-apps/api/event'`
       - `window.__TAURI__.dialog.save/open` → `import { save, open } from '@tauri-apps/plugin-dialog'`
       - `window.__TAURI__.shell.open` → `import { open as shellOpen } from '@tauri-apps/plugin-shell'`
     - `window.__TAURI__.window.appWindow` 関連の移行:
       - `appWindow.onCloseRequested` → `import { getCurrentWindow } from '@tauri-apps/api/window'` + `getCurrentWindow().onCloseRequested(...)`
       - `appWindow.setTitle(...)` → `getCurrentWindow().setTitle(...)`
       - `appWindow.show()` → `getCurrentWindow().show()`
     - `ensureTauriApi()` 関数を削除（Vite + ESMインポートにより不要）。
  3. **`src/js/utils/shortcuts.js`** と **`src/js/utils/updaterUI.js`**:
     - `window.__TAURI__.shell.open(...)` の直接呼び出しを、`tauri.js` ラッパー経由（`shellOpen(...)` 等）に統一。
  4. その他のJSファイル（`main.js`, `fileManager.js`, `settingsUI.js` 等）は `tauri.js` のラッパー関数を経由しているため、ラッパーのインターフェースが変わらなければ変更不要。
- **検証**: `npx tauri dev` でアプリを起動し、以下の動作を確認:
  - ファイルの読み書き、ダイアログ表示
  - ウィンドウタイトルの設定、ウィンドウの表示制御
  - `Ctrl+E` でのフォルダオープン
  - シングルインスタンスのファイル受信イベント
- **コミット**: `refactor(js): フロントエンドのTauri v2 API対応`

---

## 補足: バージョン管理ファイルパスの変更

`src-tauri/` 分離に伴い、AGENTS.md で定義されたバージョン管理対象の4ファイルのパスが以下のように変わる:

| 変更前 | 変更後 |
|---|---|
| `Cargo.toml` | `src-tauri/Cargo.toml` |
| `tauri.conf.json` | `src-tauri/tauri.conf.json` |
| `nsis/installer.nsi` | `src-tauri/nsis/installer.nsi` |
| `docs/DEVELOPMENT.md` | `docs/DEVELOPMENT.md`（変更なし） |

移行完了後、AGENTS.md のバージョン管理ファイルテーブルおよび `docs/DEVELOPMENT.md` 内のビルドコマンド例も更新する。

---

## Verification Plan

### 自動テスト (ビルド確認)
- フロントエンド: `npm run build` がエラーなく通るか。
- バックエンド: `cd src-tauri && cargo check` および `cargo build` がエラーなく通るか。
- **インストーラービルド**: `npx tauri build` が成功し、NSIS / WIX インストーラーが正常に生成されるか。

### 手動検証 (Manual Verification)
ステップ6完了後、以下の動作をテストします。
1. `npx tauri dev` でアプリが正常に起動すること。
2. ファイルの保存（自動保存・手動保存）および読み込み（Dialog）が、新しいTauri v2 APIとプラグインを経由して正常に動作すること。
3. `Ctrl+E` によるフォルダを開く操作（Shellプラグイン API）が機能すること。
4. UIデザインやテーマ切り替え、フォント設定などが崩れずに動作していること。
5. ウィンドウタイトルのバージョン表示、アップデートチェック、リリースノートリンクが正常に動作すること。
6. シングルインスタンス動作（`.nctx` ダブルクリックで既存ウィンドウにタブ追加）が正常に機能すること。
7. ウィンドウ起動時の非表示→表示制御（チラつき防止）が正常に動作すること。

### 確定した設計方針
以下の事項はディスカッションを経て確定済み:
- **Cargo ワークスペース**: 使用しない。`src-tauri/` は独立した単一の Cargo プロジェクトとし、`target/` は `src-tauri/target/` に生成される（Tauri v2 の標準推奨構成）。
- **Cargo.lock の扱い**: `src-tauri/Cargo.lock` に配置し、Git にコミットする（決定論的ビルドのため）。
- **Tauri CLI のインストール方法**: `package.json` の `devDependencies` に `@tauri-apps/cli`（v2系）をプロジェクトローカルにインストールし、`npx tauri dev` / `npx tauri build`（または `npm run tauri dev` / `npm run tauri build`）で実行する。グローバルインストールは行わない。
