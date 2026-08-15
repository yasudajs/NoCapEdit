# タブを閉じる（Ctrl+W）およびアプリ終了（Ctrl+Q）ショートカット追加の実装計画書

## 概要
キーボードのみでエディタを快適に操作できるよう、以下の2つのキーボードショートカットを追加します。
1. **`Ctrl + W`**: 現在アクティブなタブを閉じる（最後のタブを閉じた場合は自動で新規空タブを開く）
2. **`Ctrl + Q`**: アプリケーションを終了する（編集中の内容を安全に保存した上で終了）

また、これに伴い F1キーで開くヘルプ画面（ショートカット一覧）およびドキュメント類（`spec.md`, `SHORTCUTS.md` 等）の更新を行います。

---

## 変更内容の詳細

### 1. フロントエンド (`src/dist/js/ui/shortcuts.js`)
- `tabs.js` から `closeTab` をインポート。
- `../core/tauri.js` から `appWindow` をインポート。
- `keydown` イベントリスナー内に以下を追加：
  - **`Ctrl + W` (または `Ctrl + w`)**:
    - `e.preventDefault()` を実行。
    - `appState.currentTab` が存在する場合、`closeTab(appState.currentTab)` を呼び出してアクティブタブを閉じる。
    - ※ `closeTab` の既存実装により、最後のタブを閉じた場合は自動的に `createNewTab()` が呼び出され、新しい空タブが生成されます。
  - **`Ctrl + Q` (または `Ctrl + q`)**:
    - `e.preventDefault()` を実行。
    - `appWindow` が存在する場合、`appWindow.close()` を呼び出す。
    - ※ `main.js` の `registerCloseHandler()` により、`appWindow.onCloseRequested` が発火して全タブの未保存データが保存（`persistAllTabsBeforeExit`）された後、アプリが終了します。

### 2. 多言語定義 (`src/dist/i18n.js`)
- `help.shortcuts` オブジェクトに以下を追加：
  - `closeTab`: `"タブを閉じる"`
  - `exitApp`: `"アプリを終了"`

### 3. ヘルプ画面 (`src/dist/help.html`)
- 「ファイル・タブ操作」のカテゴリ内に「タブを閉じる (`Ctrl + W`)」を追加。
- 「その他」のカテゴリ内に「アプリを終了 (`Ctrl + Q`)」を追加。

### 4. バージョン更新およびドキュメント更新（※作業開始時）
- バージョン番号を `0.1.75` から `0.1.76` に更新（4ファイル一括更新）：
  - `Cargo.toml`
  - `src-tauri/tauri.conf.json`
  - `nsis/installer.nsi`
  - `docs/DEVELOPMENT.md`
- ドキュメント更新：
  - `docs/spec.md`: ショートカット仕様に `Ctrl + W` と `Ctrl + Q` を追加
  - `docs/SHORTCUTS.md`: タブ操作・その他ショートカット一覧に追加
  - `docs/USER_GUIDE.md`: ショートカット関連の記載を更新

---

## 影響範囲とリスク
- **既存のショートカットとの競合**: なし（`Ctrl + W` および `Ctrl + Q` は未割り当て）。
- **データ消失リスク**: `Ctrl + W` 時は `closeTab` 内の既存保存機構、`Ctrl + Q` 時は `appWindow.onCloseRequested` 内の `persistAllTabsBeforeExit` が呼び出されるため、データ消失のリスクはありません。

---

## 検証計画

### 1. 手動検証
1. **`Ctrl + W` によるタブ閉じの検証**:
   - 複数タブ（例: 3つ）を開いた状態で `Ctrl + W` を押し、現在アクティブなタブが閉じられ、隣のタブに正しくフォーカスが切り替わることを確認。
   - タブが1つのみの状態で `Ctrl + W` を押し、現在のタブが閉じられると同時に自動で新規の空タブが開くことを確認。
2. **`Ctrl + Q` によるアプリ終了の検証**:
   - テキストを編集した直後に `Ctrl + Q` を押し、テキストが保存されて安全にアプリが終了することを確認。
   - 再度アプリを起動し、先ほど編集した内容が正しく復元されていることを確認。
3. **ヘルプ画面 (`F1`) の表示検証**:
   - `F1` キーを押してヘルプ画面を開き、新設された「タブを閉じる (`Ctrl + W`)」と「アプリを終了 (`Ctrl + Q`)」が正しく一覧に表示されていることを確認。
4. **ビルド検証**:
   - `cargo check` / `cargo build` がエラーなく完了することを確認。
