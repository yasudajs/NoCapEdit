# Tauri v1 → v2 移行計画（マスタープラン）

## 概要

NoCapEdit の Tauri フレームワークを v1.5 から v2 系（最新安定版）に移行する。
v0.2 ブランチに対して移行を行う（機能追加前の現段階が最もコストが低いため）。

移行と同時に、プロジェクト構造を Tauri v2 の標準レイアウト（`src-tauri/`）に変更する。
これにより公式ツール・ドキュメントとの整合性を確保し、将来のメンテナンスコストを下げる。

> [!IMPORTANT]
> 本ドキュメントは WIP（将来構想）段階であり、実施判断はユーザーの承認後に行う。

---

## 移行戦略

### 基本方針
- **小さなステップで段階的に移行**する（各ステップ完了時にビルド確認）
- 自動移行ツール (`cargo tauri migrate`) は**使用しない**（手動で確実に行う）
- 各ステップは独立しており、問題発生時にロールバックしやすいように設計

### プロジェクト構造の変更方針（決定済み）

Tauri v2 の標準レイアウト（`src-tauri/`）に移行する。
公式 CLI ツール・ドキュメントとの整合性を確保し、`capabilities/` の配置場所問題も解決する。

#### 現在の構造 → 変更後の構造

```
NoCapEdit/（現在）                     NoCapEdit/（変更後）
├── Cargo.toml                         ├── src-tauri/
├── Cargo.lock                         │   ├── Cargo.toml
├── build.rs                           │   ├── Cargo.lock
├── tauri.conf.json                    │   ├── build.rs
├── src/                               │   ├── tauri.conf.json
│   ├── main.rs          ─────→        │   ├── capabilities/
│   ├── constants.rs     ─────→        │   │   └── default.json（新規）
│   ├── error_messages.rs─────→        │   ├── src/
│   ├── security.rs      ─────→        │   │   ├── main.rs（最小化）
│   └── dist/                          │   │   ├── lib.rs（新規：ロジック集約）
│       ├── index.html   ─────→        │   │   ├── constants.rs
│       ├── style.css    ─────→        │   │   ├── error_messages.rs
│       ├── i18n.js      ─────→        │   │   └── security.rs
│       └── js/          ─────→        │   ├── icons/（移動）
├── icons/               ─────→        │   ├── nsis/（移動）
├── nsis/                ─────→        │   └── wix/（移動）
├── wix/                 ─────→        ├── src/（フロントエンド：旧 src/dist/）
├── docs/                              │   ├── index.html
└── ...                                │   ├── style.css
                                       │   ├── i18n.js
                                       │   ├── favicon.ico
                                       │   ├── favicon.png
                                       │   └── js/
                                       │       ├── core/
                                       │       ├── ui/
                                       │       ├── utils/
                                       │       ├── main.js
                                       │       ├── shortcuts.js
                                       │       └── state.js
                                       ├── docs/
                                       └── ...
```

#### 構造変更に伴い更新が必要なファイル・設定

| 対象 | 変更内容 |
|---|---|
| `tauri.conf.json` > `build.frontendDist` | `"../src"` に設定（src-tauri からの相対パス） |
| `tauri.conf.json` > `bundle.icon` | `"icons/..."` のまま（src-tauri 基準） |
| `tauri.conf.json` > `bundle.windows.nsis.template` | `"nsis/installer.nsi"` のまま（src-tauri 基準） |
| `tauri.conf.json` > `bundle.windows.wix` | `"wix/..."` のまま（src-tauri 基準） |
| `.gitignore` | `target/` → `src-tauri/target/` に変更 |
| `docs/DEVELOPMENT.md` | ビルドコマンドのパス説明を更新 |
| NSIS テンプレート内のパス参照 | 必要に応じて調整 |

---

## フェーズ構成

### フェーズ 0: 事前準備
**目的**: 移行作業のための環境準備

- [ ] `cargo install tauri-cli --version "^2.0.0" --locked` で Tauri CLI v2 をインストール（`^2.0.0` 指定により 2.x 系の最新版が自動的にインストールされる）
- [ ] v0.2 ブランチから作業ブランチ `feature/tauri-v2-migration` を作成
- [ ] 現在のビルドが正常に通ることを確認（`cargo build`）
- [ ] 現在のアプリが正常に動作することを手動確認

