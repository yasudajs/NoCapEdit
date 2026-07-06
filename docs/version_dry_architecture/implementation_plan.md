# バージョン情報の一元管理化（DRY化）実装計画

複数箇所にハードコーディングされていたアプリのバージョン表記を、`Cargo.toml` に定義されたバージョン（唯一の真実のソース）から動的に自動取得・反映する構成に変更し、今後のバージョンアップ時の修正漏れを防ぎます。

## ユーザーレビュー必要事項

特に挙動の変化はなく、内部のコード管理をスマートにするリファクタリングです。

> [!NOTE]
> **仕様への影響**
> - 今後は、`Cargo.toml` の `version` を更新するだけで、ウィンドウタイトルや各種設定のバージョン表記が自動的に追従するようになります。

## 提案する変更

バージョン番号を `0.1.10` とし、以下のファイルを修正します。

### バックエンド

#### [MODIFY] [Cargo.toml](file:///c:/work/NoCapEdit/Cargo.toml)
- バージョンを `0.1.10` に設定します。

#### [MODIFY] [tauri.conf.json](file:///c:/work/NoCapEdit/tauri.conf.json)
- `package.version` を `"0.1.10"` に設定します。

#### [MODIFY] [main.rs](file:///c:/work/NoCapEdit/src/main.rs)
- ウィンドウ生成時の静的なタイトル定義を、`env!("CARGO_PKG_VERSION")` を使用したフォーマット出力へ変更します。
  - `format!("NoCapEdit [ Ver {} ]", env!("CARGO_PKG_VERSION"))`
- フロントエンドにバージョン情報を渡すため、`SettingsResponse` 構造体および `get_settings` Tauriコマンドに `app_version` フィールドを追加し、`env!("CARGO_PKG_VERSION").to_string()` を返却するようにします。

### フロントエンド

#### [MODIFY] [index.html](file:///c:/work/NoCapEdit/src/dist/index.html)
- 静的な `<title>` タグのバージョン表記部分（`[ Ver 0.1.8 ]` 等）を削除し、プレーンな `<title>NoCapEdit</title>` に変更します。

#### [MODIFY] [main.js](file:///c:/work/NoCapEdit/src/dist/main.js)
- `init()` 関数内で、バックエンドの `get_settings` から取得した `settings.app_version` を使用し、`document.title` にバージョンを動的に適用する処理を追加します。

## 検証計画

### 自動テスト
- 実機手動テストにて動作を確認します。

### 手動検証
- **ウィンドウタイトルの確認**: アプリを `cargo run` で起動し、タイトルバーに `NoCapEdit [ Ver 0.1.10 ]` と動的に出力されていることを確認します。
- **バージョン情報の単一更新性**:
  - テスト的に `Cargo.toml` のバージョンを別の一時的な値（例: `0.1.10-test`）に変更して起動し、ウィンドウタイトルも自動的に追従して変更されることを確認します（動作確認後、元に戻します）。
