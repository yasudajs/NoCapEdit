# ウォークスルー: 設定画面開閉（Ctrl+,）およびズームリセット（Ctrl+0）ショートカット追加

## 概要
マウスを使わずにキーボード操作のみでスムーズに設定の確認・変更や、エディタ表示のリセットを行えるよう、以下の2つのショートカットを追加しました。

1. **設定画面の開閉 (`Ctrl + ,`)**
2. **ズーム・行間のリセット (`Ctrl + 0` / フォント20pt・行間1.5倍)**

---

## 変更内容

### 1. ズーム・行間リセットロジックの実装
- **[editor.js](file:///c:/work/NoCapEdit/src/dist/js/ui/editor.js)**
  - `DEFAULT_FONT_SIZE = 20`, `DEFAULT_LINE_HEIGHT = 1.5` を定義。
  - `resetZoomAndLineHeight()` を新設し、文字サイズを 20pt、行間を 1.5倍にリセットして画面スタイル・ステータスバー表示・設定保存へ連動。

### 2. ショートカット監視
- **[shortcuts.js](file:///c:/work/NoCapEdit/src/dist/js/ui/shortcuts.js)**
  - `Ctrl + ,` (カンマ) 押下時に `toggleSettingsDialog()` を実行し設定ドックを開閉。
  - `Ctrl + 0` (メインキーおよびテンキー) 押下時に `resetZoomAndLineHeight()` を実行。
  - いずれの操作もエディタの Undo/Redo 履歴を破壊することなく安全に動作。

### 3. 多言語定義およびヘルプ画面
- **[i18n.js](file:///c:/work/NoCapEdit/src/dist/i18n.js)**: `toggleSettings`, `resetZoom` を追加。
- **[help.html](file:///c:/work/NoCapEdit/src/dist/help.html)**:
  - 「ファイル・タブ操作」に `Ctrl + ,: 設定画面の開閉` を追加。
  - 「表示・ズーム」に `Ctrl + 0: ズーム・行間のリセット` を追加。

### 4. 仕様書・ドキュメント更新
- **[spec.md](file:///c:/work/NoCapEdit/docs/spec.md)**, **[SHORTCUTS.md](file:///c:/work/NoCapEdit/docs/SHORTCUTS.md)**, **[USER_GUIDE.md](file:///c:/work/NoCapEdit/docs/USER_GUIDE.md)** を更新。

### 5. バージョン管理
- バージョン番号を `0.1.80` から `0.1.81` に更新（`Cargo.toml`, `tauri.conf.json`, `nsis/installer.nsi`, `docs/DEVELOPMENT.md`）。

---

## 検証結果

- **ビルド・コンパイル検証**:
  - `cargo check` および `cargo test`: エラーなく正常に完了。
- **動作確認**:
  - `Ctrl + ,` を押すと設定ドックが開き、もう一度押すと閉じてエディタのカーソル位置へスムーズに復帰することを確認。
  - フォントや行間を変更後、`Ctrl + 0`（メインキー0およびテンキー0）を押すと即座に `20pt / 1.5x` にリセットされることを確認。
  - 設定開閉やズームリセットを行った後も、テキスト編集の `Ctrl + Z`（Undo）が正常に機能することを確認。
  - ヘルプ画面（`F1`）に新設ショートカットが綺麗に表示されることを確認。
