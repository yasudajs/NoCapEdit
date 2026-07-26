# シンプルモード実装計画

フェーズ8の「シンプルモード」機能および、関連するUI・ショートカット制御の実装計画です。

## 概要

サイドバーや各種アイコンを隠し、テキスト編集（v0.1相当）に集中できる「シンプルモード」を追加します。
また、新規タブを開くためのショートカットキー `Ctrl+T` を追加し、モード切替時には自動で画面をリロード（再起動）して設定をクリーンに反映する設計とします。

## 実装内容

### バックエンド（Rust）
- `src/main.rs` の `AppSettings` 構造体に `simple_mode` (bool, デフォルト `false`) を追加し、保存・読み込み処理を追従させます。

### フロントエンド状態管理・UI配管
- `src/dist/js/state.js`: `appState` に `simpleMode` を追加します。
- `src/dist/index.html`: 設定ダイアログ内に「動作モード（フルモード / シンプルモード）」のドロップダウンを追加します（テキストはHTMLに直接記述します）。
- `src/dist/js/settings.js`: 
  - `simple_mode` の初期値読み込み処理を実装します。
  - セレクトボックスの `change` イベントリスナーを追加し、値が変更された際に `persistAllTabsBeforeExit()` を呼び出します。
  - `persistAllTabsBeforeExit()` の処理が成功した後、`window.location.reload()` を実行してアプリを再起動します。

### UIとショートカットの制御
- `src/dist/js/shortcuts.js`:
  - 既存の `shortcuts` 配列に対して、特定のカテゴリのショートカットの有効/無効を一括で切り替えるための `setCategoryEnabled(category, enabled)` 関数を追加します。
  - グローバルの `keydown` リスナー内で、`s.enabled !== false` などの条件をチェックし、無効化されたカテゴリのショートカットが発火しないように制御します。
- `src/dist/js/ui/sidebar-integration.js`:
  - `initSidebarIntegration()` を改修し、`appState.simpleMode === true` の場合は以下の処理を行います：
    - `#sidebar`, `#sidebar-resize-handle`, `#icon-bar` に `.hidden` クラスを付与し、非表示にします。
    - `setCategoryEnabled('Sidebar', false)` を呼び出し、サイドバー関連のショートカット（`Ctrl+E`, `Ctrl+N`, `Ctrl+D`等）を無効化します。
    - ファイルシステム監視 (`setupSidebarFileSystemListener`) やサイドバー初期化 (`initSidebar`) の処理をスキップします。
  - フルモード時の場合は、これまで通りUIを表示し、ショートカットを有効化して初期化を行います。

### ショートカットの追加
- `src/dist/js/main.js`:
  - グローバルなショートカットとして `registerShortcut(['Ctrl+T'], createNewTab);` を追加し、モードに関わらず新規タブを開けるようにします。

## Verification Plan (確認計画)

### Manual Verification
以下の手順で手動テストを実施し、挙動を確認します。
1. `Ctrl+T` で新規タブが開くことを確認する。
2. 設定ダイアログから「動作モード」をシンプルモードに変更した際、開いているタブが保存（または破棄）され、アプリがリロードされることを確認する。
3. リロード後、サイドバーおよびアイコンバーが完全に非表示になり、エディタのみの画面（v0.1相当）になることを確認する。
4. シンプルモード中に `Ctrl+E`、`Ctrl+N`、`Ctrl+D` などのサイドバー操作ショートカットが発火しないことを確認する。
5. 設定を「フルモード」に戻し、リロード後にサイドバーが正常に表示され、ファイルツリーの展開や各種ショートカットが再び機能することを確認する。
