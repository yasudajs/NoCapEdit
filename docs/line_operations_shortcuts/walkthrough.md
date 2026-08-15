# ウォークスルー: 行操作系ショートカット追加

## 概要
エディタでのメモやテキスト編集の作業効率を格段に高めるため、以下の行操作系ショートカットを実装しました。
単一行の操作はもちろん、複数行を範囲選択している場合でもブロック単位でスムーズに動作します。

1. **行の上下移動**:
   - **`Alt + ↑`**: 現在行（または選択行ブロック）を**1行上**に移動
   - **`Alt + ↓`**: 現在行（または選択行ブロック）を**1行下**に移動
2. **行の上下複製**:
   - **`Alt + Shift + ↑`**: 現在行（または選択行ブロック）を**直上**に複製
   - **`Alt + Shift + ↓`**: 現在行（または選択行ブロック）を**直下**に複製
3. **行の削除**:
   - **`Ctrl + Shift + K`**: 現在行（または選択行ブロック）を行ごと一括削除

---

## 変更内容

### 1. 行操作ロジックの実装
- **[editor.js](file:///c:/work/NoCapEdit/src/dist/js/ui/editor.js)**
  - `getSelectionLineBounds()`: 選択範囲が跨る行全体の境界（開始・終了位置・テキスト）を計算する共通ヘルパーを新設。
  - `moveLine(direction)`: 単一行・複数行を上下の隣接行と入れ替えて移動。カーソル・選択範囲も追従。
  - `duplicateLine(direction)`: 単一行・複数行を直上または直下に複製。カーソル位置を適切に更新。
  - `deleteLine()`: 単一行・複数行を行ごと一括削除し、削除後の行位置へカーソルを調整。
  - いずれの操作後も `editor.dispatchEvent(new Event('input'))` により、文字数カウントや自動保存がシームレスに連動。

### 2. ショートカット監視とIME制御
- **[shortcuts.js](file:///c:/work/NoCapEdit/src/dist/js/ui/shortcuts.js)**
  - `e.isComposing` によるIME変換中ガードを追加。
  - `Alt + [↑/↓]`、`Alt + Shift + [↑/↓]`、`Ctrl + Shift + K` のキーハンドラを追加。

### 3. 多言語定義およびヘルプ画面
- **[i18n.js](file:///c:/work/NoCapEdit/src/dist/i18n.js)**
  - `help.categories.edit`（テキスト編集）および各行操作のショートカット文言を追加。
- **[help.html](file:///c:/work/NoCapEdit/src/dist/help.html)**
  - 「テキスト編集」カテゴリを新設し、行移動 → 行複製 → 行削除 → インデント操作の順で美しく配置。

### 4. 仕様書および各種ドキュメント
- **[spec.md](file:///c:/work/NoCapEdit/docs/spec.md)**: 4.4 テキスト編集に行操作ショートカットの仕様を追加。
- **[SHORTCUTS.md](file:///c:/work/NoCapEdit/docs/SHORTCUTS.md)**: エディタ操作一覧に行操作ショートカットを追加。
- **[USER_GUIDE.md](file:///c:/work/NoCapEdit/docs/USER_GUIDE.md)**: エディタ領域の説明に行操作ショートカットの案内を追記。

### 5. バージョン管理
- バージョン番号を `0.1.76` から `0.1.77` に更新（`Cargo.toml`, `tauri.conf.json`, `nsis/installer.nsi`, `docs/DEVELOPMENT.md`）。

---

## 検証結果

- **ビルド・コンパイル検証**:
  - `cargo check` および `cargo test`: エラーなく正常に完了。
- **ショートカット動作**:
  - `Alt + ↑ / ↓`: 単一行および複数行ブロックの上下移動を確認。
  - `Alt + Shift + ↑ / ↓`: 単一行および複数行ブロックの上下複製を確認。
  - `Ctrl + Shift + K`: 単一行および複数行ブロックの一括削除を確認。
  - 最上行・最下行での境界値安全性、およびIME変換中の抑制を確認。
  - `F1`: ヘルプ画面に新設された「テキスト編集」カテゴリと各ショートカットが正常に表示されることを確認。
