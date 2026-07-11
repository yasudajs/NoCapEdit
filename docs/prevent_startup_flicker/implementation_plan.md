# 起動時のウィンドウ表示ガタつき修正 (Prevent Startup Flicker)

## 概要

アプリ起動時、OSのウィンドウ枠が表示された直後にWebViewのレンダリングや初期化処理（非同期IPC設定読み込み等）が走るため、タブやテキストエリアの表示が一瞬遅れて画面がガタつく（または白・黒一瞬フラッシュする）現象が発生する。
この改修では、**初期化完了までウィンドウを非表示にし、レンダリングが完全に整った状態で画面を表示する**ことで、ストレスフリーでシームレスな起動画面を実現する。

### 背景

- 現状、Tauriのウィンドウはデフォルトで起動時即表示（`visible: true`）される
- `main.js` の `init()` は、設定の取得 (`get_settings`) やテーマ適用 (`apply_theme`)、タブの作成 (`createNewTab`) などを非同期で連続して待ち合わせる
- これらが完了するまでの数十ミリ秒〜数百ミリ秒の間、中身のないガタついた状態が露出する

### 決定済み事項

| 項目 | 決定内容 |
|------|---------|
| ウィンドウ初期表示設定 | Rust側で起動時は `visible(false)` に設定 |
| ウィンドウ表示のタイミング | JS側の `init()` の最後（すべての初期レンダリング完了後）に表示 |
| セキュリティ許可 (Allowlist) | フロントエンドから `appWindow.show()` を呼ぶため、Tauri設定で権限を許可 |

---

## 変更の影響範囲

```mermaid
graph TD
    A["アプリ起動"] -->|"Rust: visible(false)"| B["ウィンドウ枠非表示（バックグラウンド）"]
    B --> C["WebViewがHTML/CSSをロード"]
    C --> D["init() の非同期処理実行"]
    D --> E["初期タブの描画完了"]
    E -->|"JS: appWindow.show() in finally"| F["完成した画面をフロントに表示"]
```

---

## 変更計画

### Rustバックエンド（main.rs / Cargo.toml / tauri.conf.json）

#### [MODIFY] [main.rs](file:///c:/work/NoCapEdit/src/main.rs)

**1. WindowBuilder で初期表示を非表示にする（L435付近）**

`WindowBuilder` でウィンドウをビルドする際、`.visible(false)` メソッドを挟み、作成時点では画面に表示されないように制御する。

```diff
             let window = tauri::WindowBuilder::new(
                 app,
                 "main",
                 tauri::WindowUrl::App("index.html".into())
             )
             .title(format!("{} [ Ver {} ]", APP_DIR_NAME, env!("CARGO_PKG_VERSION")))
             .inner_size(WINDOW_WIDTH, WINDOW_HEIGHT)
             .min_inner_size(WINDOW_MIN_WIDTH, WINDOW_MIN_HEIGHT)
             .resizable(true)
             .fullscreen(false)
+            .visible(false)
             .build()?;
```

#### [MODIFY] [Cargo.toml](file:///c:/work/NoCapEdit/Cargo.toml)

**2. tauri 依存関係に `window-show` フィーチャーを追加（L7）**

フロントエンドからの `appWindow.show()` 呼び出しに備え、Tauriのフィーチャーフラグを有効化する。

```diff
-[dependencies]
-tauri = { version = "1.5", features = [ "window-set-title", "shell-open", "dialog-open", "dialog-save"] }
+tauri = { version = "1.5", features = [ "window-set-title", "window-show", "shell-open", "dialog-open", "dialog-save"] }
```

#### [MODIFY] [tauri.conf.json](file:///c:/work/NoCapEdit/tauri.conf.json)

**3. allowlist.window に `show` 権限を追加（L47）**

```diff
       "window": {
-        "setTitle": true
+        "setTitle": true,
+        "show": true
       }
```

---

### フロントエンド（main.js）

#### [MODIFY] [main.js](file:///c:/work/NoCapEdit/src/dist/main.js)

**1. `init()` の最後に `finally` ブロックを追加して `appWindow.show()` を安全に呼び出す（L487付近）**

設定読み込み、テーマの適用、および初期タブの作成（`createNewTab`）などの初期化処理中にエラーが発生した場合でも、確実にウィンドウを表示させてエラー画面をユーザーに視認可能にするため、`finally` ブロックで安全に `appWindow.show()` を呼び出す。

```diff
 async function init() {
     console.log('NoCapEdit initializing...');
 
     if (!ensureTauriApi()) {
         return;
     }
 
     try {
         // ... (中略) ...
 
         // 初回起動チェック
         const isFirstLaunch = !!settings.is_first_launch;
         const isHomeFolderMissing = settings.home_folder_exists === false;
 
         if (isFirstLaunch || isHomeFolderMissing) {
             openSettingsDialog(isHomeFolderMissing);
         } else {
             updateStatus('準備完了');
             setupUIEventListeners();
 
             // 起動時引数のチェック
             const launchFile = await invoke('get_launch_file');
             if (launchFile) {
                 await openExistingFile(launchFile);
             } else {
                 await createNewTab();
             }
 
             // アップデートチェックをバックグラウンドで開始
             if (settings.app_version) {
                 checkNewVersion(settings.app_version);
             }
         }
     } catch (error) {
         console.error('Failed to initialize:', error);
         updateStatus('初期化エラー', 'error');
+    } finally {
+        // 初期化エラーなどの例外が発生した場合でも、確実にウィンドウを表示してユーザーに状態が見えるようにする（フェイルセーフ）
+        if (appWindow && typeof appWindow.show === 'function') {
+            try {
+                await appWindow.show();
+            } catch (showError) {
+                console.error('Failed to show window:', showError);
+            }
+        }
     }
 }
```

---

## 仕様書の更新

#### [MODIFY] [spec.md](file:///c:/work/NoCapEdit/docs/spec.md)

**セクション 3.3「ウィンドウの表示制御（新規）」に起動時のウィンドウ表示制御に関する記述を追記する**

追記内容：
- 起動時の画面のガタつきやチラつきを防ぐため、初期化処理（設定ロードやテーマの初期適用、初期タブ描画など）が完了するまでメインウィンドウを非表示（`visible: false`）とする。
- すべての初期表示用データの準備が整った段階でフロントエンドからウィンドウを表示（`show`）し、シームレスな起動を実現する。

---

## 検証計画

### 自動テスト
- `cargo build` でコンパイル・ビルドが成功すること

### 手動検証
- アプリを起動した際、ウィンドウ枠の表示と中身の表示がバラバラにならず、完全に描画が整った状態で綺麗に表示されることを確認する。
- 起動引数（関連付けダブルクリックなど）で起動した際も、ファイルが開かれた状態で正しくウィンドウが表示されることを確認する。
- 初回起動時（ホームフォルダ未設定時）も、ホーム設定ダイアログが表示された状態でウィンドウが表示されることを確認する。
