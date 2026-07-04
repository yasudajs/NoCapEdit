# Phase 7: 調整とリリース準備の実装計画

本計画では、機能実装およびテストが完了した NoCapEdit の配布パッケージ（インストーラー）を構築し、本番環境向けのコードクリーンアップとリリース検証を行います。

## User Review Required

> [!IMPORTANT]
> **プロダクションビルドの実行**:
> `cargo tauri build` を実行し、Windows 向けのインストーラー（`.msi`）が正常に生成されるかを確認します。このビルド時に透過アイコンが実行ファイルやインストーラーに正しく埋め込まれます。

> [!NOTE]
> **コードのクリーンアップ**:
> 開発中に差し込んだ不要な `console.log` や一時的なデバッグ用コードを整理し、本番リリースの品質に仕上げます。

## Proposed Changes

### リリース検証・クリーンアップ

---

#### [NEW] [implementation_plan.md](file:///c:/work/NoCapEdit/docs/phase_7_adjustments_and_release_preparation/implementation_plan.md)
- 本計画書をプロジェクト配下へ追加。

#### [MODIFY] [main.js](file:///c:/work/NoCapEdit/src/dist/main.js)
- 開発用の `console.log` 出力の精査・整理（不要なエラーログ以外のデバッグ用ログの削除）。

#### [MODIFY] [.gitignore](file:///c:/work/NoCapEdit/.gitignore)
- `*.tmp` などの一時ファイルや、自動生成された余計なキャッシュ類が Git の追跡に入らないようルールを確認・追加。

## Verification Plan

### Release Verification Checklist
1. **インストーラーのビルド成功**:
   - `cargo tauri build` コマンドがエラーなく完了すること。
2. **インストーラーの動作確認**:
   - 生成された `.msi` ファイルを用いてアプリのインストール・起動ができること。
3. **メタデータの適用確認**:
   - インストール後の起動ショートカット、タスクバー、タイトルバー、および実行ファイルのプロパティで、製品名「NoCapEdit」と「透過アプリアイコン」が正しく表示されること。