---

### フェーズ 1: プロジェクト構造の変更（ファイル移動）
**目的**: ファイル群を Tauri v2 の標準レイアウトに再配置する

> [!IMPORTANT]
> このフェーズではファイルの**移動のみ**を行い、ファイル内容の変更は行わない。
> ビルドはこの時点では通らないが、次のフェーズで設定ファイルを更新して解決する。

#### 1-1: `src-tauri/` ディレクトリの作成とバックエンドファイルの移動
```
Cargo.toml       → src-tauri/Cargo.toml
Cargo.lock       → src-tauri/Cargo.lock
build.rs         → src-tauri/build.rs
tauri.conf.json  → src-tauri/tauri.conf.json
src/main.rs      → src-tauri/src/main.rs
src/constants.rs → src-tauri/src/constants.rs
src/error_messages.rs → src-tauri/src/error_messages.rs
src/security.rs  → src-tauri/src/security.rs
```

#### 1-2: バンドル関連リソースの移動
```
icons/  → src-tauri/icons/
nsis/   → src-tauri/nsis/
```
（`wix/` ディレクトリは MSI ビルドを廃止するため削除）

#### 1-3: フロントエンドファイルの昇格
```
src/dist/index.html  → src/index.html
src/dist/style.css   → src/style.css
src/dist/i18n.js     → src/i18n.js
src/dist/favicon.ico → src/favicon.ico
src/dist/favicon.png → src/favicon.png
src/dist/js/         → src/js/
```
（`src/dist/` ディレクトリは空になるため削除）

#### 1-4: `.gitignore` の更新
```diff
-target/
+src-tauri/target/
```

#### 確認ポイント
- ファイルの移動が正しいこと（`git status` で確認）
- 移動漏れがないこと

---

### フェーズ 2: Cargo.toml の依存関係更新
**目的**: Rust 側の依存関係を v2 に更新する

#### 変更内容
- `tauri` の依存関係を `"1.5"` → `"2"` に更新
- `tauri-build` を `"1.5"` → `"2"` に更新
- `tauri-plugin-single-instance` を v2 対応版に更新
  - v1: `{ git = "...", branch = "v1" }` → v2: `"2"` (crates.io)
- features の `"window-set-title"`, `"dialog-open"` 等の v1 形式を削除
  - v2 ではこれらはプラグインまたは capabilities で制御するため不要
- **v2 で必要なプラグインクレートを追加**:
  - `tauri-plugin-dialog = "2"` （dialog 機能）
  - `tauri-plugin-shell = "2"` （shell.open 機能）

#### 確認ポイント
- `Cargo.toml` の構文が正しいこと（`cargo check` はまだ通らなくてよい）

---

### フェーズ 3: tauri.conf.json の v2 形式への変換
**目的**: 設定ファイルを v2 のスキーマに準拠させる

#### v1 → v2 の主な変換ルール

| v1 のキー | v2 のキー | 備考 |
|---|---|---|
| `package.productName` | トップレベル `productName` | |
| `package.version` | トップレベル `version` | |
| `build.devPath` | 削除 | 静的ファイルなので `frontendDist` のみ |
| `build.distDir` | `build.frontendDist` | `"../src"` に設定 |
| `build.withGlobalTauri` | `app.withGlobalTauri` | |
| `tauri.allowlist` | 削除 → capabilities ファイルへ | |
| `tauri.security` | `app.security` | |
| `tauri.bundle` | `bundle` | ほぼ同じ構造 |
| `tauri.windows` | `app.windows` | |

#### 変換後の tauri.conf.json の想定構造
```json
{
  "$schema": "https://schema.tauri.app/config/2",
  "productName": "NoCapEdit",
  "version": "0.2.x",
  "identifier": "com.nocapedit.dev",
  "build": {
    "frontendDist": "../src"
  },
  "app": {
    "withGlobalTauri": true,
    "security": {
      "csp": null
    }
  },
  "bundle": {
    "active": true,
    "targets": ["nsis"],
    "icon": [
      "icons/32x32.png",
      "icons/128x128.png",
      "icons/128x128@2x.png",
      "icons/icon.icns",
      "icons/icon.ico"
    ],
    "fileAssociations": [
      {
        "ext": ["nctx"],
        "name": "NoCapEdit Text File",
        "mimeType": "application/x-nocapedit-text"
      },
      {
        "ext": ["ncmd"],
        "name": "NoCapEdit Markdown File",
        "mimeType": "application/x-nocapedit-markdown"
      }
    ],
    "windows": {
      "nsis": {
        "languages": ["Japanese"],
        "customLanguageFiles": {
          "Japanese": "nsis/Japanese.nsh"
        },
        "installerHooks": "nsis/hooks.nsh"
      }
    }
  },
  "plugins": {}
}
```

