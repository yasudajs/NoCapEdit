# 変更内容確認 (Walkthrough) - ステータスバーからのファイル名表示削除とフォントサイズ表示追加

ステータスバー右下のファイル名表示を削除し、新たに現在のフォントサイズを `xx pt` の形式で追加する修正を実施しました。
また、ウィンドウタイトルバーのバージョン表記が `0.1.7` のままハードコードされていたため、こちらも `0.1.8` に更新しました。

## 修正内容

### Frontend (UI)
- **[index.html](file:///c:/work/NoCapEdit/src/dist/index.html)**
  - ステータスバー右下の `<span class="status-file">` 要素を削除しました。
  - アプリのタイトル表記を `NoCapEdit [ Ver 0.1.8 ]` に更新しました。
- **[style.css](file:///c:/work/NoCapEdit/src/dist/style.css)**
  - 不要になった `.status-file` のスタイル定義を削除しました。
- **[main.js](file:///c:/work/NoCapEdit/src/dist/main.js)**
  - `elements.statusFile` のキャッシュ取得、`updateStatusFileLabel()` 関数の定義およびその呼び出しを全て削除しました。
  - `updateEditorMetrics()` において、ステータスメトリクスの表記を `Ln X, Col Y | Z chars | xx pt` に変更し、現在のフォントサイズである `appState.fontSize` を表示するようにしました。
  - `applyFontSize()` の実行時に `updateEditorMetrics()` を呼び出すことで、フォントサイズ変更時にステータスバーの表示も即座に更新されるようにしました。

### Backend (Rust)
- **[main.rs](file:///c:/work/NoCapEdit/src/main.rs)**
  - ウィンドウ作成時（WindowBuilder）にタイトルバーに設定されるバージョン番号を `NoCapEdit [ Ver 0.1.8 ]` に更新しました。

### Metadata
- **[Cargo.toml](file:///c:/work/NoCapEdit/Cargo.toml)**
  - バージョンを `0.1.8` に更新しました。
- **[tauri.conf.json](file:///c:/work/NoCapEdit/tauri.conf.json)**
  - パッケージバージョンを `0.1.8` に更新しました。

## 動作確認方法
1. `npm run dev` または `cargo tauri dev` でアプリを起動します。
2. ウィンドウタイトルバーに `NoCapEdit [ Ver 0.1.8 ]` と表示されていることを確認します。
3. 右下のステータスバーの表示からファイル名が消え、代わりに `Ln 1, Col 1 | 0 chars | 13 pt` のようにフォントサイズが表示されていることを確認します。
4. `Ctrl` + ホイール、または `Ctrl` + `+` / `-` を使用してフォントサイズを変更し、ステータスバーの `xx pt` 表示が連動して変わることを確認します。
