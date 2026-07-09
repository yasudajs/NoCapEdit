# 配布用パッケージ（インストーラー）の日本語化

配布用インストーラー（Windows向け）の画面が英語になっている問題を解決し、日本語化します。

## 修正の背景・目的
Tauriを使用したWindows向けインストーラーで、NSISのカスタムテンプレートに英語が指定されているため、インストール画面が英語で表示されています。これを日本語化します。

## 提案する変更内容
### `nsis/installer.nsi`
- `!insertmacro MUI_LANGUAGE "English"` という行を `!insertmacro MUI_LANGUAGE "Japanese"` に変更します。

### `tauri.conf.json`
- MSI版（WiXインストーラー）を日本語化するため、`tauri.bundle.windows.wix` 内に `"language": "ja-JP"` または `["ja-JP"]` を追加します。
- 同様に、NSISや全体のバンドル設定で必要な日本語指定（`ja-JP`）があれば設定を追加します。

## 確認事項
特になし。

## 検証計画
- ビルドして生成されるインストーラー（`.exe` や `.msi`）を実行し、画面が日本語化されているかを確認していただきます。