> [!NOTE]
> - `targets` を `["nsis"]` に限定（WiX/MSI ビルドを廃止）
> - `fileAssociations` で `.nctx`, `.ncmd` の関連付けをクロスプラットフォーム設定
> - NSIS のカスタムテンプレート（`installer.nsi`）は削除し、デフォルトテンプレート + `installerHooks` で代替
> - 日本語化は `languages` + `customLanguageFiles` で対応

#### 確認ポイント
- JSON 構文が正しいこと
- `cargo tauri info` でエラーが出ないこと

---

### フェーズ 4: Capabilities（権限）ファイルの作成
**目的**: v1 の allowlist を v2 の capabilities システムに置き換える

#### 現在の allowlist 設定
```json
{
  "shell": { "open": true },
  "dialog": { "save": true, "open": true, "ask": true, "message": true },
  "window": { "setTitle": true, "show": true }
}
```

#### 作成するファイル: `src-tauri/capabilities/default.json`
```json
{
  "identifier": "main-capability",
  "description": "NoCapEdit メインウィンドウの権限",
  "windows": ["main"],
  "permissions": [
    "core:default",
    "core:window:allow-set-title",
    "core:window:allow-show",
    "dialog:allow-open",
    "dialog:allow-save",
    "dialog:allow-ask",
    "dialog:allow-message",
    "shell:allow-open"
  ]
}
```

#### 確認ポイント
- capabilities ファイルの構文が正しいこと
- `src-tauri/capabilities/` に配置されていること（Tauri v2 が自動的に読み込む）

---

### フェーズ 5: Rust バックエンドの API 移行
**目的**: `src-tauri/src/main.rs` 内の Tauri v1 API 呼び出しを v2 API に書き換える

#### 5-1: main.rs / lib.rs の分離

v2 の標準に従い、ロジックを `lib.rs` に集約し、`main.rs` はエントリーポイントのみとする。

**新規作成: `src-tauri/src/lib.rs`**
```rust
mod constants;
mod error_messages;
mod security;

// 既存の main.rs から Tauri Builder 構築ロジックを移動
pub fn run() {
    tauri::Builder::default()
        // ... プラグイン・コマンド登録
        .run(tauri::generate_context!())
        .expect("Tauri アプリケーションの実行中にエラーが発生しました");
}
```

**変更後の `src-tauri/src/main.rs`**（最小化）
```rust
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    nocapedit::run();  // lib.rs の run() を呼び出す
}
```

#### 5-2: Tauri API のリネーム対応

| v1 API | v2 API | 対象箇所 |
|---|---|---|
| `tauri::WindowBuilder::new(...)` | `tauri::WebviewWindowBuilder::new(...)` | setup フック |
| `tauri::WindowUrl::App(...)` | `tauri::WebviewUrl::App(...)` | setup フック |
| `app.get_window("main")` | `app.get_webview_window("main")` | setup フック, single-instance |
| `app_handle.emit_all(...)` | `app_handle.emit(...)` | ファイル監視イベント送信 |
| `use tauri::Manager;` | `use tauri::Manager;` + `use tauri::Emitter;` | emit 使用箇所 |
| `tauri::Window` (コマンド引数) | `tauri::WebviewWindow` | 全コマンド |

#### 5-4: テーマ適用の実装変更（DWM 直接呼び出しの廃止）

Tauri v2 ではビルトインの `set_theme()` / `.theme()` API が提供されており、
`window.hwnd()` + `DwmSetWindowAttribute` による手動ダークモード適用は**完全に不要**になる。
Tauri v2 が内部的に `DWMWA_USE_IMMERSIVE_DARK_MODE` を処理する。

