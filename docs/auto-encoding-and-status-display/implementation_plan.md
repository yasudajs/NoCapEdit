# 文字コード自動判定（Shift_JIS / UTF-8 等）およびステータスバー文字コード表示対応 実装計画書

## 1. 概要
Excel 等で出力された Shift_JIS (CP932) の CSV ファイルや、様々な文字コード（UTF-8, Shift_JIS, EUC-JP, UTF-16 等）のテキストファイルを開いた際にもエラーにならず、自動的に文字コードを判定して正常に読み込めるようにします。
また、ユーザーのご提案に基づき、現在開いているファイルの文字コード（エンコーディング）情報をステータスバー左側のファイル表示に付与（例: `sample.csv (Shift_JIS) - 保存済み`）し、一目で把握できるようにします。上書き保存時も元の文字コードを維持して安全に保存します。

---

## 2. 仕様と動作イメージ

### 2.1 文字コード自動判定・読み込み
- ファイル読み込み時にバイト列を解析し、以下の優先順で文字コードを自動判定・デコード：
  1. **BOM（Byte Order Mark）の判定**: UTF-8 BOM, UTF-16LE BOM, UTF-16BE BOM
  2. **UTF-8（BOMなし）**: 厳格な UTF-8 検証
  3. **Shift_JIS (CP932)**: Windows 日本語環境で一般的な Shift_JIS の検証・デコード
  4. **EUC-JP**: 日本語 UNIX/Linux 環境等の EUC-JP 検証・デコード
  5. **フォールバック**: 不正バイトを含む場合もエラーで落とさず、置換文字を交えて安全にデコード
- 読み込み成功時、テキスト内容とともに判定された文字コード名（`UTF-8`, `Shift_JIS`, `EUC-JP`, `UTF-16LE` 等）をフロントエンドへ返却。

### 2.2 保存時の文字コード維持
- 既存ファイルの上書き保存時（自動保存 / 手動保存）、そのファイルが元々持っていた文字コード（例: `Shift_JIS`）でエンコードしてディスクへ書き込みます。これにより他ソフトや Excel との互換性を壊しません。
- 新規自動生成ファイル（`yyyymmdd_hhmmss.nctx`）は常に `UTF-8` で作成・保存されます。

### 2.3 ステータスバー表示仕様

| 状態 / ファイル | 自動保存モードでの表示例 | 手動保存モードでの表示例 |
| :--- | :--- | :--- |
| **ファイル未作成（初期状態）** | `保存準備完了` | `[手動保存モード] ※Ctrl+Sで保存できます` |
| **Shift_JIS の CSV ファイル** | `sales_data.csv (Shift_JIS) - 保存済み` | `[手動保存:Ctrl+S] sales_data.csv (Shift_JIS) - 保存済み` |
| **UTF-8 の ソースコード** | `main.rs (UTF-8) - 編集中` | `[手動保存:Ctrl+S] main.rs (UTF-8) - 編集中` |
| **自動生成ファイル** (`20260827_011500.nctx`) | `20260827_011500.nctx (UTF-8) - 保存済み` | `[手動保存:Ctrl+S] 20260827_011500.nctx (UTF-8) - 保存済み` |

---

## 3. 実装方針と変更内容

### 3.1 Rust バックエンド (`Cargo.toml`, `src/commands.rs`)
- `Cargo.toml` に文字コード変換ライブラリ `encoding_rs = "0.8"` を追加。
- `src/commands.rs`:
  - `ReadFileResult` 構造体（`content: String`, `encoding: String`）を定義。
  - `read_text_file(file_path)` を改修し、BOM 判定 -> UTF-8 -> Shift_JIS -> EUC-JP -> フォールバックの順で判定・デコードして `ReadFileResult` を返却。
  - `save_text_file(file_path, content, encoding: Option<String>)` を改修し、指定された `encoding`（デフォルト UTF-8）でバイト列にエンコードして安全書き込み。

### 3.2 フロントエンド (`tabs.js`, `fileSystem.js`, `main.js`)
- `src/frontend/js/core/fileSystem.js`:
  - `openExistingFile` で `read_text_file` の戻り値から `content` と `encoding` を取得し、タブオブジェクトに `tab.encoding = res.encoding` を格納。
  - `saveTabIfDirty` / `saveTabAs` / `triggerManualSave` で `invoke('save_text_file', { filePath, content, encoding: tab.encoding })` を呼び出す。
- `src/frontend/js/ui/tabs.js`:
  - `updateTabStatus(tab)` において、ファイル作成済みの場合は `${prefix}${tab.fileName} (${tab.encoding || 'UTF-8'}) - ${targetState}` の形式でステータスバーを更新。
  - 新規タブ生成時（`createNewTab`）は `tab.encoding = 'UTF-8'` を初期セット。

### 3.3 製品仕様書の更新 (`docs/spec.md`)
- §4.4「文字コード & 改行コード」および §4.5「画面表示」に文字コード自動判定およびステータスバー文字コード表示の仕様を反映。

---

## 4. 変更対象ファイル一覧

| 操作 | ファイルパス | 主な変更内容 |
|---|---|---|
| 修正 | `Cargo.toml` | `encoding_rs` クレートの追加 |
| 修正 | `src/commands.rs` | `read_text_file` の文字コード自動判定デコードおよび `save_text_file` のエンコード保存 |
| 修正 | `src/frontend/js/core/fileSystem.js` | エンコーディングの受け渡しと保存時の連携 |
| 修正 | `src/frontend/js/ui/tabs.js` | ステータスバー表示への文字コード追加 |
| 修正 | `docs/spec.md` | 文字コード自動判定およびステータスバー仕様の更新 |
| 修正 | バージョン管理4ファイル (`Cargo.toml` 等) | バージョンを `0.2.15` に更新 |

---

## 5. 検証手順

1. **Shift_JIS CSV ファイルのドラッグ＆ドロップ検証**:
   - Shift_JIS で保存された CSV ファイルをウィンドウへドラッグ＆ドロップし、文字化けせず正常に開けることを確認。
   - ステータスバーに `xxx.csv (Shift_JIS) - 保存済み` と表示されることを確認。
2. **Shift_JIS ファイルの編集・保存検証**:
   - 開いた CSV を編集し、自動保存または `Ctrl + S` で保存後、ディスク上のファイルが Shift_JIS エンコーディングのまま正しく保存されていることを確認。
3. **UTF-8 ファイル（ソースコード、.nctx等）の検証**:
   - UTF-8 ファイルを開いた際、`xxx.rs (UTF-8) - 保存済み` と表示され正常に編集・保存できることを確認。
4. **`Ctrl + O` による Shift_JIS ファイル選択オープン検証**:
   - ダイアログから Shift_JIS ファイルを選択して開けることを確認。
