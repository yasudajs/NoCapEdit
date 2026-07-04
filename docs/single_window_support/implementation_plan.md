# 単一ウィンドウ動作（シングルインスタンス）機能の実装計画

すでに `NoCapEdit` が起動している場合に、新規でウィンドウを開くのではなく、起動中のウィンドウにタブを追加し、ウィンドウを最前面に表示する（シングルインスタンス）機能を実装します。

## ユーザーレビュー要求

> [!IMPORTANT]
> 既存の多重起動防止のために `tauri-plugin-single-instance` プラグインを使用します。
> このプラグインを導入するため、`Cargo.toml` に依存関係を追加し、Rust側とフロントエンド側（JavaScript）でイベント連携を行います。

## オープンクエスチョン

特にありません。

## 提案する変更

### バックエンド (Rust)

#### [MODIFY] [Cargo.toml](file:///c:/work/NoCapEdit/Cargo.toml)
- `[dependencies]` に `tauri-plugin-single-instance` を追加します。
  - バージョン: `tauri-plugin-single-instance = { git = "https://github.com/tauri-apps/plugins-workspace", branch = "v1" }` (Tauri v1に適合するブランチ) または `0.3.9`

#### [MODIFY] [main.rs](file:///c:/work/NoCapEdit/src/main.rs)
- `tauri_plugin_single_instance` プラグインを初期化し、すでにインスタンスが起動している場合に新しく起動しようとした引数（ファイルパス）を取得します。
- 取得したファイルパスを `single-instance-file` イベントとしてフロントエンドに送信します。
- メインウィンドウをアンミニマイズ（最小化解除）し、フォーカスを当てて最前面に表示します。

---

### フロントエンド (JavaScript)

#### [MODIFY] [main.js](file:///c:/work/NoCapEdit/src/dist/main.js)
- `single-instance-file` イベントをリッスンし、イベントからファイルパスを受け取った場合、新規タブとしてそのファイルを読み込んで開き、アクティブタブにします。

---

## 検証計画

### 自動テスト
- `cargo check` によるビルド確認。

### 手動検証
1. `nce.exe`（または `cargo tauri dev`）を起動します。
2. アプリが起動している状態で、コマンドライン（またはエクスプローラーから `.nctx` ファイル）で別のファイルを指定して `nce.exe <filepath>` を実行します。
3. 新しいウィンドウが起動せず、既存のウィンドウに指定したファイルのタブが追加されることを確認します。
4. 既存のウィンドウが最小化されている場合、または他のウィンドウの裏に隠れている場合、前面に復元されてアクティブになることを確認します。
