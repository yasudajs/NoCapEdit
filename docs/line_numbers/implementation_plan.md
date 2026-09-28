# 実装計画書: 行番号表示機能 (Line Numbers)

## 1. 概要
NoCapEdit に「行番号の表示」機能を追加する。
既存の「行の折り返し（Word Wrap）」の設計パターンと完全に統一し、以下の2層構造で提供する：
1. **設定ドック（`config.json`）**: アプリ全体の基本設定（デフォルト: **無効（表示しない）**）を管理・永続化。
2. **ショートカットキー（`Alt + L`）**: 作業中のタブに対して個別に一時切り替え（トグル）。
あわせて、ヘルプ画面（`F1`）およびショートカット一覧のカテゴリ構成を「表示」「テキスト編集」「検索・置換」「フォントサイズ・行間」に再整理する。

---

## 2. 仕様詳細

### 2.1 行番号表示の動作仕様（折り返しと同様の2層設計）
- **設定画面（右ドック）での基本設定**:
  - 設定ドックに「行番号の表示」セレクトボックス（`#lineNumbersSelectModal`）を追加。
  - 選択肢:
    - **無効（表示しない / デフォルト）**
    - **有効（表示する）**
  - 設定ドックで変更すると `config.json` に保存され、現在アクティブなタブおよび以降新規に作成されるタブの初期状態に反映される。
- **ショートカット（`Alt + L`）での一時切り替え**:
  - 作業中のアクティブタブに対してのみ、即座に行番号の表示/非表示（ON/OFF）をトグルする。
  - タブ個別状態（`tab.lineNumbers`）として保持され、タブ切り替え時にも直前の状態が正確に復元される。
  - 他のタブや基本設定（`config.json`）には影響しない。
- **テーマ連動（CSS変数ベース）**:
  - `style.css` の各テーマ定義（Dark / Soft Dark / Light）にガター専用のCSS変数（`--gutter-bg`, `--gutter-text`, `--gutter-border`, `--gutter-active-text` 等）を追加定義。
  - CodeMirror の `baseTheme` はこれらの変数を参照し、テーマ変更時にも美しいコントラストを維持する。
- **行折り返し（Word Wrap）との関係**:
  - 長い行が折り返された場合でも、行番号は物理行の先頭にのみ表示され、折り返し行には表示されない（CodeMirror 6 標準）。
- **ズーム・行間連動**:
  - フォントサイズ変更（`Ctrl + =` / `Ctrl + -`）や行間変更時も、行番号のサイズ・行高が本文とズレずに自動追従する。

### 2.2 ヘルプ画面（`F1`）およびショートカット一覧のカテゴリ再整理
ユーザーの操作導線を整理するため、ヘルプ画面（`help.html`）、多言語定義（`i18n.js`）、およびドキュメント（`SHORTCUTS.md`）のカテゴリ構成を以下の通り再編成する：

1. **`表示` (新規カテゴリ)**:
   - `Alt + Z`: 行の折り返し切り替え
   - `Alt + L`: 行番号の表示切り替え
2. **`テキスト編集` (移動・整理)**:
   - `Alt + ↑` / `Alt + ↓`: 行の上下移動
   - `Alt + Shift + ↑` / `Alt + Shift + ↓`: 行の上下複製
   - `Alt + Shift + K`: 行の削除
   - `F5`: 現在日時の挿入
   - `Tab` / `Shift + Tab`: インデント挿入・削除
3. **`検索・置換` (維持)**:
   - 検索・置換関連ショートカット
4. **`フォントサイズ・行間` (従来の「表示・ズーム」から名称変更)**:
   - 文字サイズの拡大・縮小、行間の広狭、ズーム・行間のリセット

---

## 3. 影響範囲・変更対象ファイル

