# ステータスバーからのファイル名表示削除とフォントサイズ表示追加

ウィンドウ右下のステータスバーにおいて、ファイル名が表示されていますが、タブでもファイル名が表示されており重複しているため、ステータスバー右下の表示からファイル名を外す修正を行います。
また、右下の表示（カーソル位置、文字数）に現在のフォントサイズ（xx pt、スペースあり）の表示を追加します。
本修正に伴い、アプリのバージョンを `0.1.8` に更新します。

## Proposed Changes

### Frontend (UI)

#### [MODIFY] [index.html](file:///c:/work/NoCapEdit/src/dist/index.html)
- ステータスバー右下のファイル名表示用要素 `<span class="status-file" id="statusFile">-</span>` を削除します。
- タイトルのバージョン表記を `NoCapEdit [ Ver 0.1.8 ]` に更新します。

#### [MODIFY] [style.css](file:///c:/work/NoCapEdit/src/dist/style.css)
- 不要となった `.status-file` スタイルの定義を削除します。

#### [MODIFY] [main.js](file:///c:/work/NoCapEdit/src/dist/main.js)
- `elements` キャッシュから `statusFile` を削除します。
- 不要となった `updateStatusFileLabel` 関数を削除します。
- `updateStatusFileLabel()` の呼び出し箇所（ファイル保存、タブ切り替え、タブ削除、文字編集の計4箇所）を削除します。
- `updateEditorMetrics()` 内のメトリクス文字列に、現在のフォントサイズである `| ${appState.fontSize} pt` を追加します。これにより `Ln X, Col Y | Z chars | xx pt` 形式で表示されます。
- `applyFontSize()` の末尾で `updateEditorMetrics()` を呼び出し、フォントサイズ変更時にステータスバーが即座に更新されるようにします。

### Metadata

#### [MODIFY] [Cargo.toml](file:///c:/work/NoCapEdit/Cargo.toml)
- `version` を `"0.1.8"` に更新します。

#### [MODIFY] [tauri.conf.json](file:///c:/work/NoCapEdit/tauri.conf.json)
- `package.version` を `"0.1.8"` に更新します。

## Verification Plan

### Manual Verification
- アプリを開発モードで起動し、ステータスバー右下にファイル名が表示されなくなっていることを確認します。
- ステータスバー右下のメトリクス表示が `Ln X, Col Y | Z chars | xx pt`（例: `Ln 1, Col 1 | 0 chars | 13 pt`）になっていることを確認します。
- フォントサイズの変更（`Ctrl` + ホイール、または `Ctrl` + `+` / `-`）操作を行い、エディタの文字の大きさが変わると同時に、ステータスバー右下の `xx pt` 部分の数値も即座に追従して更新されることを確認します。
- タブの切り替え、ファイルの新規作成・編集・保存・削除を行った際、エラーが発生せず、文字数などのメトリクスが正常に更新されることを確認します。
- ウィンドウのタイトルバーに `NoCapEdit [ Ver 0.1.8 ]` と表示されることを確認します。
