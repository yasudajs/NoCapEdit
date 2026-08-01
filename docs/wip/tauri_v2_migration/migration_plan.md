# Tauri v1 → v2 移行計画（マスタープラン）

## 概要

NoCapEdit の Tauri フレームワークを v1.5 から v2 系（最新安定版）に移行する。
v0.2 ブランチに対して移行を行う（機能追加前の現段階が最もコストが低いため）。

> [!IMPORTANT]
> 本ドキュメントは WIP（将来構想）段階であり、実施判断はユーザーの承認後に行う。

---

## 移行戦略

### 基本方針
- **小さなステップで段階的に移行**する（各ステップ完了時にビルド確認）
- 自動移行ツール (`cargo tauri migrate`) は**使用しない**（プロジェクト構造が非標準のため、手動で確実に行う）
- 各ステップは独立しており、問題発生時にロールバックしやすいように設計

### プロジェクト構造の特殊性
NoCapEdit は Tauri の標準構造 (`src-tauri/`) を使わず、プロジェクト直下に `Cargo.toml` と `tauri.conf.json` を配置している。  
この構造は v2 でも維持可能と判断し、`src-tauri/` への移行は行わない（不要な構造変更を避ける）。

---

## フェーズ構成

### フェーズ 0: 事前準備
**目的**: 移行作業のための環境準備

- [ ] v0.2 ブランチから作業ブランチ `feature/tauri-v2-migration` を作成
- [ ] 現在のビルドが正常に通ることを確認（`cargo build`）
- [ ] 現在のアプリが正常に動作することを手動確認

---

### フェーズ 1: Cargo.toml の依存関係更新
**目的**: Rust 側の依存関係を v2 に更新する（この時点ではビルドは通らない想定）

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

### フェーズ 2: tauri.conf.json の v2 形式への変換
**目的**: 設定ファイルを v2 のスキーマに準拠させる

#### v1 → v2 の主な変換ルール

