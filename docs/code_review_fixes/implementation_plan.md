# 実装計画書: コードレビュー指摘事項の修正・改善 (v2.13.2)

## 1. 概要と目的
`v2.11.0` 〜 `v2.13.1` のコードレビュー（`docs/code_review_fixes/code_review_v2.11.0-v2.13.1.md`）で挙がった指摘事項のうち、合意した計11項目について修正・改善を行う。
変更箇所が多岐にわたるため、機能領域・対象ファイルごとに **5つの実装ステップ** に分割し、ステップごとに着実に実装・検証・コミットを進める。

- **バージョン更新区分**: PATCH アップデート（`v2.13.1` → `v2.13.2`）

---

## 2. 修正対象とステップ構成

| ステップ | 対象レビュー番号 | 概要 | 主な対象ファイル |
|---|---|---|---|
| **ステップ1** | **#1, #7, #13, #6** | インデントガイドの位置ズレ修正・全角スペース対応・CSS余白整理・未使用コード削除 | `src/frontend/js/ui/codemirror.js`<br>`src/frontend/style.css` |
| **ステップ2** | **#4** | ファイル種類に応じた自動インデント制御（テキストは前行空白維持、プログラム言語は構文インデント適用） | `src/frontend/js/ui/codemirror.js` |
| **ステップ3** | **#2, #3, #8, #9, #10** | 「名前をつけて保存（Save As）」の安全性・排他制御強化（タイマー復帰、保存待機、別タブ重複防止、連打防止、不要コード整理） | `src/frontend/js/core/fileSystem.js`<br>`src/frontend/js/ui/shortcuts.js`<br>`src/frontend/i18n.js` |
| **ステップ4** | **#11** | Rust バックエンドの `show_save_dialog` / `wake_up_mouse_cursor` 整理（`windows-sys` 利用、`tauri::async_runtime::spawn` 統一） | `Cargo.toml`<br>`src/commands.rs` |
| **ステップ5** | **#14** | NSIS インストーラーの上書きインストール時における旧 `NoCapEdit.Document` 削除および拡張子リストのマクロ共通化 | `nsis/installer.nsi` |

> [!NOTE]
> レビュー項目のうち **#5**（改行時の空行インデント維持）、**#12**（不可視文字の1文字単位DOM描画）、**#15**（`icons/documents/*.png` の保持）、**#16**（フロントエンドテスト見送り）は、事前合意に基づき現状維持（対応対象外）とする。

---

## 3. 各ステップの詳細設計

### ステップ1: インデントガイドの位置ズレ修正・全角スペース対応・CSS余白整理（#1, #7, #13, #6）

#### 1-1. 行番号表示時のインデントガイド 16px ズレ修正と余白ルール整理（#1, #7）
- **原因**:
  - v2.12.1 で行番号表示時（`.has-line-numbers` / `:has(.cm-gutters)`）の `.cm-line` 左パディングを `0px` に変更したが、`IndentGuideWidget` のガイド位置計算が `calc(16px + ${col}ch)` と `16px` 固定のままになっていたため、行番号 ON 時にインデントガイドが `16px` 右にズレていた。
- **修正内容**:
  - `src/frontend/style.css`:
    - `.editor` に CSS 変数 `--cm-line-pad-left: 16px;` を定義し、`.editor.has-line-numbers, .editor:has(.cm-gutters)` で `--cm-line-pad-left: 0px;` に切り替える。
    - `.editor .cm-line` のパディングを `padding: 0 16px 0 var(--cm-line-pad-left, 16px);` に一本化する。
  - `src/frontend/js/ui/codemirror.js`:
    - `baseTheme` 内の `.cm-line` パディングも `padding: "0 16px 0 var(--cm-line-pad-left, 16px)"` に統一し、`&.has-line-numbers ...` の重複定義を整理する。
    - `IndentGuideWidget.toDOM()` の位置指定を以下に変更する：
      ```javascript
      guide.style.left = `calc(var(--cm-line-pad-left, 16px) + ${col}ch)`;
      ```

