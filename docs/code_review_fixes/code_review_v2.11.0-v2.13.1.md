# コードレビュー: v2.11.0 〜 v2.13.1

対象範囲: `c1115cb`（v2.10.3）〜 `HEAD`（v2.13.1）

| Ver | 内容 |
|---|---|
| 2.11.0 | 不可視文字の表示（`invisibleCharactersPlugin`, `Alt+W`, 設定の永続化） |
| 2.11.1 | 長い行での不可視文字・インデントガイド描画の修正 |
| 2.12.0 | 名前をつけて保存（`Ctrl+Shift+S`, Rust `show_save_dialog`） |
| 2.12.1 | 行番号表示時に行左側の余白を削除し、ルーラーと揃える |
| 2.13.0 | 拡張子別のファイルアイコン（37種類）、NSIS でのファイル関連付け登録 |
| 2.13.1 | VS Code 準拠の自動インデント（`customInsertNewlineAndIndent`） |

> [!NOTE]
> 静的レビュー（差分を読んで確認）のみです。ビルドや実機での確認はしていません。重要度は 🔴 高 / 🟡 中 / 🟢 低 の3段階です。

---

## 🔴 重要度：高

### 1. 行番号表示時にインデントガイドが 16px 右にずれる（v2.12.1 で発生した回帰）
- [codemirror.js:L207](file:///d:/antigravity/NoCapEdit/src/frontend/js/ui/codemirror.js#L207) では、ガイドの位置を `calc(16px + ${col}ch)` と **16px 固定**で計算しています。
- 一方、v2.12.1 で行番号表示時の `.cm-line` は `padding: 0 16px 0 0` になり、左側の余白が 0 になりました（[codemirror.js:L447](file:///d:/antigravity/NoCapEdit/src/frontend/js/ui/codemirror.js#L447)、[style.css:L688](file:///d:/antigravity/NoCapEdit/src/frontend/style.css#L688)）。
- `.cm-indent-guides` は `.cm-line` の padding-box を基準に `left:0` で配置されます。そのため **行番号 ON とインデントガイド ON を同時に使うと、ガイドが本来の位置より 16px（約2文字）右に描画される**と考えられます。
- **修正案**: 余白の値を CSS 変数（例: `--cm-line-pad-left`）にまとめ、ガイド側を `calc(var(--cm-line-pad-left) + Nch)` に変更する。または、ガイドの位置を `getComputedStyle(line).paddingLeft` から計算する。

---

## 🟡 重要度：中

### 2. 「名前をつけて保存」をキャンセルすると自動保存タイマーが止まったままになる
- [fileSystem.js:L282-](file:///d:/antigravity/NoCapEdit/src/frontend/js/core/fileSystem.js#L282) の `triggerManualSaveAs` は、ダイアログを開く前に `autosaveTimer` を解除しています。
- キャンセルや失敗で `saved === false` になった場合もタイマーを再設定しないため、**未保存の編集が次にキー入力するまで自動保存されません**（自動保存モードの場合）。
- **修正案**: 保存されなかった時点で `tab.isDirty` が true なら、`autoSave` を再スケジュールする。

### 3. `saveTabAs` が保存中かどうか（`isSaving` / `savePromise`）を確認していない
- 自動保存の書き込み中に Save As を実行すると、古いパスへの書き込み完了処理と、新しいパスへの切り替えが競合する可能性があります。
- **修正案**: `saveTabIfDirty` と同じように、`tab.savePromise` の完了を待ってから実行する。

### 4. 自動インデントが言語に応じたインデントをしなくなった（v2.13.1）
- [codemirror.js:L83-](file:///d:/antigravity/NoCapEdit/src/frontend/js/ui/codemirror.js#L83) は前の行の空白をそのままコピーし、インデントを増やすのは `{}`・`[]`・`()` の間で改行したときだけです。
- これまで CodeMirror の `insertNewlineAndIndent` が行っていた言語別の処理（`{` で終わる行の次行でインデントを増やす、Python の `:` の後など）がなくなっています。
- 全角スペース問題を解決するために意図した割り切りであれば問題ありません。ただし VS Code はこうした場合にもインデントを増やすため、「VS Code準拠」という説明とは少し違いがあります。
- **案**: まず `getIndentation(state, pos)`（言語の情報を使う）を試し、結果が `null` だった場合や前の行に全角スペースが含まれる場合だけ、今回の空白コピー処理を使う、という組み合わせにする。

### 5. 改行すると空白だけの行が残る（v2.13.1）
- インデントされた行の末尾で Enter を2回押すと、間に「インデント空白だけの行」が残ります。
- 元の CodeMirror の処理や、VS Code の `trimAutoWhitespace` は、自動で入れた空白を削除します。不可視文字表示を ON にすると目立つ点です。
- **修正案**: 現在の行が空白だけの場合は、その行の空白を削除してから改行を挿入する。

---

## 🟢 重要度：低（改善提案）

### 6. 未使用で、実行されると例外になるコード
- [codemirror.js:L734](file:///d:/antigravity/NoCapEdit/src/frontend/js/ui/codemirror.js#L734) の `hasLineNumbers` はどこからも使われていません。
- さらに `state.facet(EditorView.lineWrapping)` は Facet ではない値を渡しているため、この部分が評価されると例外になります。削除を推奨します。

### 7. 行番号表示時の余白ルールが二重に定義されている
- `baseTheme` の `&.has-line-numbers …, &:has(.cm-gutters) …` と、`style.css` の `.editor.has-line-numbers …, .editor:has(.cm-gutters) …` が同じ内容です。
- `:has()` を使えばクラスの付け外しも不要になります。1か所にまとめると、#1 の修正もしやすくなります。

### 8. 保存ダイアログのフィルタから `.ncmd` がなくなった
- v2.12.0 で「NoCapEdit Markdown (*.ncmd)」が削除されました（`FILE_EXT_NCMD` の import も使われなくなっています）。意図した変更か確認をお願いします。
- `i18n.js` の `fs.error.noSaveDialog`（L101）も使われていない可能性があります。

### 9. Save As 後の元ファイルの扱い（仕様確認）
- 自動作成されたタイムスタンプ名のファイルを Save As すると、元のファイルはホームフォルダに残ります。
- 「コピーとして保存」と「移動」のどちらを想定しているか、仕様として決めておくと良さそうです。
- 保存先が別のタブで開いているファイルと同じ場合のチェックもありません。

### 10. `Ctrl+Shift+S` を連打・長押しした時の二重実行防止
- [shortcuts.js:L144-150](file:///d:/antigravity/NoCapEdit/src/frontend/js/ui/shortcuts.js#L144-L150) には、実行中フラグや `e.repeat` の確認がありません。ダイアログが表示されるまでの間に、2回目の invoke が走る可能性があります。

### 11. Rust の `show_save_dialog` / `wake_up_mouse_cursor`
- [commands.rs:L292-](file:///d:/antigravity/NoCapEdit/src/commands.rs#L292) で Win32 API の宣言を手書きしています。既に依存関係にある `windows-sys` に `Win32_UI_WindowsAndMessaging` を追加して使う方が安全です。
- [commands.rs:L351](file:///d:/antigravity/NoCapEdit/src/commands.rs#L351) の「100ms 待ってから再実行」は、タイミング次第で効かない可能性がある対処です（効果は実機で確認済みとのことなので、コメントで根拠を補足する程度で十分です）。
- `tokio::spawn` は、他の箇所に合わせて `tauri::async_runtime::spawn` に統一することを推奨します。

### 12. 不可視文字プラグインの DOM 負荷
- [codemirror.js:L374-](file:///d:/antigravity/NoCapEdit/src/frontend/js/ui/codemirror.js#L374) は空白1文字ごとに 1 span を作ります。空白で桁揃えした表などでは DOM ノードが多くなります。
- 連続する半角スペースを1つの mark にまとめ、`background-size: 1ch` で繰り返し描画すると負荷を減らせます。
- NBSP（`\u00A0`）などは表示対象外です（必要になった時点で検討で良いと思います）。

### 13. インデントガイドが全角スペースのインデントを数えない
- v2.13.1 で全角スペースのインデントを維持するようにしましたが、`getLineIndentInfo`（[L225](file:///d:/antigravity/NoCapEdit/src/frontend/js/ui/codemirror.js#L225)）は全角スペースを無視しています。仕様をそろえるか検討してください。

### 14. NSIS インストーラー
- **アップグレード時の残骸**: 旧バージョンでは各拡張子の `OpenWithProgids` に `NoCapEdit.Document` を登録していました。新しいインストーラーはこの値をアンインストール時にしか削除しません。上書きインストールすると「プログラムから開く」に NoCapEdit が2つ表示される可能性があります。インストール処理にも `DeleteRegValue … "NoCapEdit.Document"` を追加することを推奨します。
- **相対パス**: `File "..\..\..\..\icons\documents\*.ico"`（[L668](file:///d:/antigravity/NoCapEdit/nsis/installer.nsi#L668)）は Tauri のビルド出力先の階層構成に依存しています。
- **拡張子リストの重複**: 登録用（L728-790）と削除用（L935-981）で 47 拡張子のリストが2つあり、追加や削除のたびに両方の修正が必要です。リストを1か所にまとめる（共通マクロ化する）と保守しやすくなります。

### 15. リポジトリ容量
- `icons/documents/*.png`（約130KB × 37枚 ≒ 5MB）はビルドで使われていません。生成スクリプトで再生成できるので、コミット対象から外すことを検討してください。

### 16. テスト
- Rust 側にはテストが追加されています（`test_invisible_characters_default_and_deserialize`）。
- `customInsertNewlineAndIndent` は `EditorState` だけでテストできる純粋なロジックなので、全角スペース・カーソル位置・括弧展開・複数カーソルのユニットテストを追加すると回帰を防げます。

---

## 良い点
- 設定項目の追加（Rust の `serde(default)`、フロントエンドのデフォルト値処理、タブごとの状態保持）が既存の機能と同じパターンで実装されており、一貫しています。
- v2.11.1 の `line.from >= from` / `line.to <= to` のチェックで、表示範囲の境界にある行の重複描画を正しく防いでいます。
- Save As のフィルタ名を i18n に移すなど、多言語化のルールが守られています。
- NSIS をマクロにしたことで、従来の大量のレジストリ書き込み行が大幅に整理されました。
