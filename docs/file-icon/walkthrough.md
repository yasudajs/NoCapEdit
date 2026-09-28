# ウォークスルー - ファイル専用アイコンの導入および関連付け対応 (Ver 0.2.22)

## 1. 概要
NoCapEdit に関連付けられたファイル（`.txt`, `.csv`, `.html`, `.py` 等）のアイコンが実行ファイル本体の丸いアプリアイコンのまま表示されてしまう問題を解消するため、専用のドキュメント用アイコン（`document.ico`）を導入し、アプリアイコンとファイルアイコンの絵柄を分離しました。

また、主要拡張子（テキスト、データ、Web・プログラミング言語、一時ファイル等）の事前登録と、ユーザーが手動で関連付けした「すべてのファイル」への自動アイコン適用を NSIS インストーラーに実装しました。

---

## 2. 実施した変更内容

### 2.1 ファイル専用アイコンの作成 (`icons/document.ico`, `icons/document.png`)
- **デザイン（案A採用）**:
  - ベース: 右上の角が折れた白いドキュメントシート（角折れ用紙＋横罫線＋柔らかいドロップシャドウ）
  - ロゴ: **左上に NoCapEdit の丸いロゴ**をバッジとして配置（輪郭とシャドウ付き）
- **マルチ解像度対応**:
  - Windows のエクスプローラー（大アイコン、特大アイコン、中アイコン、詳細・一覧表示など）に合わせて、以下の 7 解像度（32bpp RGBA）を内包した `icons/document.ico` を生成:
    - 16x16, 24x24, 32x32, 48x48, 64x64, 128x128, 256x256
  - マスター高解像度画像として `icons/document.png`（512x512）も作成。

### 2.2 NSIS インストーラーの改修 (`nsis/installer.nsi`)
1. **`document.ico` のインストール & アンインストール**:
   - インストール時に `$INSTDIR\document.ico` を配置。
   - アンインストール時に `$INSTDIR\document.ico` を自動削除。
2. **共通ドキュメント ProgID (`NoCapEdit.Document`) の登録**:
   - `DefaultIcon` に `"$INSTDIR\document.ico"` を指定。
   - `shell\open\command` に `'"$INSTDIR\NoCapEdit.exe" "%1"'` を指定。
3. **関連付けしたファイル全部への自動アイコン適用 (`Applications\NoCapEdit.exe`)**:
   - `Software\Classes\Applications\NoCapEdit.exe\DefaultIcon` に `"$INSTDIR\document.ico"` を設定。
   - これにより、エクスプローラー等でユーザーが「プログラムから開く > 常にこのアプリを使って開く」で NoCapEdit を選んだ**すべてのファイル**に、自動的にファイル専用アイコンが表示されます。
4. **主要対応拡張子の事前登録 (SupportedTypes / Capabilities / OpenWithProgids)**:
   - **テキスト・文書系**: `.txt`, `.text`, `.nctx`, `.ncmd`, `.md`, `.markdown`
   - **データ・構造化ファイル系**: `.csv`, `.tsv`, `.json`, `.jsonl`, `.xml`, `.yaml`, `.yml`
   - **Web・フロントエンド系**: `.html`, `.htm`, `.css`, `.scss`, `.js`, `.mjs`, `.ts`, `.tsx`, `.jsx`
   - **プログラミング言語系**: `.py`, `.pyw`, `.java`, `.c`, `.h`, `.cpp`, `.hpp`, `.cs`, `.rs`, `.go`, `.php`, `.rb`, `.lua`, `.sh`, `.bash`, `.ps1`, `.sql`
   - **ログ・一時ファイル・設定系**: `.log`, `.tmp`, `.temp`, `.bak`, `.ini`, `.conf`, `.cfg`, `.env`
   - `SupportedTypes` に登録して「プログラムから開く」の推奨候補に表示。
   - `Capabilities\FileAssociations` および `RegisteredApplications` に登録して Windows の「既定のアプリ」設定画面に対応。
   - `OpenWithProgids` に登録してコンテキストメニューからの関連付けを強化。
5. **アンインストール時の完全クリーンアップ**:
   - 登録したすべての ProgID、Applications キー、Capabilities、OpenWithProgids の値を確実に削除し、`SHChangeNotify`（`SHCNE_ASSOCCHANGED`）でアイコンキャッシュを即時更新。

### 2.3 WiX 設定の整合 (`wix/file-association.wxs`)
- `NoCapEdit.nctx` および `NoCapEdit.ncmd` の `DefaultIcon` 参照先を `[INSTALLDIR]document.ico` に更新。

### 2.4 ドキュメントおよびバージョン更新
- **バージョン管理 5 ファイル**: `0.2.22` に更新（`Cargo.toml`, `package.json`, `tauri.conf.json`, `nsis/installer.nsi`, `docs/DEVELOPMENT.md`）
- **仕様書 (`docs/spec.md`)**: セクション 4.6 にファイル専用アイコンと OS 関連付け仕様を追記。

---

## 3. 検証結果

| 検証項目 | 結果 | 備考 |
|---|---|---|
| フロントエンドビルド (`npm run build`) | **成功** | エラーなく Vite ビルド完了 |
| バックエンドチェック (`cargo check`) | **成功** | エラー・警告なし |
| 単体テスト (`cargo test`) | **成功** | 全 3 件パス |
| NSIS インストーラービルド (`cargo tauri build`) | **成功** | `NoCapEdit_0.2.22_x64-setup.exe` 生成完了 |
| MSI パッケージビルド | **成功** | `NoCapEdit_0.2.22_x64_ja-JP.msi` 生成完了 |
| `document.ico` の解像度検証 | **成功** | 16, 24, 32, 48, 64, 128, 256px の全 7 フレームを確認 |
| NSIS スクリプト構文 & 生成内容検証 | **成功** | `document.ico` コピー、各レジストリ登録、アンインストール削除を確認 |
