# ウォークスルー: フォントサイズ・行間の設定画面追加と永続化/一時変更の分離

## 実装概要
設定画面に「フォントサイズ」および「行間」の選択項目を追加し、設定画面からの変更を永続化（`config.json` に保存）できるようにしました。
また、ショートカットキーによる拡大・縮小や行間調整は一時変更とし、設定ファイルへの不要な自動保存を排除するとともに、リセットショートカット（Ctrl+0）で設定画面の保存値に復元できるように改善しました。

---

## 変更点

### 1. バックエンド（Rust）
- [`src/settings.rs`](file:///c:/work/NoCapEdit/src/settings.rs): `DEFAULT_FONT_SIZE` を `13` から `20` に変更し、全体の初期設定値と統一。

### 2. UI / HTML / CSS / 多言語化
- [`src/dist/style.css`](file:///c:/work/NoCapEdit/src/dist/style.css): `--editor-font-size` の初期値を `20px` に統一。
- [`src/dist/index.html`](file:///c:/work/NoCapEdit/src/dist/index.html):
  - 設定ダイアログの「フォント」直下に、フォントサイズ（8〜72pt）および行間（1.0〜3.0）の `<select>` 要素を追加。
- [`src/dist/i18n.js`](file:///c:/work/NoCapEdit/src/dist/i18n.js):
  - 新規追加した設定項目のラベルとツールチップ（`fontSize`, `lineHeight`）を定義。

### 3. フロントエンド状態管理・エディタ制御
- [`src/dist/js/state.js`](file:///c:/work/NoCapEdit/src/dist/js/state.js):
  - `appState` に保存設定値（`savedFontSize`, `savedLineHeight`）を追加し、一時値と分離。
  - `elements` に `fontSizeSelectModal`, `lineHeightSelectModal` を追加。
- [`src/dist/js/ui/editor.js`](file:///c:/work/NoCapEdit/src/dist/js/ui/editor.js):
  - `applyFontSize()` / `applyLineHeight()` 内の `saveSettingsDelay()` を削除（ショートカットによる一時変更を自動保存しないよう修正）。
  - `resetZoomAndLineHeight()`（Ctrl+0）の復元先を `savedFontSize` / `savedLineHeight` に設定。
  - `DEFAULT_FONT_SIZE` を 20 に設定。
- [`src/dist/js/ui/settings.js`](file:///c:/work/NoCapEdit/src/dist/js/ui/settings.js):
  - `openSettingsDialog()` で保存値を選択状態としてロード。
  - `setupSettingsNavigation()` の Tab キー循環巡回リスト（`focusableElements`）にフォントサイズと行間を追加。
  - `saveSettings()` で選択されたフォントサイズ・行間を永続値および現在値に反映し、エディタへの即時適用と `saveApplicationSettings()` による保存を実行。
- [`src/dist/js/core/settingsManager.js`](file:///c:/work/NoCapEdit/src/dist/js/core/settingsManager.js):
  - 設定保存時に `savedFontSize` / `savedLineHeight` を優先して保存するよう整合。
- [`src/dist/js/main.js`](file:///c:/work/NoCapEdit/src/dist/js/main.js):
  - 初期化時に設定値を `savedFontSize` / `savedLineHeight` に読み込み、セレクト要素へ反映。
  - `fontSizeSelectModal` / `lineHeightSelectModal` の `change` イベントリスナーを追加し、変更時に設定を保存。

### 4. ドキュメント・バージョン管理
- `Cargo.toml`, `tauri.conf.json`, `nsis/installer.nsi`, `docs/DEVELOPMENT.md` のバージョン番号を `0.1.89` に更新。
- [`docs/spec.md`](file:///c:/work/NoCapEdit/docs/spec.md) にフォントサイズ・行間の設定画面永続化および一時調整仕様を反映。

---

## 検証結果

- [x] **ビルド & 構文チェック**: `cargo check` および `cargo test` が正常終了、node による全 JS ファイルの構文チェックがパス。
- [x] **設定画面での永続化**: 設定画面からフォントサイズや行間を変更した際に即座にエディタおよびステータスバーに反映され、`config.json` に正しく保存されることを確認。
- [x] **ショートカットによる一時変更**: ショートカットやホイール操作で変更した値は一時的にエディタへ反映され、設定ファイルへの自動保存は行われないことを確認。
- [x] **リセット動作**: 一時変更後に `Ctrl + 0` を押下すると、設定画面で設定した基準値に正しく復元されることを確認。
- [x] **キーボードナビゲーション**: 設定ダイアログ内で `Tab` / `Shift + Tab` により新設項目間をスムーズにフォーカス移動し、上下矢印キーで値が変更できることを確認。