#### 1-2. 全角スペースおよび半角・全角・タブ混在時のインデントガイド対応（#13）
- **修正内容**:
  - `src/frontend/js/ui/codemirror.js` の `getLineIndentInfo(lineText, tabSize, indentUnitWidth)` にて、全角スペース（`\u3000`）を半角2文字分（`col += 2`）としてカウントする分岐を追加する。
  - これにより、全角スペースのみのインデントや、半角スペース・全角スペース・タブが混在している行（および前後の空行補間 `resolveBlankLineIndent`）でも正確にカラム幅が計算され、インデントガイドが描画されるようになる。

#### 1-3. 未使用で例外リスクのあるコード削除（#6）
- **修正内容**:
  - `src/frontend/js/ui/codemirror.js` の `initCodeMirror` 内（L734）にある未使用変数 `const hasLineNumbers = ...` を削除する。

---

### ステップ2: ファイル種類に応じた自動インデントの改善（#4）

#### 2-1. テキストファイルとプログラミング言語に応じた自動インデント制御（#4）
- **方針**:
  - テキストファイル（`.nctx`, `.txt`, `.log`, `.csv`, `.md` 等、構文インデントを持たないファイル）では、現在どおり前行の行頭空白（全角・半角・タブ混在含む）をそのまま次行に反映する。
  - Java、JavaScript/TypeScript、Python、Rust、C/C++ 等のプログラミング言語では、その言語の構文に応じたインデントルール（`{` や `:` の直後での改行時に1段インデントを深める等）を適用する。
  - なお、**#5** の合意に基づき、空白のみの行で改行した際はどちらの場合もインデントを消さずに維持する。
- **修正内容**:
  - `src/frontend/js/ui/codemirror.js` で `@codemirror/language` から `getIndentation` をインポートする。
  - `customInsertNewlineAndIndent(view)` において：
    1. 括弧ペア（`{}` / `[]` / `()`）の間での改行（bracket explosion）、行頭（0列目）での改行、インデント文字途中での改行、および空白のみの行での改行は現行の挙動を維持する。
    2. テキストを含む行の途中・末尾で改行する場合：
       - CodeMirror の構文インデント取得関数 `getIndentation(state, from)` を評価する。
       - 言語の構文インデントが有効（`targetIndent !== null`）であり、かつ現在行の行頭インデント幅（`baseCol`）より深いインデント（`targetIndent > baseCol`）が要求される場合（例：Java の `class Hello {` の直後や Python の `def foo():` の直後など）：
         - 前行の `baseIndent` を維持したまま、増加分のインデント単位（`state.facet(indentUnit)`）を付加して次行へ挿入する。
       - それ以外（言語サポートがないテキストファイル、または同じインデント深さの通常行）では、前行の `baseIndent` をそのまま次行へ引き継ぐ。

---

### ステップ3: 「名前をつけて保存（Save As）」周りの安全性・排他制御強化（#2, #3, #8, #9, #10）

#### 3-1. Save As キャンセル時の自動保存タイマー再スケジュール（#2）
- `src/frontend/js/core/fileSystem.js` の `triggerManualSaveAs()` にて、`saveTabAs(tab)` が `false`（キャンセル等）を返した際、`appState.saveMode !== 'manual' && tab.isDirty` であれば `AUTOSAVE_DELAY_MS` 後に `autoSave()` が走るよう `appState.autosaveTimer` を再設定する。

#### 3-2. `saveTabAs` 実行時の保存中（`savePromise`）完了待機と排他制御（#3）
- `saveTabAs(tab)` の実行時、もし自動保存等の書き込み（`tab.isSaving && tab.savePromise`）が進行中であれば `await tab.savePromise;` で完了を待ってから処理を進める。また、`saveTabAs` によるファイル書き込み中も `tab.isSaving` / `tab.savePromise` で保護する。

