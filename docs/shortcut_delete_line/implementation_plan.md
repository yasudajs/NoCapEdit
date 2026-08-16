# 行削除ショートカットキーの変更計画 (Alt + Shift + K への統一)

行に対する操作（移動・複製・削除）のキーバインドを `Alt` 系統に統一し、操作感の一貫性と直感性を向上させるため、行削除ショートカットキーを `Ctrl + Shift + K` から `Alt + Shift + K` に完全移行（方針A）します。

---

## ユーザー確認・合意事項
- **採用方針**: 方針A（完全移行）
  - 行の削除ショートカットを `Alt + Shift + K` に変更し、従来の `Ctrl + Shift + K` は廃止。
  - ヘルプ画面および関連ドキュメントもすべて `Alt + Shift + K` に統一。

---

## 変更内容詳細

### 1. フロントエンド (`src/dist/`)
- **[js/ui/shortcuts.js](file:///c:/work/NoCapEdit/src/dist/js/ui/shortcuts.js)**
  - `e.altKey && !e.ctrlKey` かつ `e.shiftKey` の条件下に、`e.key === 'k' || e.key === 'K' || e.code === 'KeyK'` の判定を追加して `deleteLine()` を呼び出し。
  - 従来の `Ctrl + Shift + K` による判定ブロックを削除。
- **[help.html](file:///c:/work/NoCapEdit/src/dist/help.html)**
  - 「テキスト編集」カテゴリ内の「行の削除」ショートカット表示を `Ctrl + Shift + K` から `Alt + Shift + K` に更新。

### 2. 仕様書・ガイドドキュメント (`docs/`)
※実装開始時に更新
- **[docs/spec.md](file:///c:/work/NoCapEdit/docs/spec.md)**
  - 行削除の仕様記述を `Alt + Shift + K` に更新。
- **[docs/USER_GUIDE.md](file:///c:/work/NoCapEdit/docs/USER_GUIDE.md)**
  - 編集ショートカット一覧の行削除の記述を `Alt + Shift + K` に更新。

### 3. バージョン更新 (4ファイル)
※実装開始時に `0.1.86` から `0.1.87` に更新
- `Cargo.toml`
- `tauri.conf.json`
- `nsis/installer.nsi`
- `docs/DEVELOPMENT.md`

---

## 検証計画

### 手動検証
- [x] **行削除動作の確認**:
  - [x] カーソルがある単一行で `Alt + Shift + K` を押し、現在行が削除されること。
  - [x] 複数行を選択した状態で `Alt + Shift + K` を押し、選択範囲の行が一括削除されること。
  - [x] Undo (`Ctrl + Z`) / Redo (`Ctrl + Y`) で削除と復元が正しく連動すること。
- [x] **旧ショートカット無効化の確認**:
  - [x] `Ctrl + Shift + K` を押しても行削除が発火しないこと。
- [x] **ヘルプ画面の確認**:
  - [x] `F1` キーでショートカット一覧を開き、「行の削除」が `Alt + Shift + K` と表示されていること。
- [x] **ビルド検証**:
  - [x] `cargo check` 等を実行し、ビルドエラーが発生しないことを確認。
