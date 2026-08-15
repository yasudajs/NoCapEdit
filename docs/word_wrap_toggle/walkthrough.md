# ウォークスルー: 行の折り返し切り替え（Word Wrap）機能

## 概要
長い文章やソースコード、ログファイル等の閲覧・編集性を向上させるため、**「行の折り返し（Word Wrap）」** 機能を実装しました。
ショートカット（`Alt + Z`）によるタブ単位の一時切り替えと、設定ドックによるアプリ全体のデフォルト永続化の2段階で柔軟に制御できます。

---

## 変更内容

### 1. バックエンド設定拡張
- **[settings.rs](file:///c:/work/NoCapEdit/src/settings.rs)**, **[commands.rs](file:///c:/work/NoCapEdit/src/commands.rs)**
  - `AppSettings` および `SettingsResponse` に `word_wrap: bool`（デフォルト: `true`）を追加し、`config.json` への読み書きをサポート。

### 2. エディタモジュール & タブ連動
- **[editor.js](file:///c:/work/NoCapEdit/src/dist/js/ui/editor.js)**
  - `applyWordWrap(enable)`: `wrap` 属性（`soft` / `off`）および `.word-wrap-off` クラスの適用。
  - `toggleWordWrap()`: 現在のアクティブタブの `wordWrap` 状態をトグル反転。
- **[tabs.js](file:///c:/work/NoCapEdit/src/dist/js/ui/tabs.js)**
  - `switchTab()` において、切り替え先タブの `wordWrap` 個別設定（またはデフォルト設定）を自動復元。

### 3. 設定ドックUI & キーボード操作連動
- **[index.html](file:///c:/work/NoCapEdit/src/dist/index.html)**
  - 設定ドックに `<select id="wordWrapSelectModal">` を追加。
- **[settings.js](file:///c:/work/NoCapEdit/src/dist/js/ui/settings.js)**
  - 設定変更時に `appState.wordWrap` を更新して `saveSettings()` 永続化および現在タブへ即時適用。
  - フォーカス移動リストにセレクトボックスを追加（`Tab` キーによる完全キーボード操作連動）。
- **[settingsManager.js](file:///c:/work/NoCapEdit/src/dist/js/core/settingsManager.js)**
  - 設定保存ペイロードに `word_wrap` を追加。

### 4. スタイル調整
- **[style.css](file:///c:/work/NoCapEdit/src/dist/style.css)**
  - `.editor`（折り返し有効時）: `white-space: pre-wrap; word-break: break-all;`
  - `.editor.word-wrap-off`（折り返し無効時）: `white-space: pre; word-break: normal;` により横スクロールバーを有効化。

### 5. ショートカット & ヘルプ
- **[shortcuts.js](file:///c:/work/NoCapEdit/src/dist/js/ui/shortcuts.js)**: `Alt + Z` で `toggleWordWrap()` を呼び出し。
- **[help.html](file:///c:/work/NoCapEdit/src/dist/help.html)**: 「表示・ズーム」に `Alt + Z: 行の折り返し切り替え` を追加。
- **[i18n.js](file:///c:/work/NoCapEdit/src/dist/i18n.js)**: 多言語テキスト（ラベル、選択肢、ヘルプ項目）を定義。

### 6. 仕様書・ドキュメント更新
- **[spec.md](file:///c:/work/NoCapEdit/docs/spec.md)**, **[SHORTCUTS.md](file:///c:/work/NoCapEdit/docs/SHORTCUTS.md)**, **[USER_GUIDE.md](file:///c:/work/NoCapEdit/docs/USER_GUIDE.md)** を更新。

### 7. バージョン管理
- バージョン番号を `0.1.82` から `0.1.83` に更新（`Cargo.toml`, `tauri.conf.json`, `nsis/installer.nsi`, `docs/DEVELOPMENT.md`）。

---

## 検証結果

- **ビルド・コンパイル検証**:
  - `cargo check` および `cargo test`: エラーなく正常に完了。
- **動作確認**:
  - 長い行を入力した状態で `Alt + Z` を押すと、折り返しが即座に解除され、下部に横スクロールバーが表示されることを確認。もう一度押すと元に戻ることを確認。
  - タブAで `Alt + Z` で折り返し解除した後、タブB（折り返し有効）に切り替え、再度タブAに戻ると、タブAの折り返し解除状態が正常に保持されることを確認。
  - 設定ドックから「行の折り返し」を「無効」に変更してアプリを再起動すると、起動時から折り返し無効が適用されることを確認。
  - 設定ドック内で `Tab` キーによる項目循環移動に「行の折り返し」が含まれていることを確認。
  - `Alt + Z` 操作後も、テキスト編集の Undo（`Ctrl + Z`）/ Redo（`Ctrl + Y`）が正常に機能することを確認。
  - ヘルプ画面（`F1`）に `Alt + Z: 行の折り返し切り替え` が表示されることを確認。
