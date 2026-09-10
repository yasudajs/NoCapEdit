# 実装計画書: 右クリックメニュー「NoCapEdit で開く」追加とバイナリ/巨大ファイル安全ガード機能

エクスプローラー上で任意のファイルを右クリックした際、コンテキストメニューに「NoCapEdit で開く」を表示し、直接NoCapEditでファイルを開けるようにインストーラーを拡張します。
また、画像ファイルや `.exe` 等のバイナリファイルや、10MBを超える巨大ファイルが誤って開かれた際の破損・クラッシュを防止する安全ガード機能（バイナリ検出・サイズ上限チェック）を追加します。

---

## ユーザー合意事項のまとめ

| 項目 | 決定内容 |
|---|---|
| **右クリック表示テキスト** | `NoCapEdit で開く` |
| **アイコン表示** | NoCapEditのアプリケーションアイコンを表示する（`NoCapEdit.exe,0`） |
| **右クリック対象** | 任意の**ファイル**（`*`）のみを対象とする（フォルダや背景は対象外） |
| **インストール時UI** | デフォルトで有効（ON）としつつ、追加タスク選択画面でチェックを外せるようにする |
| **WiX (MSI版)** | 同様に「NoCapEdit で開く」レジストリ登録を含め同期する |
| **アンインストール時** | 登録したレジストリキーを自動的に完全削除する |
| **サイレントインストール時** | デフォルト動作として右クリックメニューを登録する |
| **ファイルサイズ上限** | **10MB**（10,485,760 bytes）を超えるファイルは安全のため開かずブロック |
| **バイナリファイルガード** | 先頭ブロックにNULLバイト（`0x00`）が含まれる場合はバイナリと判定し安全にブロック |
| **ブロック時の挙動** | タブを開かず、ステータスバー等で理由（多言語対応）を通知して元ファイルの安全を保護 |
| **ポータブル版** | 今回はインストーラー（NSIS / WiX）での右クリックメニュー設定のみ対象（ポータブル版での登録UIは次回以降検討） |

---

## 変更対象ファイルと詳細計画

### 1. バイナリ・巨大ファイル安全ガード機能（Rustバックエンド & フロントエンド）

#### A. バックエンド [`src/commands.rs`](file:///d:/antigravity/NoCapEdit/src/commands.rs)
- **ファイルサイズ上限チェック**:
  - `read_text_file` の先頭で `fs::metadata(&file_path)` によりファイルサイズを取得。
  - `10 * 1024 * 1024`（10MB）を超える場合は `Err("fs.error.fileTooLarge".to_string())` を返却。
- **バイナリファイル検出**:
  - ファイルを読み込んだ後、UTF-16 BOM が存在しない場合、先頭 8192 バイト以内に `0x00`（NULLバイト）が含まれているかを検査。
  - NULLバイトが検出された場合はバイナリファイルと判定し、`Err("fs.error.binaryFileNotSupported".to_string())` を返却。
- これにより、`String::from_utf8_lossy` による文字化けテキストの生成や、オートセーブによる元ファイルの不可逆な破壊を完全に防止。

#### B. 多言語リソース [`src/frontend/i18n.js`](file:///d:/antigravity/NoCapEdit/src/frontend/i18n.js)
- 以下のエラーメッセージキーを追加（日本語および英語）：
  - `fs.error.fileTooLarge`:
    - ja: "ファイルサイズが上限（10MB）を超えているため開けません"
    - en: "File size exceeds the limit (10MB) and cannot be opened."
  - `fs.error.binaryFileNotSupported`:
    - ja: "バイナリファイルのため開けません"
    - en: "Binary files cannot be opened."

#### C. ファイルオープン処理 [`src/frontend/js/core/fileSystem.js`](file:///d:/antigravity/NoCapEdit/src/frontend/js/core/fileSystem.js)
- `openExistingFile` において、`read_text_file` のエラーメッセージ（`error` または `error.message`）を `t(error)` で多言語解決し、ステータスバーに明確にエラー通知（例: `バイナリファイルのため開けません`、`ファイルサイズが上限（10MB）を超えているため開けません`）。
- エラー発生時は新規タブの作成や既存タブの置換を行わず、直前の状態を安全に維持。

---

### 2. NSISインストーラー設定 [`nsis/installer.nsi`](file:///d:/antigravity/NoCapEdit/nsis/installer.nsi)
1. **多言語文字列（LangString）の追加**:
   - `additionalTasksTitle`: "追加タスクの選択"
   - `additionalTasksSubtitle`: "実行する追加タスクを選択してください。"
   - `additionalTasksLabel`: "${PRODUCTNAME} のインストール時に実行する追加タスクを選択してください:"
   - `registerContextMenu`: "エクスプローラーの右クリックメニューに「NoCapEdit で開く」を追加する"
   - `openWithNoCapEdit`: "NoCapEdit で開く"
