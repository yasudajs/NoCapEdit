# ウォークスルー: エディタ操作（行操作・インデント）のUndo/Redo（Ctrl+Z / Ctrl+Y）完全連動

## 概要
行操作（上下移動、上下複製、削除）およびインデント操作（`Tab` / `Shift + Tab`）を実行した際に、ブラウザ標準の Undo（`Ctrl + Z`）および Redo（`Ctrl + Y`）の履歴が途切れることなく、通常の文字入力と同様に元に戻す・やり直すことができるよう改修を行いました。

---

## 変更内容

### 1. Undo対応テキスト置換共通ヘルパーの新設
- **[editor.js](file:///c:/work/NoCapEdit/src/dist/js/ui/editor.js)**
  - `applyEditorTextWithUndo(replaceStart, replaceEnd, replacementText, newSelectionStart, newSelectionEnd)` を新設。
  - `document.execCommand('insertText', false, replacementText)` を活用して選択範囲を置換・削除・挿入することで、ブラウザ（WebView2 / Chromium）ネイティブの Undo/Redo スタックに正常に1アクションとして記録。

### 2. 各エディタ操作関数の改修
- **[editor.js](file:///c:/work/NoCapEdit/src/dist/js/ui/editor.js)**
  - `moveLine(direction)`: 上下の行入れ替え処理を `applyEditorTextWithUndo` 経由に変更。
  - `duplicateLine(direction)`: 直上・直下への行複製挿入を `applyEditorTextWithUndo` 経由に変更。
  - `deleteLine()`: 行削除処理を `applyEditorTextWithUndo` 経由に変更。
  - `handleTabKey(e)`: 単一行・複数行のインデント挿入および削除（Shift+Tab）を `applyEditorTextWithUndo` 経由に変更。

### 3. 仕様書の更新
- **[spec.md](file:///c:/work/NoCapEdit/docs/spec.md)**: 4.4 テキスト編集仕様に「行操作およびインデント操作などのエディタ編集処理は、ブラウザ標準の Undo/Redo（`Ctrl+Z` / `Ctrl+Y`）に完全連動する」旨を明記。

### 4. バージョン管理
- バージョン番号を `0.1.77` から `0.1.78` に更新（`Cargo.toml`, `tauri.conf.json`, `nsis/installer.nsi`, `docs/DEVELOPMENT.md`）。

---

## 検証結果

- **ビルド・コンパイル検証**:
  - `cargo check` および `cargo test`: エラーなく正常に完了。
- **Undo / Redo 動作**:
  - `Ctrl + Shift + K`（行削除）後、`Ctrl + Z` で行が完全に復元され、`Ctrl + Y` で再削除されることを確認。
  - `Alt + ↑ / ↓`（行移動）後、`Ctrl + Z` で移動前の位置に復元されることを確認。
  - `Alt + Shift + ↑ / ↓`（行複製）後、`Ctrl + Z` で複製前の状態に復元されることを確認。
  - `Tab` / `Shift + Tab`（インデント操作）後、`Ctrl + Z` でインデントが元に戻ることを確認。
  - 通常の文字入力と上記操作を組み合わせた連続的な `Ctrl + Z` / `Ctrl + Y` が時系列順に正しく動作することを確認。
