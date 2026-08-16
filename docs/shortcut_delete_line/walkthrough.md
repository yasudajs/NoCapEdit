# ウォークスルー: 行削除ショートカットキーの Alt + Shift + K 統一

## 変更概要
エディタの行操作（移動: `Alt + ↑/↓`、複製: `Alt + Shift + ↑/↓`、折り返し: `Alt + Z`）と統一感を保つため、行の削除ショートカットキーを従来の `Ctrl + Shift + K` から **`Alt + Shift + K`** に完全移行（方針A）しました。

---

## 変更内容詳細

### 1. フロントエンド実装
- **[shortcuts.js](file:///c:/work/NoCapEdit/src/dist/js/ui/shortcuts.js)**
  - `e.altKey && !e.ctrlKey && e.shiftKey` 条件下に `k` / `K` / `KeyK` のキー判定を追加し、`deleteLine()` を実行するよう実装。
  - 従来の `Ctrl + Shift + K` による行削除処理ブロックを削除。
- **[help.html](file:///c:/work/NoCapEdit/src/dist/help.html)**
  - 「テキスト編集」カテゴリ内の「行の削除」ショートカット表示を `Alt + Shift + K` に更新。

### 2. 仕様書・ガイドドキュメント
- **[spec.md](file:///c:/work/NoCapEdit/docs/spec.md)**
  - 行操作ショートカットの行削除キー定義を `Alt + Shift + K` に更新。
- **[USER_GUIDE.md](file:///c:/work/NoCapEdit/docs/USER_GUIDE.md)**
  - エディタ領域のショートカット説明文中の行削除キーを `Alt + Shift + K` に更新。

### 3. バージョン管理・改定履歴
- 内部バージョンを `0.1.86` から **`0.1.87`** にインクリメント:
  - `Cargo.toml`
  - `tauri.conf.json`
  - `nsis/installer.nsi`
  - `docs/DEVELOPMENT.md`
- **[history.md](file:///c:/work/NoCapEdit/docs/history.md)**: Ver 0.1.87 の変更履歴を最上部に追記。

---

## 検証結果

### 1. ビルド検証
- `cargo check` を実行し、エラーなく正常にコンパイルされることを確認。

### 2. 機能検証
- [x] カーソルがある単一行で `Alt + Shift + K` を押すと、現在行が削除されること。
- [x] 複数行を選択した状態で `Alt + Shift + K` を押すと、選択範囲の行が一括削除されること。
- [x] 削除操作後に `Ctrl + Z`（Undo）および `Ctrl + Y`（Redo）が正常に機能すること。
- [x] 従来の `Ctrl + Shift + K` を押しても行削除が発火しないこと（誤動作なし）。
- [x] `F1` キーでヘルプ画面を開き、「行の削除」が `Alt + Shift + K` と表示されていること。
