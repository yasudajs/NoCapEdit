# フォントサイズ・行間の設定画面追加と永続化/一時変更の分離 実装計画書

## 概要
現在、フォントサイズと行間は設定画面で指定できず、ショートカットキー（Ctrl+Plus/Minus 等）で操作した際に自動保存されてしまう状態になっています。
本改修では、以下の対応を行います：
1. **設定画面への追加**: 設定ダイアログに「フォントサイズ（8〜72pt）」および「行間（1.0〜3.0）」の選択項目を追加し、設定した値を `config.json` に永続化する。
2. **一時変更の分離**: ショートカットキーやマウスホイールによるズーム・行間変更は「一時変更」とし、設定ファイルには自動保存しない。
3. **リセット動作の改善**: Ctrl+0（ズーム・行間リセット）押下時に、固定値ではなく「設定画面で指定した永続設定値」に戻す。
4. **デフォルト値・整合性の統一**: デフォルト値を「フォントサイズ: 20pt」「行間: 1.5」に統一し、CSS/Rust/JS 間の初期値不整合を解消する。

---

## ユーザー確認事項（確定済み）
- **初期値**: フォントサイズ 20pt、行間 1.5
- **フォントサイズ範囲**: 8pt 〜 最大 72pt
- **設定画面の項目順序**:
  1. ホームフォルダ
  2. フォント（ファミリー）
  3. **フォントサイズ**（新規）
  4. **行間**（新規）
  5. Tabキーの挙動
  6. 保存モード
  7. 文字数カウント
  8. 行の折り返し
  9. テーマ

---

## 変更対象ファイルと詳細

### 1. バックエンド（Rust）
#### [MODIFY] [src/settings.rs](file:///c:/work/NoCapEdit/src/settings.rs)
- `DEFAULT_FONT_SIZE` を `13` から `20` に変更。
- （`DEFAULT_LINE_HEIGHT` は既に `1.5` で定義済み）

---

### 2. UI / HTML / CSS
#### [MODIFY] [src/dist/style.css](file:///c:/work/NoCapEdit/src/dist/style.css)
- CSS変数 `--editor-font-size` の初期値を `13px` から `20px` に修正。

#### [MODIFY] [src/dist/index.html](file:///c:/work/NoCapEdit/src/dist/index.html)
- 設定ダイアログの「フォント」(`<select id="fontFamilySelectModal">`) の直下に以下を追加：
  - **フォントサイズ**: `<select id="fontSizeSelectModal" class="tab-select">`
    - 選択肢: 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20 (デフォルト), 21, 22, 24, 26, 28, 32, 36, 40, 48, 56, 64, 72 pt
  - **行間**: `<select id="lineHeightSelectModal" class="tab-select">`
    - 選択肢: 1.0, 1.1, 1.2, 1.3, 1.4, 1.5 (デフォルト), 1.6, 1.7, 1.8, 1.9, 2.0, 2.2, 2.5, 2.8, 3.0
- それぞれに `data-i18n`（ラベル）、`data-i18n-title`（ツールチップ）を付与。

#### [MODIFY] [src/dist/i18n.js](file:///c:/work/NoCapEdit/src/dist/i18n.js)
- 設定ダイアログ用のラベルおよびツールチップ文言を追加：
  - `ui.dialog.settings.fontSize.label`: `"フォントサイズ:"`
  - `ui.dialog.settings.lineHeight.label`: `"行間:"`
  - `ui.tooltip.fontSize`: `"フォントサイズを変更"`
  - `ui.tooltip.lineHeight`: `"行間を変更"`

---

### 3. フロントエンドロジック（JavaScript）
#### [MODIFY] [src/dist/js/state.js](file:///c:/work/NoCapEdit/src/dist/js/state.js)
- `elements` に `fontSizeSelectModal`, `lineHeightSelectModal` を追加。
- `appState` に保存設定値と現在値の区別を保持できるようにプロパティを整理（`savedFontSize`, `savedLineHeight`）。

