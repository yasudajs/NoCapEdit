# 不要なブラウザショートカット（リロード・印刷）の無効化 実装計画書

Tauri アプリ（WebView2）上で動作する不要なブラウザ標準機能（Ctrl + R, F5 によるリロード、および Ctrl + P による印刷）を無効化し、ユーザーの誤操作によるデータ消失を防ぎ、デスクトップアプリとしての操作性を向上させます。

## ユーザーレビュー要求事項

> [!IMPORTANT]
> - 本修正を適用したテスト版（v0.1.36）をビルド後、**実際にキー（Ctrl + R, F5, Ctrl + P）を押して動作しないこと** をユーザー様にて手動テストしていただく必要があります。

## 変更内容

### フロントエンド

#### [MODIFY] [main.js](file:///c:/work/NoCapEdit/src/dist/js/main.js)
`window.addEventListener('keydown')` 内に、以下のキー入力をキャンセルする処理（`e.preventDefault()`）を追加します。
- `F5` / `Ctrl + R` / `Ctrl + Shift + R` （リロード）
- `Ctrl + P` （印刷）

### バージョン管理ファイルの更新

v0.1系を `0.1.35` から `0.1.36` にインクリメントするため、以下のファイルを更新します。

#### [MODIFY] [Cargo.toml](file:///c:/work/NoCapEdit/Cargo.toml)
`version = "0.1.35"` ➔ `version = "0.1.36"`

#### [MODIFY] [tauri.conf.json](file:///c:/work/NoCapEdit/tauri.conf.json)
`"version": "0.1.35"` ➔ `"version": "0.1.36"`

#### [MODIFY] [installer.nsi](file:///c:/work/NoCapEdit/nsis/installer.nsi)
`!define VERSION "0.1.35.0"` ➔ `!define VERSION "0.1.36.0"`
`!define VERSIONWITHBUILD "0.1.35.0"` ➔ `!define VERSIONWITHBUILD "0.1.36.0"`

#### [MODIFY] [DEVELOPMENT.md](file:///c:/work/NoCapEdit/docs/DEVELOPMENT.md)
ビルドコマンド内のポータブル版ファイル名に含まれるバージョン表記を `0.1.35` ➔ `0.1.36` に更新します。

---

## 検証計画

### 開発時の動作確認 (AI)
- [ ] JavaScript の構文エラーがないことの確認。
- [ ] 開発用ビルドを実行し、プログラムが正常に起動すること。

### 手動テスト (ユーザー様)
アプリ起動後、以下のキーボード操作を行い、それぞれの期待される動作になることを確認します。

- [x] **`Ctrl + R`** を押して、画面がリロード（初期化）されないこと。
- [x] **`F5`** を押して、画面がリロードされないこと。
- [x] **`Ctrl + P`** を押して、印刷ダイアログが表示されないこと。
- [x] 文字入力や `Ctrl + Z`（戻す）、`Ctrl + S`（手動保存）が正常に動くこと。