### 3.1 バックエンド (Rust / Tauri)
1. **`src/settings.rs`**
   - `AppSettings` 構造体に `pub line_numbers: bool` を追加（デフォルト値: `false`）。
   - `SettingsResponse` 構造体に `pub line_numbers: bool` を追加。
   - `AppSettings::default()` で `line_numbers: false` を設定。
2. **`src/commands.rs`**
   - `get_settings()` で `line_numbers: settings.line_numbers` を返却。

### 3.2 フロントエンド (HTML / JS / CSS)
1. **`src/frontend/style.css`**
   - Dark / Soft Dark / Light の各テーマにガター用CSS変数（`--gutter-bg`, `--gutter-text`, `--gutter-border`, `--gutter-active-text`）を定義。
2. **`src/frontend/i18n.js`**
   - 設定項目テキスト（コーディング規約に準拠）:
     - `ui.tooltip.lineNumbers`: "行番号の表示を変更"
     - `ui.dialog.settings.lineNumbers.label`: "行番号の表示:"
     - `ui.dialog.settings.lineNumbers.on`: "有効（表示する）"
     - `ui.dialog.settings.lineNumbers.off`: "無効（表示しない）"
   - ヘルプカテゴリ・ショートカットテキストの再整理:
     - `help.categories.view`: "表示"
     - `help.categories.fontAndLineHeight`: "フォントサイズ・行間"
     - `help.shortcuts.toggleLineNumbers`: "行番号の表示切り替え"
3. **`src/frontend/index.html`**
   - 設定ドック（`#settingsDialog`）に「行番号の表示」セレクトボックス（`#lineNumbersSelectModal`）を追加。
4. **`src/frontend/help.html`**
   - カテゴリを再編成（「表示」「テキスト編集」「検索・置換」「フォントサイズ・行間」）。
   - 「表示」セクションに `Alt + Z` と `Alt + L` を配置。
5. **`src/frontend/js/state.js`**
   - `appState` に `lineNumbers: false` を追加。
   - `elements` に `lineNumbersSelectModal: null` を追加。
6. **`src/frontend/js/core/settingsManager.js`**
   - `saveApplicationSettings()` の送信ペイロードに `line_numbers: appState.lineNumbers` を追加。
7. **`src/frontend/js/ui/codemirror.js`**
   - `@codemirror/view` から `lineNumbers` をインポート。
   - `lineNumbersCompartment`（Compartment）を定義・エクスポート。
   - `getDefaultExtensions()` および `initCodeMirror()` の JSDoc コメントに `options.lineNumbers`（boolean）を追加・更新。
   - `getDefaultExtensions()` に `lineNumbersCompartment.of(showLineNumbers ? lineNumbers() : [])` を追加。
   - 動的切り替え用関数 `updateLineNumbers(enable)` を追加・エクスポート。
   - `baseTheme` にガタースタイルを追加（ガター用CSS変数を参照）。
8. **`src/frontend/js/ui/editor.js`**
   - `applyLineNumbers(enable)` および `toggleLineNumbers()` を追加・エクスポート（`applyWordWrap`/`toggleWordWrap` と同等構造）。
9. **`src/frontend/js/ui/settings.js`**
   - `openSettingsDialog()` で `elements.lineNumbersSelectModal.value` を現在の `appState.lineNumbers` に同期。
   - `saveSettings()` で値を取得・保存し、現在タブの一時設定およびエディタ表示を更新。
   - `setupSettingsNavigation()` のキーボード循環フォーカスリスト（`focusableElements`）に `lineNumbersSelectModal` を追加。
10. **`src/frontend/js/ui/shortcuts.js`**
    - `Alt + L` キーハンドラーを追加し、`toggleLineNumbers()` を呼び出すよう登録。
11. **`src/frontend/js/main.js`**
    - `init()` で `settings.line_numbers` を取得・初期化。
    - `initCodeMirror()` 初期化オプションに `lineNumbers` を渡す。
    - `lineNumbersSelectModal` の `change` イベントリスナー登録。