#### [MODIFY] [src/dist/js/ui/editor.js](file:///c:/work/NoCapEdit/src/dist/js/ui/editor.js)
- `applyFontSize()` / `applyLineHeight()` から `saveSettingsDelay()` の呼び出しを削除（ショートカットによる一時変更時は自動保存しない）。
- `resetZoomAndLineHeight()` でリセットする値を、ハードコード値ではなく `appState.savedFontSize || 20` および `appState.savedLineHeight || 1.5` に変更。
- `DEFAULT_FONT_SIZE` を 20 に設定。

#### [MODIFY] [src/dist/js/ui/settings.js](file:///c:/work/NoCapEdit/src/dist/js/ui/settings.js)
- `openSettingsDialog()`:
  - `fontSizeSelectModal` に `appState.savedFontSize || appState.fontSize || 20` をセット。
  - `lineHeightSelectModal` に `appState.savedLineHeight || appState.lineHeight || 1.5` をセット。
- `setupSettingsNavigation()`:
  - `focusableElements` に `elements.fontSizeSelectModal` と `elements.lineHeightSelectModal` をフォントの直後に追加（キーボードの Tab / Shift+Tab によるフォーカス巡回）。
- `saveSettings()`:
  - モーダルのセレクトからフォントサイズ（数値変換）・行間（数値変換）を取得。
  - `appState.savedFontSize`, `appState.fontSize`, `appState.savedLineHeight`, `appState.lineHeight` に反映。
  - `applyFontSize()`, `applyLineHeight()` を呼び出して即時エディタに反映。
  - `saveApplicationSettings()` を呼び出して `config.json` に永続化。

#### [MODIFY] [src/dist/js/main.js](file:///c:/work/NoCapEdit/src/dist/js/main.js)
- `initApp()`:
  - 設定読み込み時に `appState.savedFontSize = settings.font_size || 20`、`appState.savedLineHeight = settings.line_height || 1.5`、`appState.fontSize = appState.savedFontSize`、`appState.lineHeight = appState.savedLineHeight` を設定。
  - セレクトボックスの初期値反映。
- `setupUIEventListeners()`:
  - `fontSizeSelectModal` と `lineHeightSelectModal` の `change` イベントリスナーを追加し、変更時に `saveSettings()` を実行。

---

## 検証計画

### 1. ビルド & 構文チェック
- [x] `cargo check` / `cargo build` を実行して Rust コードのコンパイルエラーがないこと

### 2. 設定画面での永続化テスト
- [x] 設定ダイアログを開き、フォントサイズ（例: 24pt）および行間（例: 2.0）を選択して閉じる
- [x] エディタの文字サイズと行間が即座に変更され、ステータスバーのメトリクス（`フォント 24 pt | 行間 x 2.0`）が更新されること
- [x] アプリを再起動し、設定したフォントサイズ（24pt）と行間（2.0）が保持されていること

### 3. ショートカットによる一時変更テスト
- [x] Ctrl+Plus / Minus（またはマウスホイール）でフォントサイズを一時的に変更できること
- [x] Ctrl+Shift+Plus / Minus（または Ctrl+Shift+マウスホイール）で行間を一時的に変更できること
- [x] アプリを再起動し、設定画面で指定した値（永続値）に戻っていること（一時変更が保存されていないこと）

### 4. リセットショートカット（Ctrl+0）テスト
- [x] ショートカット等でフォントサイズ・行間を変更した状態で `Ctrl + 0` を押下する
- [x] 設定画面で保存されているフォントサイズ・行間に復元されること

### 5. キーボード操作テスト
- [x] `Ctrl + ,` で設定ダイアログを開く
- [x] `Tab` / `Shift + Tab` で新規追加した「フォントサイズ」「行間」にフォーカスが移動できること
- [x] フォーカス時に `↑` / `↓` キーで項目が変更できること
