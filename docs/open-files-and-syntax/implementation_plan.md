# 複数ファイルオープン（Ctrl+O / D&D）およびシンタックスハイライト対応 実装計画書

## 1. 概要
NoCapEdit にて、従来の `.nctx` / `.txt` に限らず任意のテキストファイル（Markdown, JavaScript, Python, Rust, JSON, YAML, HTML, CSS, TOML 等）を開けるようにし、CodeMirror 6 の言語サポート機能を利用してファイル拡張子に応じたシンタックスハイライト（構文強調表示）を自動適用します。
また、`Ctrl + O` ショートカットによるファイル選択ダイアログ（複数選択対応）や、ウィンドウへのドラッグ＆ドロップによる複数ファイルの一括オープン機能を提供します。

---

## 2. ユーザー確認・合意事項
- **複数ファイルオープンの範囲**: 
  - `Ctrl + O` ダイアログでの複数ファイル選択オープン
  - エディタ領域・ウィンドウへのファイル（単一/複数）ドラッグ＆ドロップオープン
- **サポート対象言語・形式**:
  - すべての拡張子（All Files `*.*`）のプレーンテキストをオープン可能
  - CodeMirror 6 の言語定義（`@codemirror/language-data` 等）に含まれる主要言語（Markdown, JS/TS, Python, Rust, JSON, YAML, TOML, HTML, CSS, C/C++, Java, Go, SQL, Shell など）に対してシンタックスハイライトを自動適用
  - 対応言語定義のない拡張子やプレーンテキスト（`.txt`, `.nctx` 等）はハイライトなしのプレーンテキストモードとして安全に表示・編集
- **ファイルの保存挙動**:
  - 保存モード（自動保存 / 手動保存）は設定されたモードに従い、これまで通り動作
  - 外部から開いたファイル（`main.rs` など）も、自動保存モード時は入力停止やタブ切替時にそのまま安全に上書き保存される

---

## 3. 実装方針と変更内容

### 3.1 依存パッケージの追加 (`package.json`)
- `@codemirror/language-data` (または必要な `@codemirror/lang-*` 群) を追加。
- 拡張子・ファイル名から言語定義（LanguageDescription）を自動検索・オンデマンド解決できるようにする。

### 3.2 CodeMirror モジュールの拡張 (`src/frontend/js/ui/codemirror.js`)
- `languageCompartment`（動的設定変更用 Compartment）を新設。
- ファイル名・拡張子から対応する言語拡張（LanguageExtension）を取得・適用するヘルパー関数（`getLanguageExtensionForFile(fileName)`）を実装。
- `createTabState(content, options)` において、渡された `fileName` に基づいて言語拡張を `languageCompartment` に初期設定する。
- ファイル名や拡張子が変更された場合（別名保存など）に言語を切り替えられる `updateLanguage(fileName)` 関数を提供。

### 3.3 ファイルオープン機能の拡張 (`src/frontend/js/core/fileSystem.js`)
- **`openFileDialog()` 関数の新設**:
  - `openDialog({ multiple: true, filters: [...] })` を呼び出す。
  - テキストファイル・全ファイル（`*.*`）をフィルタとして指定。
  - 選択されたパス配列を順次 `openExistingFile` に渡して開く。
- **`openExistingFile(filePath)` の改善**:
  - 拡張子に応じた言語ハイライト付きで `createTabState` を生成。
  - 既に同じパスのファイルが開かれている場合は、新規作成せず該当タブへ切り替え。
  - 「未保存・未編集の初期空タブ（ファイル未作成で内容が空）」が存在する場合、最初のファイルオープン時にその空タブを置換して開く（不要な空タブが残らないよう配慮）。

### 3.4 ショートカットおよびドラッグ＆ドロップ連携
- **ショートカット追加 (`src/frontend/js/ui/shortcuts.js`)**:
  - `Ctrl + O` キー押下で `openFileDialog()` をトリガー。
- **ドラッグ＆ドロップイベント監視 (`src/frontend/js/main.js`)**:
  - Tauri の `tauri://file-drop` イベントをリッスンし、ドロップされたファイルパス一覧（配列）を順次 `openExistingFile` で開く。
- **ヘルプ画面・ドキュメント更新 (`help.html`, `i18n.js`, `docs/SHORTCUTS.md`)**:
  - `Ctrl + O`（ファイルを開く）の項目と多言語翻訳テキストを追記。

---

## 4. 変更対象ファイル一覧

| 操作 | ファイルパス | 主な変更内容 |
|---|---|---|
| 修正 | `package.json` | `@codemirror/language-data` 依存関係の追加 |
| 修正 | `src/frontend/js/ui/codemirror.js` | `languageCompartment` の追加、ファイル名連動のシンタックスハイライト適用 |
| 修正 | `src/frontend/js/core/fileSystem.js` | `openFileDialog` 実装、初期空タブ置換、複数オープン対応 |
| 修正 | `src/frontend/js/ui/shortcuts.js` | `Ctrl + O` ショートカットの登録 |
| 修正 | `src/frontend/js/main.js` | `tauri://file-drop` リスナーの登録 |
| 修正 | `src/frontend/i18n.js` | ファイルオープン・ダイアログ用の文言追加 |
| 修正 | `src/frontend/help.html` | ヘルプ画面のショートカット一覧に `Ctrl + O` を追加 |
| 修正 | `docs/SHORTCUTS.md` | ショートカットドキュメントに `Ctrl + O` を追加 |

---

## 5. 検証手順

1. **ファイル選択ダイアログ (`Ctrl + O`) の検証**:
   - `Ctrl + O` を押下してファイル選択ダイアログが開くことを確認。
   - 単一のファイル（例: `.js` や `.md`）を選択し、タブとして開かれることを確認。
   - 複数ファイル（例: `.rs`, `.json`, `.py`）を同時に選択し、すべてのファイルが個別のタブとして正しく開かれることを確認。
   - 起動直後の空タブがある状態で開いた場合、空タブが置き換えられて綺麗に開くことを確認。

2. **ドラッグ＆ドロップの検証**:
   - エクスプローラーからファイルをエディタウィンドウ上にドラッグ＆ドロップし、タブとして開かれることを確認。
   - 複数ファイルをまとめてドラッグ＆ドロップし、全ファイルが開かれることを確認。

3. **シンタックスハイライトの検証**:
   - `.md`, `.js`, `.json`, `.rs`, `.py`, `.html`, `.css` などの各種ファイルを開いた際、CodeMirror 上でキーワードや文字列・コメントに適切なハイライト色が付くことを確認。
   - `.txt` や `.nctx` ではプレーンテキストとして正常に表示・編集できることを確認。
   - ダークテーマ・ライトテーマの両方で可読性の高いハイライトになっていることを確認。

4. **編集・保存・タブ管理の検証**:
   - 開いた各種ファイルを編集し、自動保存（または手動保存 `Ctrl + S`）で正常にディスク上のファイルが更新されることを確認。
   - タブ切り替えやタブクローズが正常に動作することを確認。
   - ヘルプ画面（`F1`）に `Ctrl + O` が正しく表示されることを確認。
