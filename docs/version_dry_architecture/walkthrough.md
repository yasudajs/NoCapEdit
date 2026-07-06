# バージョン情報の一元管理化（DRY化）の確認

これまで4箇所にハードコーディングされていたアプリのバージョン表記を、`Cargo.toml` の定義に一元化（DRY化）し、バージョンを `0.1.10` にアップデートしました。

## 変更内容

### バックエンド

#### [Cargo.toml](file:///c:/work/NoCapEdit/Cargo.toml)
- アプリ全体のバージョンを `0.1.10` に設定しました。

#### [tauri.conf.json](file:///c:/work/NoCapEdit/tauri.conf.json)
- ビルドメタデータ設定のため、パッケージバージョンを `"0.1.10"` に設定しました。

#### [main.rs](file:///c:/work/NoCapEdit/src/main.rs)
- ウィンドウタイトルに `env!("CARGO_PKG_VERSION")` を適用し、コンパイル時に自動的に `Cargo.toml` のバージョンが適用されるよう動的化しました。
- `SettingsResponse` 構造体および `get_settings` Tauriコマンドに `app_version` フィールドを追加し、フロントエンドにバージョン文字列（`env!("CARGO_PKG_VERSION").to_string()`）を返すよう拡張しました。

### フロントエンド

#### [index.html](file:///c:/work/NoCapEdit/src/dist/index.html)
- 静的な `<title>` タグのハードコード部分を削除し、プレーンな `<title>NoCapEdit</title>` に変更しました。

#### [main.js](file:///c:/work/NoCapEdit/src/dist/main.js)
- `init()` の初期化シーケンスにおいて、バックエンド（`get_settings`）から返却された `settings.app_version` を使用し、`document.title` にバージョンを動的に適用する処理を追加しました。

### 仕様書

#### [mvp-spec.md](file:///c:/work/NoCapEdit/docs/mvp-spec.md)
- バージョン一元管理化の仕様追加に伴い、バージョンを `0.1.10` に更新し、仕様書内の関連箇所を更新しました。

## 検証結果

- **ビルド・コンパイルチェック**: `cargo check` にてコンパイルエラーがなく、正常に `NoCapEdit v0.1.10` としてビルド可能であることを確認しました。
- **DRY設計の整合性**:
  - ウィンドウおよびブラウザ側のタイトルが、バックエンドと同期して動的に設定される設計に変更されました。
  - 今後は `Cargo.toml` のバージョン表記を変更するだけで、アプリ全体の表示バージョンが自動同期されます。