**① setup フック内（起動時テーマ適用）— 変更前:**
```rust
// v1: hwnd + DWM API 直接呼び出し（約15行）
use windows_sys::Win32::Graphics::Dwm::{DwmSetWindowAttribute, DWMWA_USE_IMMERSIVE_DARK_MODE};
if let Ok(hwnd) = window.hwnd() {
    let hwnd_raw = hwnd.0 as HWND;
    unsafe { DwmSetWindowAttribute(...) }
}
```

**変更後:**
```rust
// v2: WebviewWindowBuilder の .theme() で直接指定（1行）
use tauri::{WebviewWindowBuilder, WebviewUrl, Theme};

let window = WebviewWindowBuilder::new(app, "main", WebviewUrl::App("index.html".into()))
    .theme(if is_dark { Some(Theme::Dark) } else { Some(Theme::Light) })
    // ... 他のビルダー設定
    .build()?;
```

**② apply_theme コマンド — 変更前:**
```rust
// v1: hwnd + DWM API 直接呼び出し（約15行）
#[tauri::command]
fn apply_theme(window: tauri::Window, theme: String) -> Result<(), String> {
    #[cfg(target_os = "windows")]
    {
        use windows_sys::Win32::Graphics::Dwm::...;
        if let Ok(hwnd) = window.hwnd() { unsafe { ... } }
    }
    Ok(())
}
```

**変更後:**
```rust
// v2: ビルトイン set_theme() API（3行）
#[tauri::command]
fn apply_theme(window: tauri::WebviewWindow, theme: String) -> Result<(), String> {
    let tauri_theme = if theme == "light" { Some(Theme::Light) } else { Some(Theme::Dark) };
    window.set_theme(tauri_theme).map_err(|e| e.to_string())
}
```

**副次的な改善:**
- `windows-sys` クレートが不要になる可能性（他で使用していなければ `Cargo.toml` から除去）
- `unsafe` ブロックが全廃される
- `#[cfg(target_os = "windows")]` 条件分岐が不要になる（Tauri がクロスプラットフォーム対応）
- capabilities に `"core:window:allow-set-theme"` の追加が必要

#### 5-3: プラグインの初期化コード追加

v2 ではプラグインを `Builder` に明示的に登録する必要がある。

```rust
tauri::Builder::default()
    .plugin(tauri_plugin_dialog::init())
    .plugin(tauri_plugin_shell::init())
    .plugin(tauri_plugin_single_instance::init(|app, argv, _cwd| {
        // 既存のシングルインスタンスロジック
    }))
    .invoke_handler(tauri::generate_handler![...])
    .run(tauri::generate_context!())
```

#### 確認ポイント
- `cargo build` が通ること（`src-tauri/` ディレクトリで実行）
- コンパイルエラーがないこと

---

### フェーズ 6: フロントエンドの Tauri API 移行
**目的**: `window.__TAURI__` 経由の API 呼び出しを v2 の形式に更新する

#### 6-1: `src/js/core/tauri.js` のラッパー更新

これがフロントエンド側の変更の**中心ファイル**。ここを直せば他のファイルへの影響は最小限。

| v1 のパス | v2 のパス |
|---|---|
| `window.__TAURI__.tauri.invoke` | `window.__TAURI__.core.invoke` |
| `window.__TAURI__.dialog.open` | `window.__TAURI__.dialog.open`（プラグイン経由） |
| `window.__TAURI__.dialog.save` | `window.__TAURI__.dialog.save` |
| `window.__TAURI__.window.appWindow` | `window.__TAURI__.webviewWindow.getCurrentWebviewWindow()` |
| `window.__TAURI__.event.listen` | `window.__TAURI__.event.listen` |

#### 6-2: 直接 `window.__TAURI__` を参照している箇所の修正

- `src/js/ui/settings.js`: `window.__TAURI__.shell.open(url)` → プラグイン経由の API に変更
- `src/js/ui/sidebar.js`: `window.__TAURI__.dialog.message(...)` / `dialog.ask(...)` → プラグイン経由

> [!NOTE]
> フロントエンドファイルのパスが `src/dist/js/...` → `src/js/...` に変わっている点に注意。
> これはフェーズ 1 でのフロントエンドファイル昇格に対応。

#### 確認ポイント
- ブラウザコンソールにエラーが出ないこと
- invoke によるバックエンド呼び出しが正常に動作すること

---

