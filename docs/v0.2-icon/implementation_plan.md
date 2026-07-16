# v0.2系 バージョン識別用アイコンの適用およびバージョン更新 (Eスタイルデザイン版)

v0.1系とv0.2系のローカル並行インストール時の識別性を向上させるため、v0.2系のデスクトップ/タスクバー用アイコンのデザインを変更します。アイコンの円形（◯）要素をキャンバスいっぱいに最大化し、右下に中央の「E」マークと全く同じデザイン（白抜きのフォントスタイル）の「2」の数字を追記した特別デザインにします（余分なテキスト文字は一切含めません）。また、プロジェクトルールに基づき、バージョンを次の内部バージョンである `0.2.16` に更新します。

## デザイン案

修正後のv0.2系アイコンのデザイン案は以下の通りです。

![v0.2用アイコンデザイン案 (テキストなし・右下Eスタイル「2」& 最大化)](file:///C:/Users/yjsmo/.gemini/antigravity/brain/e4ff228d-7b82-4a5e-8597-57a258579e0f/icon_v2_e_styled_1784243026143.jpg)

## 変更対象ファイル

### バージョン管理ファイルの更新 (0.2.15 -> 0.2.16)

#### [MODIFY] [Cargo.toml](file:///c:/work/NoCapEdit/Cargo.toml)
- `version` を `"0.2.16"` に更新。

#### [MODIFY] [tauri.conf.json](file:///c:/work/NoCapEdit/tauri.conf.json)
- `package.version` を `"0.2.16"` に更新。

#### [MODIFY] [installer.nsi](file:///c:/work/NoCapEdit/nsis/installer.nsi)
- `VERSION` を `"0.2.16"` に更新。
- `VERSIONWITHBUILD` を `"0.2.16.0"` に更新。

#### [MODIFY] [DEVELOPMENT.md](file:///c:/work/NoCapEdit/docs/DEVELOPMENT.md)
- ポータブル版ビルドコマンド例の ZIP ファイル名中のバージョン文字列を `0.2.16` に更新。

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
   - `Cargo.toml`, `tauri.conf.json`, `nsis/installer.nsi`, `docs/DEVELOPMENT.md` の4ファイルを `0.2.16` に更新します。

2. **ソースPNG画像の準備**:
   - AIが生成した JPG 画像 (`icon_v2_e_styled_1784243026143.jpg`) を一時フォルダにコピーし、PowerShell の `System.Drawing` ライブラリを使用して PNG 形式に変換し、`icons/icon.png` (または一時ソース画像) として配置します。

3. **Tauriアイコンの自動生成**:
   - `cargo tauri icon <ソースPNGパス>` コマンドを実行し、`icons/` ディレクトリ内の各種サイズ（32x32, 128x128等）および `icon.ico`, `icon.icns` を自動生成・上書き更新します。

---

## 検証計画

### 開発ビルドの確認
- `cargo tauri dev` を実行し、開発中のウィンドウタイトルバーやタスクバー上のアイコンが「E」と同じデザインの「2」付き（右下表示）かつ最大化された新しいデザインになっていることを確認します。

### リリースビルドの確認
- `cargo tauri build` を実行し、ビルドされた `target/release/NoCapEdit.exe` の実行ファイルアイコンが新しいデザインになっていることを確認します。
- インストーラーをビルドし、インストール中のダイアログ等で「2」付きのアイコンが正しく表示されることを確認します。
