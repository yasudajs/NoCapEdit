# 実装計画書: 拡張子別ファイルアイコン機能

## 1. 概要
NoCapEditが対応しているすべてのファイル関連付け（全47種）に対して、ファイルアイコン（`document.ico`）の下部に拡張子名と色分け帯バナーを表示する専用アイコンを導入します。
これにより、Windowsのエクスプローラー上で一覧表示した際に、一目でファイル種別（CSV, TXT, MD, JSON, Pythonなど）を視認・判別できるようになります。

## 2. デザイン仕様
- **ベース画像**: `icons/document.png` (512x512 RGBA)
- **スタイル**: 下部帯バナースタイル（案A改良版）
- **帯の高さ**: 書類下部の罫線「下から2段目」まで（`y=350`〜`y=467`、高さ約117px）
- **文字仕様**:
  - フォント: Segoe UI Black（白太字）
  - 配置: 帯の上下左右中央（`anchor='mm'`）
  - 文字表記: 大文字
    - 2文字: 96px（MD, JS, TS, PY, RS, CS, GO, SH 等）
    - 3文字: 94px（CSV, TXT, LOG, SQL, XML, CSS, PHP, INI, CFG, ENV, TMP, BAK 等）
    - 4文字: 78px（JSON, NCTX, NCMD, HTML, SCSS, JAVA, BASH 等）
    - 5文字: 64px
  - 書類底辺の角丸（radius: 10px）に合わせて帯を描画
- **アイコン解像度**: Windows規格に準拠したマルチ解像度ICO（256x256, 128x128, 64x64, 48x48, 32x32, 16x16）

## 3. 対象拡張子とカラーパレット（全47種）

| カテゴリ | 拡張子 | 表示テキスト | カラー名 | カラーコード (HEX / RGB) |
|---|---|---|---|---|
| **専用形式** | `.nctx` | NCTX | NoCapEdit Red | `#D63031` (214, 48, 49) |
| | `.ncmd` | NCMD | NoCapEdit Wine | `#B71540` (183, 21, 64) |
| **テキスト・ログ** | `.txt`, `.text` | TXT | Slate Gray | `#4B6584` (75, 101, 132) |
| | `.log` | LOG | Neutral Gray | `#576574` (87, 101, 116) |
| **ドキュメント** | `.md`, `.markdown` | MD | Sky Blue | `#0984E3` (9, 132, 227) |
| **表計算・データ** | `.csv` | CSV | Excel Green | `#107C41` (16, 124, 65) |
| | `.tsv` | TSV | Forest Green | `#009432` (0, 148, 50) |
| **データ・設定** | `.json`, `.jsonl` | JSON | Amber Orange | `#E67E22` (230, 126, 34) |
| | `.xml` | XML | Warm Amber | `#F39C12` (243, 156, 18) |
| | `.yaml`, `.yml` | YAML | Coral Orange | `#E17055` (225, 112, 85) |
| | `.ini` | INI | Dark Teal | `#2C3E50` (44, 62, 80) |
| | `.conf` | CONF | Dark Teal | `#2C3E50` (44, 62, 80) |
| | `.cfg` | CFG | Dark Teal | `#2C3E50` (44, 62, 80) |
| | `.env` | ENV | Charcoal | `#34495E` (52, 73, 94) |
| **Web標準** | `.html`, `.htm` | HTML | HTML Orange | `#E44D26` (228, 77, 38) |
| | `.css` | CSS | CSS Blue | `#264DE4` (38, 77, 228) |
| | `.scss` | SCSS | Sass Pink | `#CF649A` (207, 100, 154) |
| | `.js`, `.mjs` | JS | JS Amber Gold | `#D4AC0D` (212, 172, 13) |
| | `.ts` | TS | TS Blue | `#3178C6` (49, 120, 198) |
| | `.jsx` | JSX | React Cyan | `#00A8FF` (0, 168, 255) |
| | `.tsx` | TSX | React TS Indigo | `#273C75` (39, 60, 117) |
| **プログラミング言語** | `.py`, `.pyw` | PY | Python Blue | `#3776AB` (55, 118, 171) |
| | `.rs` | RS | Rust Brown | `#A0522D` (160, 82, 45) |
| | `.go` | GO | Go Cyan | `#00ADD8` (0, 173, 216) |
| | `.java` | JAVA | Java Orange | `#E76F00` (231, 111, 0) |
| | `.c` | C | C Blue | `#5C6BC0` (92, 107, 192) |
| | `.h` | H | C Header Purple | `#7E57C2` (126, 87, 194) |
| | `.cpp` | CPP | C++ Indigo | `#3F51B5` (63, 81, 181) |
| | `.hpp` | HPP | C++ Header Indigo | `#303F9F` (48, 63, 159) |
| | `.cs` | CS | C# Purple | `#6C5CE7` (108, 92, 231) |
| | `.php` | PHP | PHP Lavender | `#777BB4` (119, 123, 180) |
| | `.rb` | RB | Ruby Red | `#CC342D` (204, 52, 45) |
| | `.lua` | LUA | Lua Navy | `#000080` (0, 0, 128) |
| | `.sql` | SQL | Database Teal | `#008080` (0, 128, 128) |
| | `.sh`, `.bash` | SH | Shell Green | `#27AE60` (39, 174, 96) |
| | `.ps1` | PS1 | PowerShell Navy | `#012456` (1, 36, 86) |
| **バックアップ・一時** | `.bak` | BAK | Muted Gray | `#7F8C8D` (127, 140, 141) |
| | `.tmp`, `.temp` | TMP | Muted Gray | `#7F8C8D` (127, 140, 141) |

