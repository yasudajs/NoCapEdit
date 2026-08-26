# 🛠️ 動作環境とビルド・開発方法

現在のバージョンは Windows 環境を対象として構成されています。

### 前提条件
- Rust 1.70 以上
- Visual Studio Build Tools (Windows)
- Node.js (フロントエンドのビルドおよびパッケージ管理)
- Tauri CLI v1系 (`cargo install tauri-cli --version "^1.6"`)
  - ※本プロジェクトはTauri v1を使用しています。Tauri v2 CLI (2.x) がグローバルにインストールされていると設定ファイルのパースエラーが発生するため、必ずv1系を使用してください。

---

### 1. 開発・起動手順（ホットリロード対応）
ターミナル（PowerShell等）でプロジェクトルートディレクトリを開き、以下のコマンドを実行します。
Vite 開発サーバーと連携してアプリが起動します。

```powershell
cargo tauri dev
```

---

### 2. 配布パッケージのビルド

#### A. インストーラー版（NSIS）のビルド
以下のコマンドを実行すると、自動的にフロントエンドのビルド（`npm run build`）が行われた後、インストーラー（`.exe` / `.msi`）が `target/release/bundle/nsis/` 配下に生成されます。

```powershell
cargo tauri build
```

#### B. ポータブル版（ZIPアーカイブ）のビルド
以下のコマンドを一括コピー＆ペーストして実行すると、フロントエンドとアセットが完全に埋め込まれたポータブル版（`.exe`）がビルドされ、`target/release/bundle/` 配下に ZIP アーカイブが生成されます。

```powershell
cargo tauri build; Compress-Archive -Path "target/release/NoCapEdit.exe" -DestinationPath "target/release/bundle/NoCapEdit_v0.2.16_x64_portable.zip" -Force
```

---

## 📄 仕様詳細と設計情報
- 仕様の詳細については [spec.md](spec.md) をご参照ください。
- アーキテクチャ、ディレクトリ構造、各ファイルの役割分担等の内部設計については [ARCHITECTURE.md](ARCHITECTURE.md) をご参照ください。
- 過去の作業履歴や実装履歴は [history.md](history.md)（および [history_v0.1.md](history_v0.1.md)）をご参照ください。