12. **`src/frontend/js/ui/tabs.js`**
    - `createNewTab()` で `tab.lineNumbers = appState.lineNumbers` を初期化。
    - `switchTab()` で切り替え先タブの `lineNumbers` 状態を `applyLineNumbers()` で復元。

### 3.3 ドキュメント
1. **`docs/SHORTCUTS.md`**
   - カテゴリ見出しを再編成（「表示」「テキスト編集」「検索・置換」「フォントサイズ・行間」）。
   - 「表示」に `Alt + L`（行番号の表示切り替え）を追記。
2. **`docs/spec.md`**
   - 行番号表示機能の基本設定およびショートカット切り替え仕様を追記。

---

## 4. 実装手順（フェーズ2開始後のステップ）

1. **作業用ブランチの作成**:
   - `master` ブランチから `feature/line-numbers` を作成。
2. **ドキュメントの移動とコミット**:
   - `docs/wip/line_numbers/` を `docs/line_numbers/` へ移動し、コミット＆プッシュ。
3. **バージョン番号の更新**:
   - 次の内部バージョン（`0.2.24`）へ 5ファイルを更新（`Cargo.toml`, `package.json`, `tauri.conf.json`, `nsis/installer.nsi`, `docs/DEVELOPMENT.md`）。
4. **仕様書 (`docs/spec.md`) およびショートカット一覧 (`docs/SHORTCUTS.md`) の更新**:
   - 仕様とショートカットを反映。
5. **実装**:
   - バックエンド（Rust）設定の改修。
   - CSS変数（`style.css`）の定義追加。
   - フロントエンド（HTML/JS/i18n）側のUI、JSDoc、ショートカットハンドラー、タブ状態管理の実装。
   - ヘルプ画面（`help.html`）のカテゴリ再編成。
6. **検証**:
   - 動作確認（初期非表示、`Alt + L` でのタブ個別トグル、タブ切り替えでの状態保持、設定ドックでのデフォルト変更、再起動後の永続化、テーマ連動、ヘルプ画面表示）。
   - ビルド確認（`cargo check` / `npm run build`）。
7. **完了ドキュメント作成**:
   - `docs/line_numbers/walkthrough.md` の作成。
   - `docs/history.md` に `0.2.24` の変更履歴を追記。
   - コミット＆プッシュ。

---

## 5. 検証項目（テスト計画）

- [ ] アプリ起動時、デフォルトで行番号が非表示（OFF）であること。
- [ ] エディタ上で `Alt + L` を押すと、アクティブタブに行番号が表示（ON）されること。
- [ ] 再度 `Alt + L` を押すと、行番号が非表示（OFF）に戻ること。
- [ ] 複数タブを開いた状態でタブAを行番号ON、タブBを行番号OFFにした際、タブ切り替えでそれぞれの状態が正しく維持されること。
- [ ] 設定ドックを開き、「行番号の表示」で「有効」を選択して保存すると、現在タブおよび以降の新規タブがデフォルトで行番号ONで開くこと。
- [ ] アプリ再起動後も、設定ドックで保存したデフォルト設定が `config.json` から正しく復元されること。
- [ ] 長い行を折り返した際、折り返し行には行番号が付かず、物理行のみに正しく連番が表示されること。
- [ ] Dark / Soft Dark / Light テーマを切り替えた際、ガターの背景色と文字色がテーマに調和していること。
- [ ] ズームイン/ズームアウト（`Ctrl + =` / `Ctrl + -`）や行間変更時も、行番号のサイズ・行高が本文とぴったり一致してズレないこと。
- [ ] `F1` キーでヘルプ画面を開いた際、「表示」「テキスト編集」「検索・置換」「フォントサイズ・行間」のカテゴリ順に綺麗に整理され、`Alt + Z` と `Alt + L` が「表示」セクションに表示されていること。
- [ ] `codemirror.js` の `initCodeMirror()` / `getDefaultExtensions()` の JSDoc コメントが正しく更新されていること。
