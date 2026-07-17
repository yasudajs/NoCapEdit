# v0.2系 バージョン識別用アイコンの適用およびポータブル版リネーム

v0.1系とv0.2系のローカル並行利用時の識別性を向上させ、かつWindowsのアイコンキャッシュ競合を防ぐため、v0.2系のデスクトップ/タスクバー用アイコンのデザインを変更し、かつポータブル版（ZIP内の実行ファイル）の名前を自動的に `NoCapEdit_v02.exe` に変更してパッケージングするようにします。

アプリの内部処理（製品名、アプリID、二重起動防止ポート）は変更しないため、安全性が完全に保たれ、設定ファイルも共有されます。また、バージョンを次の内部バージョンである `0.2.16` に更新します。

## デザイン案

v0.2系アイコンのデザイン案は以下の通りです。

![v0.2用アイコンデザイン案 (テキストなし・右下青色「2」& 最大化)](file:///C:/Users/yjsmo/.gemini/antigravity/brain/e4ff228d-7b82-4a5e-8597-57a258579e0f/icon_v2_e_styled_1784243026143.jpg)

## 変更対象ファイル

### バージョン管理ファイルの更新 (0.2.15 -> 0.2.16)

#### [MODIFY] [Cargo.toml](file:///c:/work/NoCapEdit/Cargo.toml)
- `version` を `"0.2.16"` に更新。

#### [MODIFY] [tauri.conf.json](file:///c:/work/NoCapEdit/tauri.conf.json)
- `package.version` を `"0.2.16"` に更新（製品名は `NoCapEdit` のまま維持）。

#### [MODIFY] [installer.nsi](file:///c:/work/NoCapEdit/nsis/installer.nsi)
- `VERSION` を `"0.2.16"` に更新。
- `VERSIONWITHBUILD` を `"0.2.16.0"` に更新（製品名・バイナリ名は `NoCapEdit` のまま維持）。

#### [MODIFY] [DEVELOPMENT.md](file:///c:/work/NoCapEdit/docs/DEVELOPMENT.md)
- ポータブル版ビルドコマンド例を、ZIPアーカイブ化する前に `NoCapEdit_v02.exe` へリネームする手順に更新。

---

### アイコンファイルの更新

#### [MODIFY] `icons/` 配下のファイル群
- `icons/32x32.png`
- `icons/128x128.png`
- `icons/128x128@2x.png`
- `icons/icon.png`
- `icons/icon.ico`
- `icons/icon.icns`
- `icons/Square*.png` (Windowsタイル用)
- `icons/StoreLogo.png`

---

## 実装手順

1. **バージョン管理ファイルの更新**:
   - `Cargo.toml`, `tauri.conf.json`, `nsis/installer.nsi` の3ファイルを `0.2.16` に更新します。

2. **ポータブル版ビルド手順の更新**:
   - `docs/DEVELOPMENT.md` にて、`Compress-Archive` を行う前に実行ファイルを `NoCapEdit_v02.exe` にコピー（リネーム）してパッケージングする記述に更新します。

3. **ソースPNG画像の準備とアプリアイコン再生成 (済)**:
   - 新デザインの画像を `icons/icon.png` として配置し、`cargo tauri icon` コマンドを使用して、`icons/` ディレクトリ内の各種サイズアイコンおよび `icon.ico`, `icon.icns` を自動再生成します。

---

## 検証計画

### ポータブル版ビルドと解凍検証
- リネームを伴うビルドコマンドを実際にローカルで実行し、`NoCapEdit_v0.2.16_x64_portable.zip` が作成されることを確認します。
- 作成された ZIP を解凍し、中身のファイルが `NoCapEdit_v02.exe` にリネームされていることを確認します。
- エクスプローラー上でアイコンが「2」付き（右下表示・最大化）に変わることを目視確認します。
