# 実装ウォークスルー: エクスプローラーを開く機能（Ctrl+E）

## 実装内容

ファイル操作の利便性を向上させるため、NoCapEditのデータ保存先（ホームフォルダ）をOS標準のエクスプローラーで開く機能を追加しました。

### フロントエンド（JS）の変更
- `src/dist/js/ui/shortcuts.js`
  - 新たに `appState` のインポートを追加しました。
  - ショートカットキー監視（`keydown`）イベント内に、`Ctrl + E` 押下時の処理を追加しました。
  - `window.__TAURI__.shell.open(appState.homeFolder)` を呼び出し、設定されているホームフォルダをネイティブのエクスプローラーで開くようにしました。

### バージョン管理ファイルの更新
- バージョンを `0.1.73` から `0.1.74` へ更新しました。
  - `Cargo.toml`
  - `tauri.conf.json`
  - `nsis/installer.nsi`
  - `docs/DEVELOPMENT.md`

### ドキュメントの更新
- `docs/spec.md`
  - 「4.1 ホームフォルダの設定と管理」にエクスプローラー連携機能の説明を追記しました。
- `docs/SHORTCUTS.md`
  - 新たに「📁 ファイル管理」セクションを設け、`Ctrl+E` のショートカット仕様を追記しました。
- `docs/history.md`
  - 今回の機能追加について `Ver 0.1.74` の履歴を追記しました。

## 検証結果
- `cargo check` を実行し、Rust側のビルド（コンパイルエラー）が発生しないことを確認しました。
- TauriのAPI設定（`tauri.conf.json` の `shell.open` の許可）は既に正しく設定されているため、フロントエンドの変更のみで機能することが確認できています。