### フェーズ 7: 開発ビルドでの動作検証
**目的**: `cargo tauri dev` で開発ビルドが正常に動作することを確認する

- [ ] `cargo tauri dev` で開発ビルドが起動すること
- [ ] アプリが正常に表示されること（ウィンドウ、ダークモード枠線）
- [ ] 基本操作（ファイル開く、保存、編集）が動作すること
- [ ] コンソールにエラーがないこと

---

### フェーズ 8: インストーラーの v2 ネイティブ化
**目的**: カスタム NSIS テンプレートを廃止し、v2 のデフォルトテンプレート + フック機能に移行する

#### 8-1: カスタムテンプレートの削除と WiX の廃止
- `nsis/installer.nsi`（797行）を**削除** → v2 デフォルトテンプレートを使用
- `wix/` ディレクトリを**削除**（MSI ビルドを廃止）

#### 8-2: `nsis/hooks.nsh` の新規作成（約30行）
現在の `installer.nsi` に含まれていた NoCapEdit 固有のカスタムコード（ファイル関連付け）をフックマクロとして移植する。

```nsis
!macro NSIS_HOOK_POSTINSTALL
  ; .nctx 拡張子の登録
  WriteRegStr SHCTX "Software\Classes\.nctx" "" "NoCapEdit.nctx"
  WriteRegStr SHCTX "Software\Classes\NoCapEdit.nctx" "" "NoCapEdit Text File"
  WriteRegStr SHCTX "Software\Classes\NoCapEdit.nctx\DefaultIcon" "" "$INSTDIR\${MAINBINARYNAME}.exe,0"
  WriteRegStr SHCTX "Software\Classes\NoCapEdit.nctx\shell\open\command" "" '"$INSTDIR\${MAINBINARYNAME}.exe" "%1"'
  ; .ncmd 拡張子の登録
  WriteRegStr SHCTX "Software\Classes\.ncmd" "" "NoCapEdit.ncmd"
  WriteRegStr SHCTX "Software\Classes\NoCapEdit.ncmd" "" "NoCapEdit Markdown File"
  WriteRegStr SHCTX "Software\Classes\NoCapEdit.ncmd\DefaultIcon" "" "$INSTDIR\${MAINBINARYNAME}.exe,0"
  WriteRegStr SHCTX "Software\Classes\NoCapEdit.ncmd\shell\open\command" "" '"$INSTDIR\${MAINBINARYNAME}.exe" "%1"'
  System::Call 'Shell32::SHChangeNotify(i 0x08000000, i 0, i 0, i 0)'
!macroend

!macro NSIS_HOOK_POSTUNINSTALL
  DeleteRegKey SHCTX "Software\Classes\.nctx"
  DeleteRegKey SHCTX "Software\Classes\NoCapEdit.nctx"
  DeleteRegKey SHCTX "Software\Classes\.ncmd"
  DeleteRegKey SHCTX "Software\Classes\NoCapEdit.ncmd"
  System::Call 'Shell32::SHChangeNotify(i 0x08000000, i 0, i 0, i 0)'
!macroend
```

#### 8-3: `nsis/Japanese.nsh` の流用
既存の日本語翻訳ファイルはそのまま流用する。`tauri.conf.json` の `customLanguageFiles` で参照する。

#### 変更のインパクト
| 対象 | 変更内容 |
|---|---|
| `nsis/installer.nsi`（797行） | **削除** |
| `nsis/hooks.nsh`（新規、約30行） | **新規作成** |
| `nsis/Japanese.nsh`（26行） | そのまま流用 |
| `wix/file-association.wxs`（24行） | **削除** |
| `wix/` ディレクトリ | **削除** |
| 配布形態 | exe + zip の 2 種類に統一（MSI 廃止） |

#### 確認ポイント
- [ ] `cargo tauri build` で NSIS インストーラー（.exe）が生成されること
- [ ] MSI が生成されないこと
- [ ] 生成されたインストーラーが正常にインストール・アンインストールできること
- [ ] `.nctx`, `.ncmd` のファイル関連付けが正常に動作すること
- [ ] インストーラーの UI が日本語で表示されること

---

### フェーズ 9: 総合動作検証
**目的**: 全機能の動作を手動で確認する

