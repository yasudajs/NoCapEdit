# Phase 7: 調整とリリース準備の実装計画 (アプリアイコン追加対応版)

本計画では、機能実装およびテストが完了した NoCapEdit の配布パッケージ（インストーラー）を構築し、本番環境向けのコードクリーンアップとリリース検証を行います。
また、**実行ファイル（.exe）にアプリアイコン（透過アイコン）が適用されない問題**に対処するため、ビルドスクリプトの修正を行います。

## User Review Required

> [!IMPORTANT]
> **build.rs の修正（Tauriビルドプロセスの有効化）**
> 現在の `build.rs` が空の `main` 関数になっているため、Windowsの実行ファイルリソース（アプリアイコンなど）がコンパイル時に埋め込まれていません。
> `build.rs` で `tauri_build::build()` を呼び出すように修正し、リリースビルド時に自動で `icons/icon.ico` が実行ファイルに埋め込まれるようにします。

> [!IMPORTANT]
> **プロダクションビルドの再実行**:
> `build.rs` の修正後、`npx.cmd @tauri-apps/cli@^1 build` を再実行して、生成された `NoCapEdit.exe` に透過アイコンが適用されていることを確認します。

## Proposed Changes

### リースリソース・クリーンアップ

---

#### [MODIFY] [build.rs](file:///c:/work/NoCapEdit/build.rs)
- コメントアウトまたは省略されている `tauri_build::build()` の呼び出しを有効化します。

#### [MODIFY] [implementation_plan.md](file:///c:/work/NoCapEdit/docs/phase_7_adjustments_and_release_preparation/implementation_plan.md)
- 本計画書をプロジェクト配下へ追加。

#### [MODIFY] [main.js](file:///c:/work/NoCapEdit/src/dist/main.js)
- 開発用の `console.log` 出力の精査・整理（不要なエラーログ以外のデバッグ用ログの削除）。

#### [MODIFY] [.gitignore](file:///c:/work/NoCapEdit/.gitignore)
- `*.tmp` などの一時ファイルや、自動生成された余計なキャッシュ類が Git の追跡に入らないようルールを確認・追加。

## Verification Plan

### Release Verification Checklist
1. **インストーラーのビルド成功**:
   - `npx.cmd @tauri-apps/cli@^1 build` コマンドがエラーなく完了すること。
2. **実行ファイルアプリアイコンの埋め込み確認**:
   - 生成された `target/release/NoCapEdit.exe` のアイコンが、Windows のエクスプローラー上で透過アプリアイコン（丸い「nce」のマーク）に変化していることを確認します。
