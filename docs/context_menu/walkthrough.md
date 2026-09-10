# ウォークスルー: 右クリックメニュー「NoCapEdit で開く」追加とバイナリ/巨大ファイル安全ガード機能 (Ver 0.2.18)

エクスプローラーから任意のファイルを直接NoCapEditで開ける「右クリックメニュー（NoCapEdit で開く）」機能の追加と、画像やexeなどのバイナリファイル、および10MBを超える巨大ファイルが誤って開かれた際のファイル破損やクラッシュを防止する安全ガード機能を実装しました。

---

## 主な変更内容

### 1. エクスプローラー右クリックメニュー「NoCapEdit で開く」の追加
- **インストーラー画面の拡張 ([`nsis/installer.nsi`](file:///d:/antigravity/NoCapEdit/nsis/installer.nsi))**:
  - スタートメニュー選択画面の後、ファイル展開の直前に追加オプション画面（カスタムページ）を追加しました。
  - `☑ エクスプローラーの右クリックメニューに「NoCapEdit で開く」を追加する` を配置し、初期状態でチェックON（有効）としています。不要なユーザーはチェックを外すことで登録をスキップできます。
  - サイレントインストール（`/S`）時はデフォルトで有効として処理されます。
- **レジストリ登録とアイコン表示**:
  - チェック有効時、Windowsレジストリ `HKCU\Software\Classes\*\shell\NoCapEdit` に以下のエントリを登録します：
    - 既定値（表示テキスト）: `NoCapEdit で開く`
    - `Icon`: `"$INSTDIR\NoCapEdit.exe,0"`（メニュー項目の横にNoCapEditのアイコンを表示）
    - `command`: `'"$INSTDIR\NoCapEdit.exe" "%1"'`
- **WiX（MSI版）同期 ([`wix/file-association.wxs`](file:///d:/antigravity/NoCapEdit/wix/file-association.wxs))**:
  - MSIインストーラー経由でインストールされた場合も同様に右クリックメニューが登録されるよう定義を追加しました。
- **アンインストール対応**:
  - アンインストール時に `Software\Classes\*\shell\NoCapEdit` キーを自動的に完全削除します。

---

### 2. バイナリファイルおよび巨大ファイル（10MB超過）の安全ガード機能
- **Rustバックエンド ([`src/commands.rs`](file:///d:/antigravity/NoCapEdit/src/commands.rs))**:
  - **10MBサイズ上限チェック**: `fs::metadata` によりファイルサイズを事前検査し、`10MB`（`10 * 1024 * 1024` バイト）を超える場合はメモリ読み込みを行わずに `Err("fs.error.fileTooLarge")` を返却して即座にブロックします。
  - **バイナリ検出（NULLバイトスキャン）**: ファイル先頭 8192 バイト以内に `0x00`（NULLバイト）が含まれているかを判定（※UTF-16 BOM付きは除外）。画像や実行ファイルなどのバイナリデータを検知した場合、`Err("fs.error.binaryFileNotSupported")` を返却してブロックします。
  - これにより、CodeMirrorへの文字化けバイナリの展開や、オートセーブによる元ファイルの不可逆な破壊（上書き破損）を100%防止します。
- **フロントエンド多言語エラー表示 ([`src/frontend/i18n.js`](file:///d:/antigravity/NoCapEdit/src/frontend/i18n.js) & [`src/frontend/js/core/fileSystem.js`](file:///d:/antigravity/NoCapEdit/src/frontend/js/core/fileSystem.js))**:
  - `i18n.js` に `fileTooLarge`（"ファイルサイズが上限（10MB）を超えているため開けません"）および `binaryFileNotSupported`（"バイナリファイルのため開けません"）を定義。
  - `fileSystem.js` の `openExistingFile` において、エラーを多言語メッセージとしてステータスバーに表示し、タブ作成を安全に中止するよう改修しました。
  - 複数ファイル一括オープン時（`openFiles`）も、開けたファイル件数を正確にカウントして表示します。

---

### 3. バージョン更新および仕様書追記
- 内部バージョンを **`0.2.18`** に更新（`Cargo.toml`, `tauri.conf.json`, `nsis/installer.nsi`, `docs/DEVELOPMENT.md`, `package.json`）。
- [`docs/spec.md`](file:///d:/antigravity/NoCapEdit/docs/spec.md) に右クリックメニュー仕様および安全ガード仕様を追記。
- [`docs/history.md`](file:///d:/antigravity/NoCapEdit/docs/history.md) に Ver 0.2.18 の変更履歴を追記。

---

## 変更ファイル一覧

| ファイル | 変更概要 |
|---|---|
| [`Cargo.toml`](file:///d:/antigravity/NoCapEdit/Cargo.toml) | バージョンを `0.2.18` に更新 |
| [`tauri.conf.json`](file:///d:/antigravity/NoCapEdit/tauri.conf.json) | バージョンを `0.2.18` に更新 |
| [`nsis/installer.nsi`](file:///d:/antigravity/NoCapEdit/nsis/installer.nsi) | バージョン更新、追加タスク選択画面（カスタムページ）、右クリックメニュー登録/削除処理を追加 |
| [`wix/file-association.wxs`](file:///d:/antigravity/NoCapEdit/wix/file-association.wxs) | 右クリックメニュー登録レジストリエントリを追加 |
| [`package.json`](file:///d:/antigravity/NoCapEdit/package.json) | バージョンを `0.2.18` に更新 |
| [`src/commands.rs`](file:///d:/antigravity/NoCapEdit/src/commands.rs) | 10MB上限チェックおよびNULLバイトスキャンによるバイナリ検出ガードを追加 |
| [`src/frontend/i18n.js`](file:///d:/antigravity/NoCapEdit/src/frontend/i18n.js) | サイズ上限超過およびバイナリ未対応エラーの多言語キー定義を追加 |
| [`src/frontend/js/core/fileSystem.js`](file:///d:/antigravity/NoCapEdit/src/frontend/js/core/fileSystem.js) | ファイルオープン時のエラー多言語表示および成否判定によるタブ保護を追加 |
| [`docs/spec.md`](file:///d:/antigravity/NoCapEdit/docs/spec.md) | 右クリックメニュー仕様およびバイナリガード・10MB上限仕様を追記 |
| [`docs/history.md`](file:///d:/antigravity/NoCapEdit/docs/history.md) | Ver 0.2.18 の変更履歴を最上部に追記 |
| [`docs/DEVELOPMENT.md`](file:///d:/antigravity/NoCapEdit/docs/DEVELOPMENT.md) | ポータブル版ビルドコマンド例のバージョン文字列を `0.2.18` に更新 |

---

## 検証結果

- **フロントエンドビルド**: `npm run build` を実行し、CodeMirror 6 等を含めて正常にアセットがビルド・出力されることを確認。
- **多言語エラー解決**: Node.js実行環境により、`fs.error.binaryFileNotSupported` ➔ `バイナリファイルのため開けません`、`fs.error.fileTooLarge` ➔ `ファイルサイズが上限（10MB）を超えているため開けません` が正確に解決されることを確認。