※同一種類の拡張子（例: `.yaml` と `.yml`、`.txt` と `.text`、`.py` と `.pyw`）は、同一のアイコンファイルを共有して効率化します。

## 4. 実装ステップ

### 4.1 アイコン自動生成スクリプト（`scripts/generate_document_icons.py`）
- Pillowを使用して、`icons/document.png` をベースに上記定義一覧から一括でアイコンを生成。
- 生成先: `icons/documents/` 配下（例: `document_csv.ico`, `document_txt.ico` など）および対応するPNG。
- 1つのICOファイル内にマルチ解像度（256, 128, 64, 48, 32, 16px）を格納。
- 共通フォールバック用として、未定義拡張子用の標準 `document.ico` も引き続き保持。

### 4.2 NSISインストーラー（`nsis/installer.nsi`）の改修
1. **ファイルのインストール**:
   - `File /r "..\..\..\..\icons\documents\*.ico"` により、各拡張子ICOを `$INSTDIR\icons\` に配置。
2. **ProgIDおよび関連付けの登録**:
   - 各拡張子グループごとに専用のProgID（例: `NoCapEdit.csv`, `NoCapEdit.txt` 等）を登録。
   - 各ProgIDの `DefaultIcon` に `$INSTDIR\icons\document_<ext>.ico` を指定。
   - `Capabilities\FileAssociations` の参照先ProgIDをそれぞれの専用ProgIDに更新。
3. **アンインストール処理**:
   - インストールされた各ICOファイルおよび追加したProgIDレジストリキーを確実に削除。

### 4.3 WiXインストーラー（`wix/file-association.wxs`）の改修
- MSIパッケージ向けにも必要に応じて各拡張子のアイコン・ProgIDコンポーネントを追記・整合。

### 4.4 バージョン管理とドキュメント更新
- バージョン番号: MINOR更新（`v2.12.1` → `v2.13.0`）
- 対象5ファイル（`Cargo.toml`, `package.json`, `tauri.conf.json`, `nsis/installer.nsi`, `docs/DEVELOPMENT.md`）の更新。
- `spec.md` の仕様更新。
- 検証完了後、`docs/file-type-icons/walkthrough.md` の作成および `docs/history.md` への変更履歴追記。

## 5. 検証手順
1. **アイコン生成テスト**:
   - Pythonスクリプトを実行し、全拡張子の `.ico` ファイルが破損なく指定解像度で生成されることを確認。
2. **NSISインストーラーの構文・ビルド確認**:
   - NSISスクリプトに構文エラーがないこと、および各レジストリ設定が整合していることを確認。
3. **成果物の確認**:
   - 生成された各解像度での視認性を画像ビューア等で検証。
