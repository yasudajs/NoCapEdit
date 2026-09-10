# 実装計画書: 右クリックメニュー「NoCapEdit で開く」追加とバイナリ/巨大ファイル安全ガード機能 (改定版)

エクスプローラー上で任意のファイルを右クリックした際、コンテキストメニューに「NoCapEdit で開く」を表示し、直接NoCapEditでファイルを開けるようにインストーラーを拡張します。
また、画像ファイルや `.exe` 等のバイナリファイルや、10MBを超える巨大ファイルが誤って開かれた際の破損・クラッシュを防止する安全ガード機能（バイナリ検出・サイズ上限チェック）を追加し、モーダルダイアログによる通知と未起動時の安全なグレーアウト表示を実装します。

---

## ユーザー合意事項のまとめ

| 項目 | 決定内容 |
|---|---|
| **右クリック表示テキスト** | `NoCapEdit で開く` |
| **アイコン表示** | NoCapEditのアプリケーションアイコンを表示する（`NoCapEdit.exe`） |
| **右クリック対象** | 任意の**ファイル**（`*`）のみを対象とする（フォルダや背景は対象外） |
| **インストール時UI** | デフォルトで有効（ON）としつつ、追加タスク選択画面でチェックを外せるようにする |
| **WiX (MSI版)** | 同様に「NoCapEdit で開く」レジストリ登録を含め同期する |
| **アンインストール時** | 登録したレジストリキーを自動的に完全削除する |
| **サイレントインストール時** | デフォルト動作として右クリックメニューを登録する |
| **ファイルサイズ上限** | **10MB**（10,485,760 bytes）を超えるファイルは安全のため開かずブロック |
| **バイナリファイルガード** | 先頭ブロックにNULLバイト（`0x00`）が含まれる場合はバイナリと判定し安全にブロック |
| **エラー通知モーダル** | バイナリや10MB超過ファイルを開いた際は画面中央にモーダル表示で明確に通知（OKボタン / Enter / Escで閉じる） |
| **未起動時の挙動** | モーダルを閉じた後、タブなし・エディタはグレーアウト（入力不可）とし、エディタ左上に「＋ を押して新規タブを開いてください」と表示 |
| **既存オープン時の挙動** | すでにファイルを開いている場合はモーダル表示後、既存のタブ・作業画面にそのまま復帰 |
| **ポータブル版** | 今回はインストーラー（NSIS / WiX）での右クリックメニュー設定のみ対象 |

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

#### B. 多言語リソース [`src/frontend/i18n.js`](file:///d:/antigravity/NoCapEdit/src/frontend/i18n.js)
- 以下のメッセージキーを追加（多言語対応）：
  - `fs.error.fileTooLarge`: "ファイルサイズが上限（10MB）を超えているため開けません"
  - `fs.error.binaryFileNotSupported`: "バイナリファイルのため開けません"
  - `editor.emptyNotice`: "＋ を押して新規タブを開いてください"
  - `ui.dialog.alert.title`: "お知らせ"
  - `ui.dialog.alert.ok`: "OK"

#### C. モーダルダイアログとUI要素 [`src/frontend/index.html`](file:///d:/antigravity/NoCapEdit/src/frontend/index.html) & [`src/frontend/css/style.css`](file:///d:/antigravity/NoCapEdit/src/frontend/css/style.css)
- `alertDialog`（メッセージ表示とOKボタンのみのシンプルなモーダル要素）を追加。
- エディタコンテナ内に `emptyEditorNotice`（案内テキスト要素）を追加。
- CSSで `#editor.no-tabs`（背景色、pointer-events: none、opacity等によるグレーアウト）および `.empty-editor-notice`（通常時の「入力準備完了」と全く同じ左上位置 16px、フォントサイズ連動）を定義。

#### D. ダイアログ制御 [`src/frontend/js/ui/dialogs.js`](file:///d:/antigravity/NoCapEdit/src/frontend/js/ui/dialogs.js)
- `showAlertDialog(message, title)` 関数を実装。Enter / Esc / OKボタン押下でPromiseを解決して閉じる。

#### E. タブ・エディタ制御 [`src/frontend/js/ui/tabs.js`](file:///d:/antigravity/NoCapEdit/src/frontend/js/ui/tabs.js) & [`src/frontend/js/core/fileSystem.js`](file:///d:/antigravity/NoCapEdit/src/frontend/js/core/fileSystem.js)
- `renderTabs` またはエディタ状態更新時に、`appState.tabs.length === 0` の場合はエディタを `.no-tabs`（グレーアウト）にし、案内メッセージを表示。
- タブが作成された（`appState.tabs.length > 0`）際は、即座にグレーアウトを解除し案内を非表示にしてエディタにフォーカス。
- `openExistingFile` でエラー発生時に `showAlertDialog(translatedMsg)` を表示してユーザーに明確に伝える。

---

### 2. NSIS / WiX インストーラー設定
- `nsis/installer.nsi`:
  - 追加オプション画面（カスタムページ）でのチェックボックスUI。
  - レジストリ登録（`Icon` 値の正常パス指定）およびアンインストール時の削除。
  - 動的パス解決（`!ifndef`）対応。
- `wix/file-association.wxs`:
  - 右クリックメニュー登録レジストリ（`Icon` 正常パス指定）同期。

---

### 3. 仕様書・履歴の更新
- `docs/spec.md`: モーダル通知および未起動時グレーアウト案内仕様の追記。
- `docs/history.md`: Ver 0.2.18 の変更履歴に本仕様を追記。

---

## 検証手順

1. **未起動時バイナリオープン検証**:
   - アプリ未起動の状態で画像ファイルを右クリック「NoCapEdit で開く」で開く。
   - 画面中央に「バイナリファイルのため開けません」モーダルが表示され、OK（またはEnter/Esc）で閉じることを確認。
   - モーダルが閉じた後、タブは0個で、エディタはグレーアウトし、左上に「＋ を押して新規タブを開いてください」と表示され文字入力できないことを確認。
   - 「＋」ボタンを押すと、即座に通常の白紙タブが開き、入力可能になることを確認。
2. **既存起動時バイナリオープン検証**:
   - すでにメモやファイルを開いている状態で画像ファイルを開く。
   - モーダルが表示され、OKで閉じると既存の作業画面がそのまま維持されることを確認。
3. **10MB超過ファイルのオープン検証**:
   - 10MBを超えるファイルを指定した際、「ファイルサイズが上限（10MB）を超えているため開けません」モーダルが表示されることを確認。
4. **通常のテキストファイルのオープン検証**:
   - 通常のテキストファイルを右クリックやCtrl+Oで開いた際、モーダルは出ず正常にタブが開くことを確認。