#### テスト項目
- [ ] アプリの起動・終了
- [ ] ウィンドウタイトルの設定
- [ ] ダークモード枠線の適用
- [ ] ファイルの読み込み・保存（テキストファイル）
- [ ] ダイアログ（ファイル開く、保存、確認ダイアログ、メッセージダイアログ）
- [ ] ディレクトリ読み込み
- [ ] ファイル/フォルダの作成・リネーム・移動・コピー・削除・ゴミ箱
- [ ] エクスプローラーでフォルダを開く
- [ ] シェルオープン（外部ブラウザでURL表示）
- [ ] ファイルシステム監視（フォルダの変更検知）
- [ ] シングルインスタンス制御（2重起動防止・ファイル引き渡し）
- [ ] 起動時引数ファイルの処理
- [ ] システムフォント一覧の取得
- [ ] テーマの適用
- [ ] サイドバーの全機能
- [ ] i18n（多言語対応）の動作
- [ ] ショートカットキーの動作

---

## リスクと対策

| リスク | 影響度 | 対策 |
|---|---|---|
| ~~NSIS テンプレートの非互換~~ | ~~高~~ | **解決済み**: カスタムテンプレートを全廃し、v2 デフォルトテンプレート + `installerHooks` に移行する方針に決定 |
| ~~`window.hwnd()` の API 変更~~ | ~~中~~ | **解決済み**: v2 のビルトイン `set_theme()` API で完全に代替可能。DWM 直接呼び出し不要 |
| capabilities の設定不足 | 低 | 実行時エラーで即座に判明。権限を追加すればよい |
| `withGlobalTauri` の動作変更 | 低 | v2 でも同機能をサポートしていることを確認済み |
| プロジェクト構造変更によるパス参照の破損 | 中 | フェーズ 1 でファイル移動のみ行い、内容変更は後続フェーズで対応 |

---

## 見積もり

| フェーズ | 想定工数 |
|---|---|
| フェーズ 0: 事前準備 | 0.5h |
| フェーズ 1: プロジェクト構造変更 | 1h |
| フェーズ 2: Cargo.toml 更新 | 0.5h |
| フェーズ 3: tauri.conf.json 変換 | 1h |
| フェーズ 4: Capabilities 作成 | 0.5h |
| フェーズ 5: Rust API 移行 | 2-3h |
| フェーズ 6: フロントエンド API 移行 | 1h |
| フェーズ 7: 開発ビルド動作検証 | 1h |
| フェーズ 8: インストーラー v2 ネイティブ化 | 1-2h |
| フェーズ 9: 総合動作検証 | 2h |
| **合計** | **約 12-16h（2-2.5日）** |

---

## 未決事項・要調査

1. ~~**プロジェクト構造**: `src-tauri/` を使わない構造で `capabilities/` フォルダがどこに配置されるべきか~~ → **解決済み**: `src-tauri/` 標準構造に移行し、`src-tauri/capabilities/` に配置する
2. ~~**`window.hwnd()`**: v2 での HWND 取得方法（DWM ダークモード適用に使用）~~ → **解決済み**: v2 ではビルトインの `WebviewWindowBuilder::theme()` および `WebviewWindow::set_theme()` API が提供されており、`hwnd()` + `DwmSetWindowAttribute` による手動実装は不要。`windows-sys` クレートの除去、`unsafe` ブロックの全廃も可能。
3. ~~**NSIS テンプレート**: v2 のデフォルトテンプレートとの差分調査~~ → **解決済み**: カスタムテンプレート（`installer.nsi` 797行）を全廃し、v2 デフォルトテンプレートを使用する。NoCapEdit 固有のカスタマイズ（ファイル関連付け約30行）は `installerHooks`（`hooks.nsh`）で実装。日本語化は `languages` + `customLanguageFiles` 設定で対応。
4. ~~**WiX ファイル関連付け**: v2 での互換性~~ → **解決済み**: WiX/MSI ビルドを廃止する。Microsoft Store 公開は MSI ではなく MSIX が必要なため、MSI を維持する意味がない。配布形態は exe（NSIS）+ zip（ポータブル）の 2 種類に統一。
5. ~~**`build.devPath`**: 静的ファイル構成の場合、v2 で `frontendDist` のみでよいか、`devUrl` も必要か~~ → **解決済み**: バンドラー未使用の静的ファイル構成では `frontendDist` のみでよい（`devUrl` は開発サーバー使用時のみ）
