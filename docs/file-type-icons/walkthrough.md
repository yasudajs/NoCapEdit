# ウォークスルー: 拡張子別ファイルアイコン機能の実装 (v2.13.0)

## 1. 概要
NoCapEditが対応しているすべてのファイル関連付け（全47拡張子）に対して、エクスプローラー一覧で一目でファイル種別を識別できるよう、ファイルアイコン（`document.png`）の下部に拡張子名とカテゴリ別カラーの帯バナーを表示する専用マルチ解像度アイコン（ICO）を実装しました。

## 2. 主な変更点と実装内容

### 2.1 アイコン自動生成スクリプト (`scripts/generate_document_icons.py`)
- 原画 `icons/document.png` (512x512 RGBA) をベースに、全47種の拡張子に対応する38種類の専用アイコン（ICO / PNG）を一括生成する自動化スクリプトを作成しました。
- 同一カテゴリ・同義の拡張子（例: `.yaml` と `.yml`、`.txt` と `.text`、`.py` と `.pyw`、`.sh` と `.bash` 等）はアイコンファイルを共有して効率化しています。
- **格納サイズ**: Windowsアイコン標準に準拠したマルチ解像度（256x256, 128x128, 64x64, 48x48, 32x32, 16x16）の6解像度を1つのICOファイル内に格納。

### 2.2 デザイン仕様の最適化
- **帯バナーの高さ**: 書類下部の罫線「下から2段目」（`y=350`〜`y=467`、高さ約117px）まで帯を拡張し、大文字テキストの描画領域を拡大。
- **テキスト配置**: 帯の上下左右に完全中央揃え（`anchor='mm'`）を適用し、均等な美しいマージンを確保。
- **文字サイズ**: 視認性を重視して拡大調整（2文字: 96px, 3文字: 94px, 4文字: 78px, 5文字: 64px）。
- **カテゴリ別カラーリング**:
  - 表計算・データ (`.csv`, `.tsv`): Excelグリーン / フォレストグリーン
  - 汎用テキスト・ログ (`.txt`, `.text`, `.log`): スレートグレー / ニュートラルグレー
  - Markdown (`.md`, `.markdown`): スカイブルー
  - データ・設定 (`.json`, `.jsonl`, `.xml`, `.yaml`, `.yml`): オレンジ / アンバー系
  - 専用形式 (`.nctx`, `.ncmd`): NoCapEditレッド / ワインレッド
  - Web標準 (`.html`, `.htm`, `.css`, `.scss`, `.js`, `.mjs`, `.ts`, `.tsx`, `.jsx`): 各言語公式系カラー
  - プログラミング言語 (`.py`, `.rs`, `.go`, `.java`, `.c`, `.cpp`, `.cs`, `.php`, `.rb`, `.lua`, `.sql`, `.sh`, `.ps1`): 各言語公式系カラー
  - 設定・環境 (`.ini`, `.conf`, `.cfg`, `.env`): ダークティール / チャコール系
  - 一時・バックアップ (`.bak`, `.tmp`, `.temp`): ミュートグレー

### 2.3 NSISインストーラーの改修 (`nsis/installer.nsi`)
- **アイコンファイルのインストール**: `$INSTDIR\icons\` フォルダを作成し、全38個のICOファイルを配置。
- **ProgID登録**: 各拡張子専用のProgID（`NoCapEdit.csv`, `NoCapEdit.txt` 等）を登録し、それぞれの `DefaultIcon` に対応する専用アイコンファイルを割り当て。
- **ファイル関連付けと OpenWith**:
  - `Applications\NoCapEdit.exe\SupportedTypes` への登録。
  - `Capabilities\FileAssociations` への登録。
  - 各拡張子の `OpenWithProgids` への登録（「プログラムから開く」候補表示）。
- **マクロ化による保守性向上**: `RegisterFileType` および `UnregisterFileType` マクロを導入し、登録と削除の処理を一元化。
- **アンインストール処理**: インストールされた全アイコンファイル（`$INSTDIR\icons`）および各専用ProgID、レジストリ設定を完全に削除するクリーンアップ処理を実装。

### 2.4 バージョン管理と仕様書更新
- 新機能追加に伴い、MINORバージョンを `v2.12.1` から `v2.13.0` へ更新（管理対象5ファイルを同期更新）。
- `spec.md` のセクション 4.8 を拡張子別ファイルアイコンの仕様に合わせて最新化。

## 3. 検証結果
- **アイコン生成**: `scripts/generate_document_icons.py` を実行し、全38種のICOおよびPNGが正常に生成されたことを確認。
- **ICO解像度検証**: 生成された全ICOファイルに 256x256, 128x128, 64x64, 48x48, 32x32, 16x16 の6つのフレームが正しく含まれていることをスクリプトで検証完了。
- **フロントエンドビルド**: `npm run build` がエラーなく完了。
- **Rustコンパイルチェック**: `cargo check` がエラーなく完了。

## 4. 変更ファイル一覧
- `scripts/generate_document_icons.py` (新規作成)
- `icons/documents/document_*.ico`, `document_*.png` (計76ファイル生成)
- `nsis/installer.nsi` (アイコン配置、拡張子別ProgID登録・削除マクロ導入、バージョン更新)
- `Cargo.toml` (バージョン更新: 2.13.0)
- `package.json` (バージョン更新: 2.13.0)
- `tauri.conf.json` (バージョン更新: 2.13.0)
- `docs/DEVELOPMENT.md` (ポータブルZIPバージョン文字列更新)
- `docs/spec.md` (セクション 4.8 の仕様更新)
- `docs/file-type-icons/task.md` (タスクリスト)
- `docs/file-type-icons/implementation_plan.md` (実装計画書)
- `docs/file-type-icons/walkthrough.md` (本ドキュメント)
