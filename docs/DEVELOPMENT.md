# 🛠️ 動作環境とビルド・開発方法

現在のバージョンは Windows 環境を対象として構成されています。

### 📋 開発環境のセットアップ（新規環境・PC再セットアップ時）

本プロジェクトの開発・ビルドに必要なツール一覧とインストール手順です。

#### 1. 管理者権限の PowerShell で実行するツール
「管理者として実行」した PowerShell で以下を実行します。

```powershell
# Visual Studio Build Tools (RustのMSVCターゲットに必須: C++ ワークロード)
winget install --id Microsoft.VisualStudio.2022.BuildTools -e --override "--passive --wait --add Microsoft.VisualStudio.Workload.VCTools --includeRecommended"

# インストーラー作成ツール (NSIS)
winget install --id NSIS.NSIS -e
```

#### 2. 通常の PowerShell で実行するツール
新しい PowerShell ウィンドウを開き、以下を順に実行します。

```powershell
# Node.js (LTS) & パッケージマネージャー
winget install --id OpenJS.NodeJS.LTS -e
npm install -g pnpm

# Rust ツールチェーン (1.70 以上)
winget install --id Rustlang.Rustup -e

# リリース・Git関連
winget install --id GitHub.cli -e

# Tauri CLI v1系 (※必ずv1系を使用。v2系は設定ファイル互換性がないため非対応)
cargo install tauri-cli --version "^1.6"
```

> [!TIP]
> `cargo install` のビルド時間を短縮したい場合は、`cargo-binstall` を使用するとビルド済み公式バイナリを数秒で導入できます：
> ```powershell
> cargo binstall tauri-cli@1.6.6 --no-confirm
> ```

#### 3. リポジトリの初期設定と依存関係の取得
```powershell
# リポジトリディレクトリの Git 所有権安全設定 (PC再インストール時等)
git config --global --add safe.directory D:/antigravity/NoCapEdit

# フロントエンド依存関係のインストール
pnpm install

# Rust依存関係の確認・キャッシュ
cargo check
```

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
cargo tauri build; Compress-Archive -Path "target/release/NoCapEdit.exe" -DestinationPath "target/release/bundle/NoCapEdit_v2.15.0_x64_portable.zip" -Force
```

---

## 📄 仕様詳細と設計情報
- 仕様の詳細については [spec.md](spec.md) をご参照ください。
- アーキテクチャ、ディレクトリ構造、各ファイルの役割分担等の内部設計については [ARCHITECTURE.md](ARCHITECTURE.md) をご参照ください。
- 過去の作業履歴や実装履歴は [history.md](history.md)（および [history_v0.1.md](history_v0.1.md)）をご参照ください。