#### 3-3. 別タブで開いているファイルと同じパスへの上書き保存防止（#9）
- `saveTabAs(tab)` で保存先パス `targetPath` が選択された後、ファイル書き込み前にパスを正規化（スラッシュ統一・小文字化）し、現在のタブ以外（`t.id !== tab.id`）で同じ `filePath` を持つタブが存在するか確認する。
- 存在する場合は `showAlertDialog` でエラーメッセージ（`fs.error.alreadyOpenInTab`: `"指定されたファイル（{fileName}）は既に別のタブで開かれているため、上書き保存できません。"`）を表示し、上書き保存を行わずに `false` を返す。

#### 3-4. `Ctrl + Shift + S` 長押し・連打時の二重実行防止（#10）
- `src/frontend/js/ui/shortcuts.js` の `Ctrl + Shift + S` 処理で `if (e.repeat) return;` を追加する。
- さらに `src/frontend/js/core/fileSystem.js` の `triggerManualSaveAs()` に実行中ガードフラグ（`isSaveAsRunning`）を設け、ダイアログ表示中の多重呼び出しを防止する。

#### 3-5. 未使用の import / 翻訳キーの整理（#8）
- `src/frontend/js/core/fileSystem.js` から未使用の `FILE_EXT_NCMD` インポートを削除する。
- `src/frontend/i18n.js` から未使用の `fs.error.noSaveDialog` を削除する。

---

### ステップ4: Rust バックエンド（保存ダイアログ処理）の整理（#11）

#### 4-1. `windows-sys` クレートの利用と非同期ランタイム統一（#11）
- `Cargo.toml`:
  - `windows-sys` の `features` に `"Win32_UI_WindowsAndMessaging"` を追加する。
- `src/commands.rs`:
  - `wake_up_mouse_cursor()` 内の手書き `extern "system"` および `struct POINT` 定義を削除し、`windows_sys::Win32::Foundation::POINT` と `windows_sys::Win32::UI::WindowsAndMessaging::{GetCursorPos, SetCursorPos}` を使用する。
  - `show_save_dialog` 内の `tokio::spawn` を `tauri::async_runtime::spawn` に統一し、100ms 遅延実行の理由コメントを補足する。

---

### ステップ5: NSIS インストーラーの関連付け処理改善（#14）

#### 5-1. 上書きインストール時の旧 ProgID 削除および拡張子リスト共通化（#14）
- `nsis/installer.nsi`:
  - `RegisterFileType` マクロ内に `DeleteRegValue SHCTX "Software\Classes\${EXT}\OpenWithProgids" "NoCapEdit.Document"` を追加し、旧バージョンからの上書きアップデート時にも古い `NoCapEdit.Document` エントリが残らないようにする。
  - インストール時の登録とアンインストール時の削除で重複していた全47拡張子のリストを共通マクロ（または一括呼び出しマクロ）に整理し、保守性を高める。

---

## 4. 検証計画
1. **ステップ1の検証**:
   - Java や Python ファイル等を開き、「行番号 ON」＋「インデントガイド ON」の状態でインデントガイドがガター境界線（`0ch`）および各インデント文字の左端（`4ch`, `8ch`...）にピタリと揃うこと、「行番号 OFF」でもズレないことを確認する。
   - 全角スペースのみ、および半角・全角・タブ混在のインデント行でインデントガイドが正しく表示されることを確認する。
2. **ステップ2の検証**:
   - テキストファイル（`.nctx`, `.txt`）では改行時に前行の空白（全角スペース含む）がそのまま維持されることを確認する。
   - Java ファイル等で `{` の直後で改行した際に1段深いインデントが自動挿入されること、空白のみの行で改行してもインデントが消えないことを確認する。
3. **ステップ3の検証**:
   - 自動保存モードで文字入力直後に `Ctrl + Shift + S` を押してキャンセルしても、数秒後に自動保存が正常に動作することを確認する。
   - 別タブで開いているファイルを Save As の保存先に指定した際、エラーダイアログが表示されて上書きが防止されることを確認する。
   - `Ctrl + Shift + S` を押しっぱなしにしてもダイアログが二重に開かないことを確認する。
4. **ステップ4・5および全体ビルド検証**:
   - `npm run build` および `cargo test`、`cargo check` が警告・エラーなく成功することを確認する。
