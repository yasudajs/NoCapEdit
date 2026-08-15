# エディタ操作（行操作・インデント）のUndo/Redo（Ctrl+Z / Ctrl+Y）対応 実装計画書

## 概要
エディタ上で行う以下のプログラム的なテキスト編集操作において、ブラウザ標準の **Undo（`Ctrl + Z` / 元に戻す）** および **Redo（`Ctrl + Y` / やり直す）** が正しく機能するように改修します。

1. **行の上下移動 (`Alt + ↑` / `Alt + ↓`)**
2. **行の上下複製 (`Alt + Shift + ↑` / `Alt + Shift + ↓`)**
3. **行の削除 (`Ctrl + Shift + K`)**
4. **インデント挿入 / 削除 (`Tab` / `Shift + Tab`)**

---

## 課題と技術的アプローチ

### 課題
Web標準の `<textarea>` では、JavaScriptから `textarea.value = ...` を用いてテキストを丸ごと直接代入すると、ブラウザ（WebView2 / Chromium）は「外部から全体がリセットされた」と判定し、**ブラウザ内部の Undo/Redo 履歴スタックを破棄（リセット）してしまう仕様**があります。そのため、ショートカットで行を削除・移動した後に `Ctrl + Z` を押しても元に戻せなくなっていました。

### 解決方針（ブラウザ標準 Undo スタックとの連動）
ブラウザの標準編集コマンド API（`document.execCommand`）を活用し、選択範囲に対して差分置換・削除・挿入を実行する共通ヘルパー関数を新設します。
これにより、ブラウザは「ユーザーによるエディタ操作」として認識するため、**ブラウザ標準の Undo/Redo スタック（`Ctrl + Z` / `Ctrl + Y`）に1アクションとして正常に記録され、完全に元に戻せるようになります。**

---

## 変更内容の詳細

### 1. エディタ操作モジュール (`src/dist/js/ui/editor.js`)
- **Undo対応テキスト置換共通ヘルパーの新設**:
  - `applyEditorTextWithUndo(replaceStart, replaceEnd, replacementText, newSelectionStart, newSelectionEnd)`
    1. 対象範囲 `[replaceStart, replaceEnd]` を `editor.setSelectionRange(replaceStart, replaceEnd)` で選択状態にする
    2. `document.execCommand('insertText', false, replacementText)` を実行してテキストを差分適用
    3. 操作後のカーソル・選択範囲 `[newSelectionStart, newSelectionEnd]` を復元
    4. `editor.dispatchEvent(new Event('input'))` を発火し、自動保存や文字数カウント・ステータスバー表示を連動
- **各操作関数の改修（`editor.value = ...` を廃止しヘルパー経由に変更）**:
  - `moveLine(direction)`: 上下の行入れ替えをヘルパー経由で実行
  - `duplicateLine(direction)`: 直上・直下へのテキスト挿入をヘルパー経由で実行
  - `deleteLine()`: 対象行（改行含む）の削除をヘルパー経由で実行（`replacementText = ''`）
  - `handleTabKey(e)`: インデント・アンインデント処理をヘルパー経由で実行

### 2. 仕様書およびドキュメント更新（※作業開始時）
- バージョン番号を `0.1.77` から `0.1.78` に更新（4ファイル一括更新）：
  - `Cargo.toml`
  - `tauri.conf.json`
  - `nsis/installer.nsi`
  - `docs/DEVELOPMENT.md`
- ドキュメント更新：
  - `docs/spec.md`: 「エディタ操作（行移動・行複製・行削除・インデント等）はブラウザ標準の Undo/Redo（`Ctrl+Z` / `Ctrl+Y`）に完全連動する」旨を明記

---

## 検証計画

### 1. Undo / Redo（元に戻す・やり直し）の動作検証
- [ ] **行削除 (`Ctrl + Shift + K`)**:
  - 削除実行後、`Ctrl + Z` を押すと削除前の行が完全に復元されること
  - 復元後、`Ctrl + Y`（または `Ctrl + Shift + Z`）を押すと再び削除されること
- [ ] **行の上下移動 (`Alt + ↑` / `Alt + ↓`)**:
  - 移動実行後、`Ctrl + Z` を押すと移動前の行位置に復元されること
- [ ] **行の上下複製 (`Alt + Shift + ↑` / `Alt + Shift + ↓`)**:
  - 複製実行後、`Ctrl + Z` を押すと複製前の状態に復元されること
- [ ] **インデント操作 (`Tab` / `Shift + Tab`)**:
  - インデント挿入・削除後、`Ctrl + Z` を押すと元のインデント状態に復元されること
- [ ] **複数行選択時の各操作**:
  - 複数行ブロックに対して移動・複製・削除・インデントを行った後、`Ctrl + Z` で一括して元に戻ること

### 2. 連動機能の検証
- [ ] 各操作および Undo / Redo 実行後に、文字数カウントが正しく更新されること
- [ ] 各操作および Undo / Redo 実行後に、自動保存が正常に機能すること
- [ ] `cargo check` / `cargo test` がエラーなく完了すること
