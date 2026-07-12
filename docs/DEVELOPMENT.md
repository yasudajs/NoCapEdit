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
Compress-Archive -Path "target/release/NoCapEdit.exe" -DestinationPath "target/release/bundle/NoCapEdit_v0.2.4_x64_portable.zip" -Force
```

## 📄 仕様詳細
仕様の詳細は [spec.md](spec.md) をご参照ください。
過去の作業履歴や実装履歴は Git のコミットログにて管理されています。

## 💡 開発ノウハウ・トラブルシューティング

### Windows環境におけるファイル監視とパスの取り扱いに関する注意点
Windows上で `notify` クレートを用いたファイル監視を実装する際、以下の仕様による影響を考慮する必要があります。

1. **Rustの `canonicalize()` によるUNCプレフィックス付与**
   Rustの `std::fs::canonicalize` をWindowsで実行すると、長すぎるパスに対応するため自動的に `\\?\` というUNCプレフィックスが付与されます。一方で `notify` から通知されるイベントのパスには通常このプレフィックスは付いていません。そのため、フロントエンド（JavaScript）側で単純に文字列比較を行うと一致しないという問題が発生します。
   - **解決策**: フロントエンド側でのパス比較の前に、必ず正規化処理（`\\?\` の除去、バックスラッシュのスラッシュ化、末尾スラッシュの除去、小文字化）を統一して行う必要があります。

2. **上書き保存時の `Remove` イベント発火**
   `notify` で監視しているフォルダ内でファイルを上書き保存する際、古いファイルを `fs::remove_file` してから一時ファイルを `fs::rename` で配置すると、当然ながら「ファイルが削除された」という `Remove` イベントが発火します。さらにWindowsの仕様により、`remove_file` を省いて `fs::rename` だけで既存ファイルへ上書きした場合でも、OSレベルで置換処理が行われる影響で対象ファイルに対する `Remove(Any)` イベントが発火してしまいます。
   - **解決策**: 上書き保存時には一時ファイル（`tmp`）を用いたアトミックなリネーム保存ではなく、対象ファイルへ直接 `fs::write` を行うことで、意図しない削除イベントの発火（およびそれに伴うフロントエンドでのタブ自動クローズなどの誤動作）を防ぐことができます。