2. **追加タスク選択画面（カスタムページ）の追加**:
   - スタートメニュー選択画面の後、ファイルインストール（`MUI_PAGE_INSTFILES`）の直前に追加。
   - デフォルトでチェックON、ユーザーがチェックを外すことも可能。
   - サイレントインストール時やパッシブモード時は自動スキップ（デフォルトONで処理）。
3. **レジストリ登録処理 (`Section Install`)**:
   - チェックがONの場合にのみ以下を登録：
     - `HKCU\Software\Classes\*\shell\NoCapEdit` -> `NoCapEdit で開く`
     - `HKCU\Software\Classes\*\shell\NoCapEdit` (値名: `Icon`) -> `"$INSTDIR\${MAINBINARYNAME}.exe,0"`
     - `HKCU\Software\Classes\*\shell\NoCapEdit\command` -> `'"$INSTDIR\${MAINBINARYNAME}.exe" "%1"'`
4. **アンインストール処理 (`Section Uninstall`)**:
   - `DeleteRegKey SHCTX "Software\Classes\*\shell\NoCapEdit"` を追加してレジストリを安全に完全削除。

---

### 3. WiX（MSI版）設定 [`wix/file-association.wxs`](file:///d:/antigravity/NoCapEdit/wix/file-association.wxs)
- `FileAssociationComponent` 内に、以下の右クリックメニュー用レジストリエントリを追加して同期：
  - `HKCU\Software\Classes\*\shell\NoCapEdit` (既定値: `NoCapEdit で開く`)
  - `HKCU\Software\Classes\*\shell\NoCapEdit` (名前: `Icon`, 値: `[INSTALLDIR]NoCapEdit.exe,0`)
  - `HKCU\Software\Classes\*\shell\NoCapEdit\command` (既定値: `&quot;[INSTALLDIR]NoCapEdit.exe&quot; &quot;%1&quot;`)

---

### 4. 仕様書の更新 [`docs/spec.md`](file:///d:/antigravity/NoCapEdit/docs/spec.md)
- 「4.4 ファイル保存・オープン」セクション等に以下を追記：
  - エクスプローラー右クリックメニュー「NoCapEdit で開く」の登録仕様
  - ファイルオープン時のバイナリファイル検出仕様（NULLバイトスキャン）
  - ファイルオープン時のサイズ上限仕様（10MB制限）

---

### 5. バージョン管理ファイルの更新（実装開始後）
- 次期内部バージョン: `0.2.18`
- 更新対象4ファイル:
  - `Cargo.toml`
  - `tauri.conf.json`
  - `nsis/installer.nsi`
  - `docs/DEVELOPMENT.md`

---

## 検証手順

1. **バイナリガード・サイズ上限の動作検証**:
   - 既存の画像ファイル（`.png`, `.jpg`）や `.exe` をD&Dまたは `Ctrl + O` で開こうとした際、開かれずに「バイナリファイルのため開けません」とステータス表示されることを確認。
   - 10MBを超える巨大ファイルを指定した際、「ファイルサイズが上限（10MB）を超えているため開けません」とステータス表示され、ブロックされることを確認。
   - 通常のテキストファイル（`.txt`, `.rs`, `.js`, `.nctx`, Shift_JISファイル等）は正常に開けることを確認。
2. **インストーラーのビルド検証**:
   - `cargo tauri build` を実行し、NSISインストーラー（`setup.exe`）およびWiX（`.msi`）が正常に生成されることを確認。
3. **インストーラーUI検証**:
   - 生成されたインストーラーを起動し、追加オプション画面が表示され、「エクスプローラーの右クリックメニューに「NoCapEdit で開く」を追加する」チェックボックスが初期状態でチェックされていることを確認。
4. **レジストリ・右クリックメニューの動作確認**:
   - インストール完了後、任意（`.txt`, `.rs`, `.json` 等）のファイルを右クリックした際、メニューに「NoCapEdit で開く」がアイコン付きで表示されることを確認。
   - メニューをクリックした際、NoCapEditが起動して対象ファイルが開くことを確認。
   - すでにNoCapEditが起動している状態で別のファイルを右クリックから開いた際、多重起動せずに既存ウィンドウの新規タブとして開くことを確認。
   - 右クリックメニューから画像やexeを開こうとした場合も、安全ガードによってブロックされることを確認。
5. **チェックを外した場合の検証**:
   - チェックを外してインストールした場合、右クリックメニューに登録されないことを確認。
6. **アンインストール検証**:
   - アンインストールを実行後、右クリックメニューから「NoCapEdit で開く」が綺麗に削除されていることを確認。