| v1 のキー | v2 のキー | 備考 |
|---|---|---|
| `tauri.conf.json` > `package.productName` | トップレベル `productName` | |
| `tauri.conf.json` > `package.version` | トップレベル `version` | |
| `build.devPath` | `build.devUrl` | ただし静的ファイルなので `frontendDist` を使用 |
| `build.distDir` | `build.frontendDist` | |
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
    "frontendDist": "./src/dist"
  },
  "app": {
    "withGlobalTauri": true,
    "security": {
      "csp": null
    }
  },
  "bundle": {
    "active": true,
    "targets": "all",
    "icon": ["icons/32x32.png", "icons/128x128.png", "icons/128x128@2x.png", "icons/icon.icns", "icons/icon.ico"],
    "windows": {
      "wix": {
        "fragmentPaths": ["wix/file-association.wxs"],
        "componentRefs": ["FileAssociationComponent"]
      },
      "nsis": {
        "template": "nsis/installer.nsi"
      }
    }
  },
  "plugins": {}
}
```

#### 確認ポイント
- JSON 構文が正しいこと
- `cargo tauri info` でエラーが出ないこと（tauri-cli v2 が必要）

---

### フェーズ 3: Capabilities（権限）ファイルの作成
**目的**: v1 の allowlist を v2 の capabilities システムに置き換える

#### 現在の allowlist 設定
```json
{
  "shell": { "open": true },
  "dialog": { "save": true, "open": true, "ask": true, "message": true },
  "window": { "setTitle": true, "show": true }
}
```

#### 作成するファイル: `capabilities/default.json`
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

> [!NOTE]
> capabilities ファイルの配置場所は通常 `src-tauri/capabilities/` だが、  
> NoCapEdit は `src-tauri/` を使わないため、`capabilities/` をプロジェクト直下に配置し、  
> `tauri.conf.json` で参照する形にする。実際の動作検証時に調整が必要。

#### 確認ポイント
- capabilities ファイルの構文が正しいこと

---

### フェーズ 4: Rust バックエンドの API 移行
**目的**: `src/main.rs` 内の Tauri v1 API 呼び出しを v2 API に書き換える

#### 4-1: main.rs / lib.rs の分離

v2 ではモバイル対応のため `lib.rs` への分離が推奨されるが、  
NoCapEdit はデスクトップ専用のため **最小限の分離** にとどめる。

**新規作成: `src/lib.rs`**
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

**変更後の `src/main.rs`**（最小化）
```rust
fn main() {
    nocapedit::run();  // lib.rs の run() を呼び出す
}
```

#### 4-2: Tauri API のリネーム対応

| v1 API | v2 API | 対象箇所 |
|---|---|---|
| `tauri::WindowBuilder::new(...)` | `tauri::WebviewWindowBuilder::new(...)` | setup フック |
| `tauri::WindowUrl::App(...)` | `tauri::WebviewUrl::App(...)` | setup フック |
| `app.get_window("main")` | `app.get_webview_window("main")` | setup フック, single-instance |
| `app_handle.emit_all(...)` | `app_handle.emit(...)` | ファイル監視イベント送信 |
| `use tauri::Manager;` | `use tauri::Manager;` + `use tauri::Emitter;` | emit 使用箇所 |
| `window.hwnd()` | 要調査（raw-window-handle 経由の可能性） | DWM ダークモード適用 |

#### 4-3: プラグインの初期化コード追加

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
- `cargo build` が通ること
- コンパイルエラーがないこと

---

### フェーズ 5: フロントエンドの Tauri API 移行
**目的**: `window.__TAURI__` 経由の API 呼び出しを v2 の形式に更新する

#### 5-1: `src/dist/js/core/tauri.js` のラッパー更新

これがフロントエンド側の変更の**中心ファイル**。ここを直せば他のファイルへの影響は最小限。

| v1 のパス | v2 のパス |
|---|---|
| `window.__TAURI__.tauri.invoke` | `window.__TAURI__.core.invoke` |
| `window.__TAURI__.dialog.open` | `window.__TAURI__.dialog.open`（プラグイン経由で同じ可能性） |
| `window.__TAURI__.dialog.save` | `window.__TAURI__.dialog.save` |
| `window.__TAURI__.window.appWindow` | `window.__TAURI__.webviewWindow.getCurrentWebviewWindow()` |
| `window.__TAURI__.event.listen` | `window.__TAURI__.event.listen` |

#### 5-2: 直接 `window.__TAURI__` を参照している箇所の修正

- `src/dist/js/ui/settings.js`: `window.__TAURI__.shell.open(url)` → プラグイン経由の API に変更
- `src/dist/js/ui/sidebar.js`: `window.__TAURI__.dialog.message(...)` / `dialog.ask(...)` → プラグイン経由

#### 確認ポイント
- ブラウザコンソールにエラーが出ないこと
- invoke によるバックエンド呼び出しが正常に動作すること

---

### フェーズ 6: Tauri CLI の更新とビルド検証
**目的**: tauri-cli を v2 に更新し、開発ビルド・リリースビルドの両方を検証する

- [ ] `cargo install tauri-cli --version "^2.0.0" --locked` で CLI を更新
- [ ] `cargo tauri dev` で開発ビルドが起動すること
- [ ] アプリが正常に表示されること（ウィンドウ、ダークモード枠線）

---

### フェーズ 7: NSIS カスタムインストーラーの互換性対応
**目的**: カスタム NSIS テンプレートが v2 のバンドラーで正常に動作するか検証・修正する

> [!WARNING]
> 29KB のカスタム NSIS テンプレート (`nsis/installer.nsi`) は v2 のバンドラーと互換性がない可能性が高い。
> v2 ではテンプレート内の変数名やヘルパーマクロが変更されている。

#### 対応方針（2案）
1. **案A**: v2 のデフォルト NSIS テンプレートをベースに、NoCapEdit のカスタム部分（日本語化、ファイル関連付け等）を再適用する
2. **案B**: v2 の `installerHooks` 機能を使い、カスタムロジックを `.nsh` ファイルに分離する（推奨）

#### 確認ポイント
- [ ] `cargo tauri build` でインストーラーが生成されること
- [ ] 生成されたインストーラーが正常にインストール・アンインストールできること
- [ ] ファイル関連付けが正常に動作すること

---

### フェーズ 8: 総合動作検証
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
| NSIS テンプレートの非互換 | 高 | フェーズ 7 で早期に検証。最悪の場合はデフォルトテンプレートに戻す |
| `window.hwnd()` の API 変更 | 中 | v2 での raw-window-handle の取得方法を事前調査 |
| capabilities の設定不足 | 低 | 実行時エラーで即座に判明。権限を追加すればよい |
| `withGlobalTauri` の動作変更 | 低 | v2 でも同機能をサポートしていることを確認済み |

---

## 見積もり

| フェーズ | 想定工数 |
|---|---|
| フェーズ 0: 事前準備 | 0.5h |
| フェーズ 1: Cargo.toml 更新 | 0.5h |
| フェーズ 2: tauri.conf.json 変換 | 1h |
| フェーズ 3: Capabilities 作成 | 0.5h |
| フェーズ 4: Rust API 移行 | 2-3h |
| フェーズ 5: フロントエンド API 移行 | 1h |
| フェーズ 6: CLI 更新・ビルド検証 | 1h |
| フェーズ 7: NSIS 対応 | 2-4h（調査含む） |
| フェーズ 8: 総合動作検証 | 2h |
| **合計** | **約 10-14h（1.5-2日）** |

---

## 未決事項・要調査

1. **プロジェクト構造**: `src-tauri/` を使わない構造で `capabilities/` フォルダがどこに配置されるべきか
2. **`window.hwnd()`**: v2 での HWND 取得方法（DWM ダークモード適用に使用）
3. **NSIS テンプレート**: v2 のデフォルトテンプレートとの差分調査
4. **WiX ファイル関連付け**: v2 での互換性
5. **`build.devPath`**: 静的ファイル構成の場合、v2 で `frontendDist` のみでよいか、`devUrl` も必要か
