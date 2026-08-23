# [実装計画] 公式 single-instance プラグインへの移行（セキュリティ警告解消とマルチOS対応）

## 1. 概要
自前のローカル TCP ソケット通信（`127.0.0.1:49423`）による多重起動防止処理を廃止し、Tauri 公式の **`tauri-plugin-single-instance`** に移行します。
これにより、Windows 起動時の**ファイアウォール・セキュリティ確認ポップアップを完全に解消**し、Windows（名前付きパイプ）/ macOS・Linux（UNIXドメインソケット）共通の安全かつネイティブな多重起動制御を実現します。

---

## 2. 背景と解決する課題

### 2.1 現状の課題
- `src/instance.rs` では、プロセス間通信（IPC）にローカル TCP ソケット（`127.0.0.1:49423`）を使用しています。
- Windows のセキュリティ機能やファイアウォールは、未知の exe が TCP ポートをリッスンした際に「セキュリティの確認（通信の許可）」ポップアップを発生させます。
- また、固定ポートを使用しているため、他アプリとのポート競合リスクやマルチOSでの互換性の課題がありました。

### 2.2 移行後のメリット
- **セキュリティ警告の完全解消**: ネットワーク（TCP）通信を行わず、Windows カーネルの**名前付きパイプ（Named Pipe）**を使用するため、ファイアウォール警告が一切出なくなります。
- **マルチOS対応**: macOS / Linux 環境では自動的に UNIX ドメインソケット（`/tmp`）に切り替わり、全OSで共通の安全なシングルインスタンス動作が保証されます。
- **コードの簡素化**: 手動のスレッド管理やソケット読み書きコード（`instance.rs`）を廃止し、Tauri 公式の洗練されたプラグインアーキテクチャに統一します。

---

## 3. 実装方針

### 3.1 依存関係の追加 (`Cargo.toml`)
- Tauri v1 向けの公式プラグインを追加：
  ```toml
  [dependencies]
  tauri-plugin-single-instance = { git = "https://github.com/tauri-apps/plugins-workspace", branch = "v1" }
  ```

### 3.2 プラグインの初期化とイベントハンドリング (`src/main.rs`)
- `main.rs` から手動の `check_primary_or_forward` / `start_instance_listener` を削除。
- `tauri::Builder::default()` にプラグインを登録：
  ```rust
  .plugin(tauri_plugin_single_instance::init(|app, argv, _cwd| {
      if let Some(window) = app.get_window("main") {
          let _ = window.unminimize();
          let _ = window.set_focus();
          
          // コマンドライン引数からファイルパスを抽出してフロントエンドに通知
          if let Some(file_path) = cli::parse_file_arg_from_argv(&argv) {
              let _ = window.emit("single-instance-file", file_path);
          }
      }
  }))
  ```

### 3.3 引数解析ヘルパーの追加 (`src/cli.rs`)
- プラグインから渡される `argv: Vec<String>` から、起動ファイル引数を安全に抽出する関数 `parse_file_arg_from_argv` を実装。

### 3.4 旧 `instance.rs` の廃止・削除
- 不要となった手動 TCP ソケット実装（`src/instance.rs`）を削除。

---

## 4. 変更対象ファイル

### [MODIFY] [Cargo.toml](file:///c:/work/NoCapEdit/Cargo.toml)
- `tauri-plugin-single-instance` 依存関係を追加。

### [MODIFY] [main.rs](file:///c:/work/NoCapEdit/src/main.rs)
- プラグイン初期化コードの登録および旧インスタンス処理の削除。

### [MODIFY] [cli.rs](file:///c:/work/NoCapEdit/src/cli.rs)
- `argv` 配列からのファイル引数パース関数を追加。

### [DELETE] [instance.rs](file:///c:/work/NoCapEdit/src/instance.rs)
- 旧自前 TCP ソケット処理を削除。

### [MODIFY] [ARCHITECTURE.md](file:///c:/work/NoCapEdit/docs/ARCHITECTURE.md)
- バックエンド構成の `instance.rs` 記述を公式プラグイン構成に更新。

---

## 5. バージョン管理と履歴
- 内部バージョン: `0.2.11`
- `docs/history.md` に Ver 0.2.11 として記録

---

## 6. 検証計画

### 動作確認手順
1. `npm run build` および `cargo tauri build` を実行
2. 生成された `NoCapEdit.exe` をダブルクリックし、**ファイアウォール・セキュリティ確認のポップアップが一切出ずに起動すること**を確認
3. アプリが起動した状態で、再度 exe をダブルクリックした際、新しいプロセスは起動せず既存ウィンドウが前面にフォーカスされることを確認
4. コマンドラインから `NoCapEdit.exe <ファイルパス>` で別ファイルを指定して起動した際、既存ウィンドウに新しいタブとしてファイルが開くことを確認
