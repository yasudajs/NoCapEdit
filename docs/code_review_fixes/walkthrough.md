# ウォークスルー: コードレビュー指摘事項の修正・改善 (v2.13.2)

## 1. 作業概要
`v2.11.0` 〜 `v2.13.1` のコードレビュー（[code_review_v2.11.0-v2.13.1.md](file:///d:/antigravity/NoCapEdit/docs/code_review_fixes/code_review_v2.11.0-v2.13.1.md)）にて指摘された全16項目のうち、修正対象として合意した計11項目を5つのステップに分けて実装・検証しました。

---

## 2. ステップ別の実装内容

### ステップ1: インデントガイドの位置ズレ修正・全角スペース対応・CSS余白整理（#1, #7, #13, #6）
- **行番号表示時のインデントガイド 16px ズレ解消（#1, #7）**:
  - [style.css](file:///d:/antigravity/NoCapEdit/src/frontend/style.css) の `.editor` に CSS 変数 `--cm-line-pad-left: 16px` を定義し、行番号表示時（`.editor.has-line-numbers, .editor:has(.cm-gutters)`）に `--cm-line-pad-left: 0px` へ切り替える構成に統一しました。
  - [codemirror.js](file:///d:/antigravity/NoCapEdit/src/frontend/js/ui/codemirror.js) の `IndentGuideWidget.toDOM()` における `left` 座標計算を `calc(var(--cm-line-pad-left, 16px) + ${col}ch)` に変更し、行番号 ON / OFF のどちらでもインデントガイドがテキストのインデント位置・ルーラー目盛りとピタリ一致するように修正しました。
  - あわせて、`style.css` と `baseTheme` に重複していた行番号余白ルールを `--cm-line-pad-left` 参照へ一元化しました。
- **全角スペースおよび半角・全角・タブ混在時のインデントガイド対応（#13）**:
  - [codemirror.js](file:///d:/antigravity/NoCapEdit/src/frontend/js/ui/codemirror.js) の `getLineIndentInfo` にて、全角スペース（`\u3000`）を2カラム幅（`col += 2`）としてカウントする処理を追加しました。全角スペースのみのインデントや、半角・全角・タブが混在している行（および前後の空行補間）でもインデントガイドが正確に描画されます。
- **未使用変数の削除（#6）**:
  - `initCodeMirror` 内の未使用変数 `hasLineNumbers` を削除しました。

### ステップ2: ファイル種類に応じた自動インデントの改善（#4）
- **テキストファイルとプログラミング言語に応じた自動インデント制御（#4）**:
  - [codemirror.js](file:///d:/antigravity/NoCapEdit/src/frontend/js/ui/codemirror.js) の `customInsertNewlineAndIndent` において、CodeMirror の `IndentContext` および `getIndentation` を組み合わせた制御を導入しました。
  - テキストファイル等（言語インデントを持たないファイル）では従来どおり前行の行頭空白（全角・半角・タブ混在含む）をそのまま引き継ぎます。
  - Java や Python 等のプログラミング言語では、前行の空白文字列をベースに維持しつつ、ブロック開始（`{` や `:` の直後など、`langIndent > baseCol` となる箇所）での改行時に言語ルールに応じた追加インデント（`indentString`）を自動付与するように改善しました。
  - なお、空白のみの行で改行した際は、合意仕様（#5）に基づきインデントを消去せず維持します。

### ステップ3: 「名前をつけて保存（Save As）」周りの安全性・排他制御強化（#2, #3, #8, #9, #10）
- **Save As キャンセル時の自動保存タイマー復帰（#2）**:
  - [fileSystem.js](file:///d:/antigravity/NoCapEdit/src/frontend/js/core/fileSystem.js) の `triggerManualSaveAs` にて、ダイアログがキャンセルされた場合（`saved === false`）、自動保存モードかつ `tab.isDirty` であれば自動保存タイマーを再スケジュールするよう修正しました。
- **保存中（`savePromise`）の完了待機と排他保護（#3）**:
  - `saveTabAs` の実行時に進行中の `tab.savePromise` があれば完了を待機し、ファイル書き込み処理自体も `tab.isSaving` / `tab.savePromise` で排他保護するよう強化しました。
- **別タブで開いているファイルへの上書き保存防止（#9）**:
  - `saveTabAs` で選択された保存先パスが、現在別のタブで既に開かれているファイルと同一である場合、アラートダイアログ（`fs.error.alreadyOpenInTab`: 「指定されたファイル（{fileName}）は既に別のタブで開かれているため、上書き保存できません。」）を表示して上書き保存を安全にブロックするようにしました。
- **`Ctrl + Shift + S` 長押し・連打時の二重実行防止（#10）**:
  - [shortcuts.js](file:///d:/antigravity/NoCapEdit/src/frontend/js/ui/shortcuts.js) での `if (e.repeat) return;` チェックおよび `fileSystem.js` の実行中ガードフラグ（`isSaveAsRunning`）を追加しました。
- **未使用の import / 翻訳キーの削除（#8）**:
  - `fileSystem.js` の未使用 `FILE_EXT_NCMD` インポートと、[i18n.js](file:///d:/antigravity/NoCapEdit/src/frontend/i18n.js) の未使用キー `fs.error.noSaveDialog` を削除しました。

### ステップ4: Rust バックエンド（保存ダイアログ処理）の整理（#11）
- **`windows-sys` クレートの利用と非同期ランタイム統一（#11）**:
  - [Cargo.toml](file:///d:/antigravity/NoCapEdit/Cargo.toml) の `windows-sys` に `"Win32_UI_WindowsAndMessaging"` フィーチャーを追加し、[src/commands.rs](file:///d:/antigravity/NoCapEdit/src/commands.rs) の `wake_up_mouse_cursor` 内の手書き FFI 宣言を公式クレート型・関数へ置き換えました。
  - `show_save_dialog` 内の `tokio::spawn` を `tauri::async_runtime::spawn` に統一し、100ms 遅延実行の理由コメントを補足しました。

### ステップ5: NSIS インストーラーの関連付け処理改善（#14）
- **上書きインストール時の旧 ProgID 削除と拡張子リスト共通化（#14）**:
  - [nsis/installer.nsi](file:///d:/antigravity/NoCapEdit/nsis/installer.nsi) の `RegisterFileType` マクロ内に `DeleteRegValue SHCTX "Software\Classes\${EXT}\OpenWithProgids" "NoCapEdit.Document"` を追加し、旧バージョンからの上書きアップデート時に「プログラムから開く」に重複項目が残らないようにしました。
  - インストール時とアンインストール時で重複していた全47拡張子のリストを共通マクロ `ProcessAllFileTypes` に統合し、保守性を向上させました。

---

## 3. 検証結果
1. **フロントエンドビルド (`npm run build`)**:
   - 全170モジュールのバンドルがエラー・警告なく正常に完了することを確認しました。
2. **自動インデント・言語ルール検証 (Node.js 検証スクリプト)**:
   - プレーンテキストでの全角スペース・混在インデント維持、Java（`{` 直後でのインデント増加・スペース/タブ両対応）、Python（`:` 直後でのインデント増加）、および空白行でのインデント維持（#5）のすべてがアサーションテストをパスすることを確認しました。
3. **Rust 単体テスト (`cargo test`)**:
   - 全8件のユニットテストがすべて `ok` でパスすることを確認しました。
