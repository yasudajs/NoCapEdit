# 設定画面開閉（Ctrl+,）およびズームリセット（Ctrl+0）ショートカット追加 実装計画書

## 概要
マウスを使わずにキーボードのみでより快適に操作できるようにするため、以下の2つのショートカットキーを実装します。

1. **設定画面の開閉 (`Ctrl + ,`)**:
   - VS Codeなどの主要エディタ標準に合わせ、`Ctrl + ,` (カンマ) で右上の設定ドックを開閉します。
2. **ズーム・行間のリセット (`Ctrl + 0`)**:
   - `Ctrl + + / -` やホイール操作で変更したフォントサイズおよび行間を、一発でデフォルト値（**フォントサイズ 20pt / 行間 1.5倍**）にリセットします。

---

## 変更内容の詳細

### 1. エディタ操作モジュール (`src/dist/js/ui/editor.js`)
- 定数とリセット関数の追加：
  - `DEFAULT_FONT_SIZE = 20`
  - `DEFAULT_LINE_HEIGHT = 1.5`
  - `resetZoomAndLineHeight()` 関数を新設・エクスポート
    - `appState.fontSize = DEFAULT_FONT_SIZE`
    - `appState.lineHeight = DEFAULT_LINE_HEIGHT`
    - `applyFontSize()` および `applyLineHeight()` を呼び出して画面と設定保存を連動

### 2. ショートカット監視 (`src/dist/js/ui/shortcuts.js`)
- `toggleSettingsDialog`（`settings.js`）および `resetZoomAndLineHeight`（`editor.js`）をインポート
- `keydown` イベントリスナーにキー判定を追加：
  - `Ctrl + ,` (`key === ','` / `code === 'Comma'`): `toggleSettingsDialog()` を実行
  - `Ctrl + 0` (`key === '0'` / `code === 'Digit0'` / `code === 'Numpad0'`): `resetZoomAndLineHeight()` を実行
  - いずれも `e.preventDefault()` でブラウザ既定動作を抑制
  - IME変換中（`e.isComposing`）の誤動作を防止

### 3. 多言語定義 (`src/dist/i18n.js`)
- `help.shortcuts` に以下を追加：
  - `toggleSettings`: `"設定画面の開閉"`
  - `resetZoom`: `"ズーム・行間のリセット"`

### 4. ヘルプ画面 (`src/dist/help.html`)
- 「ファイル・タブ操作」カテゴリに `Ctrl + ,`（設定画面の開閉）を追加
- 「表示・ズーム」カテゴリに `Ctrl + 0`（ズーム・行間のリセット）を追加

### 5. 仕様書およびドキュメント更新（※作業開始時）
- バージョン番号を `0.1.80` から `0.1.81` に更新（4ファイル一括更新）：
  - `Cargo.toml`
  - `tauri.conf.json`
  - `nsis/installer.nsi`
  - `docs/DEVELOPMENT.md`
- ドキュメント更新：
  - `docs/spec.md`: ショートカット仕様に設定開閉（Ctrl+,）とズームリセット（Ctrl+0）を追記
  - `docs/SHORTCUTS.md`: 一覧に Ctrl+, と Ctrl+0 を追記
  - `docs/USER_GUIDE.md`: 操作説明を更新

---

## 検証計画

### 1. 設定画面開閉 (`Ctrl + ,`) の検証
- [ ] エディタ編集中に `Ctrl + ,` を押すと、設定ドックがスムーズに開くこと
- [ ] 設定ドックが開いている状態で `Ctrl + ,`（または Esc）を押すと、設定ドックが閉じてエディタにフォーカスとカーソル位置が復元されること
- [ ] 日本語IME変換中に `Ctrl + ,` を押しても誤動作しないこと

### 2. ズーム・行間リセット (`Ctrl + 0`) の検証
- [ ] フォントサイズや行間を拡大・縮小した後、`Ctrl + 0` を押すと即座に **20pt / 行間1.5** にリセットされること
- [ ] テンキーの `0`（`Numpad0`）およびメインキーの `0`（`Digit0`）の双方でリセットが機能すること
- [ ] リセット後、ステータスバー右側の表示（20pt / 1.5x）が正しく更新されること
- [ ] アプリ再起動後もリセットされた値（20pt / 1.5x）が維持されること

### 3. ヘルプ画面・ビルド検証
- [ ] `F1` キーでヘルプ画面を開き、新設のショートカットが正しく表示されていること
- [ ] `cargo check` / `cargo test` がエラーなく完了すること
