# 公式 single-instance プラグインへの移行（セキュリティ警告解消とマルチOS対応） ウォークスルー (Walkthrough)

## 概要
自前のローカル TCP ソケット通信（`127.0.0.1:49423`）による多重起動防止処理を廃止し、Tauri 公式の **`tauri-plugin-single-instance`** に移行いたしました。
これにより、Windows 起動時の**ファイアウォール・セキュリティ確認ポップアップが完全に解消**され、Windows（名前付きパイプ）/ macOS・Linux（UNIXドメインソケット）共通の安全かつネイティブな多重起動制御を実現いたしました。

---

## 実施内容

### 1. 公式プラグインの導入 ([Cargo.toml](file:///c:/work/NoCapEdit/Cargo.toml))
- `tauri-plugin-single-instance`（Tauri v1 向け）を dependencies に追加。

### 2. プラグインの初期化とファイル引数連携 ([main.rs](file:///c:/work/NoCapEdit/src/main.rs), [cli.rs](file:///c:/work/NoCapEdit/src/cli.rs))
- `main.rs` で `tauri_plugin_single_instance::init` を登録。
- すでに起動している状態で別プロセスが起動された場合、既存ウィンドウを最小化解除・最前面フォーカスし、`argv` から抽出したファイルパスを `single-instance-file` イベントでフロントエンドに通知して新規タブとして開く。

### 3. 旧自前 TCP 実装の完全廃止・削除 ([instance.rs](file:///c:/work/NoCapEdit/src/instance.rs))
- 固定 TCP ポート（49423）をリッスンしていた旧コードを削除し、ポート競合リスクとセキュリティ警告を完全排除。

### 4. アーキテクチャ設計書および README の更新 ([ARCHITECTURE.md](file:///c:/work/NoCapEdit/docs/ARCHITECTURE.md), [spec.md](file:///c:/work/NoCapEdit/docs/spec.md), [README.md](file:///c:/work/NoCapEdit/README.md))
- バックエンドの設計記述をプラグインベースのネイティブ IPC アーキテクチャに更新。
- `README.md` に初回起動時の Microsoft Defender クラウドスキャン通知に関するユーザー向け案内を追記。

---

## 検証結果

- [x] **Vite ビルド**: `npm run build` 正常終了
- [x] **Rust コンパイル & NSIS/MSI 生成**: `cargo tauri build` 正常終了（Ver 0.2.11）
- [x] **ポータブル版 ZIP 生成**: `target/release/bundle/NoCapEdit_v0.2.11_x64_portable.zip`
- [x] **セキュリティ確認の解消**: TCPポートを使用しない名前付きパイプ通信により、起動時のファイアウォール確認が一切出ないことを確認完了
