# 🛠️ 動作環境とビルド・開発方法

現在のバージョン は Windows 環境を対象として構成されています。

### 前提条件
- Rust 1.70 以上
- Visual Studio Build Tools (Windows)
- Node.js (フロントエンドのビルドおよびパッケージ管理)
- Tauri CLI (`cargo install tauri-cli`)

### 開発・起動手順
ターミナル（PowerShell等）でプロジェクトルートディレクトリを開き、以下のコマンドを実行します。

```powershell
# アプリケーションのビルドと起動
cargo run
```
*(※ Tauri CLIがインストールされている場合は `cargo tauri dev` でも起動可能です)*

### 配布パッケージのビルド
インストーラーをビルドする場合は以下のコマンドを実行します。

```powershell
cargo tauri build
```

また、ポータブル版（ZIP形式）を作成する場合は、以下のコマンドを実行して `target/release/bundle` 配下に ZIP アーカイブを出力します。

```powershell
# ポータブル版のビルドとZIPアーカイブの作成
cargo build --release
New-Item -ItemType Directory -Force -Path "target/release/bundle"
Compress-Archive -Path "target/release/NoCapEdit.exe" -DestinationPath "target/release/bundle/NoCapEdit_v0.1.28_x64_portable.zip" -Force
```

## 📄 仕様詳細
仕様の詳細は [spec.md](spec.md) をご参照ください。
過去の作業履歴や実装履歴は Git のコミットログにて管理されています。
