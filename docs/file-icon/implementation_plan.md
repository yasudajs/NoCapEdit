# 実装計画書 - ファイル専用アイコン（案A: 左上ロゴ）の導入およびファイル関連付け対応

## 1. 概要・背景
現在、Windows 上で `.txt` などのファイルを NoCapEdit に関連付けた際、実行可能ファイル本体の丸いアプリアイコンがそのままファイルアイコンとして表示されている。
本改修では、紙の文書（角折れ用紙＋罫線）をベースに左上に NoCapEdit の丸いロゴを配置した専用の**ファイル用アイコン（`document.ico`）**を新規作成・導入し、アプリアイコン（丸いロゴ）とファイルアイコンの絵柄を分離する。
また、インストーラー（NSIS）においてレジストリ設定を拡充し、テキスト・データ系・一時ファイル系に加え、プログラミング言語・Web系（`.html`, `.css`, `.java`, `.py`, `.js`, `.ts`, `.c`, `.cpp`, `.rs` 等）の主要拡張子の事前登録を行うとともに、ユーザーがエクスプローラー等で手動関連付けした「すべてのファイル」に対しても自動的にファイル用アイコンが適用される仕組みを実装する。

---

## 2. 要件・方針

### 2.1 アイコン仕様
- **デザイン（案A採用）**:
  - ベース: 右上の角が折れた白いドキュメントシート（角折れ用紙、薄いグレーのドロップシャドウ、横罫線）
  - ロゴ配置: **左上に NoCapEdit の丸いロゴ**をバッジとして配置（視認性のためのドロップシャドウ付加）
- **ファイル形式**:
  - `icons/document.ico`: Windows マルチサイズアイコン（16x16, 24x24, 32x32, 48x48, 64x64, 128x128, 256x256）
  - `icons/document.png`: マスター高解像度 PNG（512x512）
- **アプリアイコンとの分離**:
  - アプリ本体（`NoCapEdit.exe`、デスクトップショートカット、スタートメニュー等）: 従来の丸い NoCapEdit アイコン（`icon.ico`）を維持。
  - ファイルアイコン: 今回作成する専用アイコン（`document.ico`）を表示。

### 2.2 ファイル関連付け・レジストリ仕様（インストーラー版 / NSIS）
1. **`document.ico` のインストール**:
   - `$INSTDIR\document.ico` として配置し、アンインストール時に自動削除。
2. **共通ドキュメント ProgID（`NoCapEdit.Document`）の定義**:
   - `Software\Classes\NoCapEdit.Document`
   - `Software\Classes\NoCapEdit.Document\DefaultIcon` = `"$INSTDIR\document.ico"`
   - `Software\Classes\NoCapEdit.Document\shell\open\command` = `'"$INSTDIR\NoCapEdit.exe" "%1"'`
3. **関連付けしたファイル全部への自動適用（`Applications\NoCapEdit.exe`）**:
   - `Software\Classes\Applications\NoCapEdit.exe\DefaultIcon` = `"$INSTDIR\document.ico"`
   - `Software\Classes\Applications\NoCapEdit.exe\SupportedTypes` に対応拡張子を登録。
   - これにより、エクスプローラーでユーザーが「プログラムから開く > 常にこのアプリを使って開く」で NoCapEdit を選択したすべてのファイルに対して、自動的に `document.ico` が表示される。
4. **主要拡張子の事前登録（既定のプログラム / Capabilities）**:
   - **テキスト・文書系**: `.txt`, `.text`, `.nctx`, `.ncmd`, `.md`, `.markdown`
   - **データ・構造化ファイル系**: `.csv`, `.tsv`, `.json`, `.jsonl`, `.xml`, `.yaml`, `.yml`
   - **Web・フロントエンド系**: `.html`, `.htm`, `.css`, `.scss`, `.js`, `.mjs`, `.ts`, `.tsx`, `.jsx`
   - **プログラミング言語・ソースコード系**: `.py`, `.pyw`, `.java`, `.c`, `.h`, `.cpp`, `.hpp`, `.cs`, `.rs`, `.go`, `.php`, `.rb`, `.lua`, `.sh`, `.bash`, `.ps1`, `.sql`
   - **ログ・一時ファイル・設定系**: `.log`, `.tmp`, `.temp`, `.bak`, `.ini`, `.conf`, `.cfg`, `.env`
   - Windows 10/11 の「設定 > 既定のアプリ」で NoCapEdit が正式に候補表示されるよう、`Software\nocapedit\NoCapEdit\Capabilities\FileAssociations` および `Software\RegisteredApplications` に上記を登録。
5. **アンインストール処理**:
   - 登録したすべてのレジストリキーを確実に削除。
   - `SHChangeNotify`（`SHCNE_ASSOCCHANGED`）を発行して Windows のアイコンキャッシュを即時更新。

### 2.3 WiX（MSI）設定の整合
- `wix/file-association.wxs` の `DefaultIcon` 参照先も `$INSTDIR\document.ico` に合わせて整合を保ちます。

---

## 3. 修正対象ファイル一覧

| ファイル | 変更内容 |
|---|---|
| `icons/document.png` | 新規作成（マスター 512x512 PNG） |
| `icons/document.ico` | 新規作成（マルチ解像度 16x16〜256x256 ICO） |
| `nsis/installer.nsi` | `document.ico` のファイルコピー追加、ProgID（`NoCapEdit.Document`）の登録、`Applications\NoCapEdit.exe\DefaultIcon` / `SupportedTypes` の登録、Capabilities 登録（Web・プログラミング言語系拡張子追加）、アンインストール処理の更新 |
| `wix/file-association.wxs` | `DefaultIcon` の指定を更新 |
| `docs/spec.md` | ファイル関連付けおよびアイコン仕様の更新 |
| バージョン管理 5 ファイル | `0.2.22` へのバージョンアップ（フェーズ 2 開始時） |

---

## 4. 実装手順（フェーズ2開始後のステップ）

1. **ブランチ作成**: `master` から作業用ブランチ（`feature/file-icon`）を作成
2. **ドキュメント昇格**: `docs/wip/file-icon/` を `docs/file-icon/` へ移動・コミット
3. **バージョン更新**: バージョン管理 5 ファイルを `0.2.22` へ更新
4. **仕様書更新**: `docs/spec.md` にファイルアイコン仕様・レジストリ仕様を追記
5. **アイコン作成**:
   - 高解像度マスター画像 `icons/document.png` を生成
   - 16, 24, 32, 48, 64, 128, 256px を内包した `icons/document.ico` を生成
6. **インストーラー改修**:
   - `nsis/installer.nsi` に `document.ico` のインストール・アンインストール処理を追加
   - ProgID、Applications（SupportedTypes含む）、Capabilities のレジストリ登録を追加
7. **検証**:
   - NSIS インストーラーのビルドとテスト
   - レジストリおよびエクスプローラーでのアイコン表示検証（`.txt`, `.csv`, `.html`, `.py` 等）
8. **ウォークスルー & 変更履歴作成**: `docs/file-icon/walkthrough.md` 作成、`docs/history.md` 更新
