# Tauri v1.6 アップデート計画

Tauri v1.5系 から最新の v1.6系 へのアップデートを行います。

## 調査結果概要
Tauri v1.5 から v1.6 へのアップデートは「マイナーバージョンアップ」であり、**アーキテクチャの変更や破壊的変更はありません**。
主に安定性の向上やバグ修正（デッドロックの修正やイベントループのクラッシュ修正など）が含まれています。
そのため、コードの書き換え等は発生せず、バージョン指定の変更のみで安全に移行可能です。

## 変更内容 (Proposed Changes)

### Cargo.toml

Rustプロジェクトの依存関係のバージョン指定を更新します。

#### [MODIFY] [Cargo.toml](file:///c:/work/NoCapEdit/Cargo.toml)
- `[dependencies]` の `tauri = { version = "1.5", ... }` を `version = "1.6"` に変更します。
- `[build-dependencies]` の `tauri-build = { version = "1.5" }` を `version = "1.6"` に変更します。

※フロントエンドのJSコードについては、現在 `window.__TAURI__` を通じてAPIを呼び出しており、v1.6でもAPIの互換性は完全に保たれているため、修正は不要です。

## Verification Plan

### Automated Tests
- `cargo update` を実行して `Cargo.lock` を更新します。
- `cargo check` および `cargo build` を実行し、コンパイルエラーが発生しないことを確認します。

### Manual Verification
- アプリを起動し、正常に画面が表示されるか確認します。
- 設定ダイアログ等から、既存のTauri API（ファイルの読み書き、ダイアログ表示、外部リンクを開く等）が問題なく動作するか確認します。
