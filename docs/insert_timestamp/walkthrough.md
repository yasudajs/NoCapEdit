# ウォークスルー: タイムスタンプ挿入ショートカット（F5）追加

## 概要
Windows標準メモ帳と同様に、**`F5` キー** を押すことでカーソル位置（または選択範囲）に現在日時（タイムスタンプ）を素早く挿入できる機能を実装しました。
ブラウザ標準の Undo（`Ctrl + Z`）/ Redo（`Ctrl + Y`）にも完全対応しています。

---

## 変更内容

### 1. タイムスタンプ挿入ロジックの実装
- **[editor.js](file:///c:/work/NoCapEdit/src/dist/js/ui/editor.js)**
  - `insertTimestamp()` を新設。
  - `YYYY/MM/DD HH:mm` 形式（例: `2026/08/15 23:05`）で現在日時文字列を生成。
  - `applyEditorTextWithUndo` を経由してテキストを挿入・置換し、挿入後のカーソル位置を日時末尾へセット。

### 2. ショートカット監視
- **[shortcuts.js](file:///c:/work/NoCapEdit/src/dist/js/ui/shortcuts.js)**
  - `F5` キー押下時にブラウザ既定のリロードを抑制し、`insertTimestamp()` を呼び出すよう改修。
  - IME変換中（`e.isComposing`）の誤動作を防止。

### 3. 多言語定義およびヘルプ画面
- **[i18n.js](file:///c:/work/NoCapEdit/src/dist/i18n.js)**: `help.shortcuts.insertTimestamp: "現在日時の挿入"` を追加。
- **[help.html](file:///c:/work/NoCapEdit/src/dist/help.html)**: 「テキスト編集」カテゴリに `F5: 現在日時の挿入` を追加。

### 4. 仕様書・ドキュメント更新
- **[spec.md](file:///c:/work/NoCapEdit/docs/spec.md)**, **[SHORTCUTS.md](file:///c:/work/NoCapEdit/docs/SHORTCUTS.md)**, **[USER_GUIDE.md](file:///c:/work/NoCapEdit/docs/USER_GUIDE.md)** に `F5` タイムスタンプ挿入の説明を追記。

### 5. バージョン管理
- バージョン番号を `0.1.79` から `0.1.80` に更新（`Cargo.toml`, `tauri.conf.json`, `nsis/installer.nsi`, `docs/DEVELOPMENT.md`）。

---

## 検証結果

- **ビルド・コンパイル検証**:
  - `cargo check` および `cargo test`: エラーなく正常に完了。
- **タイムスタンプ挿入・カーソル・Undo連動**:
  - `F5` を押すと `YYYY/MM/DD HH:mm` の形式で即座に日時が挿入され、カーソルが末尾に配置されることを確認。
  - 範囲選択した状態で `F5` を押すと、選択範囲がタイムスタンプで置換されることを確認。
  - `F5` 挿入後に `Ctrl + Z` を押すと元に戻り、`Ctrl + Y` で再挿入されることを確認。
  - ヘルプ画面（`F1`）に `F5: 現在日時の挿入` が正しく表示されることを確認。
