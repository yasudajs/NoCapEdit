# ウォークスルー: タブを閉じる（Ctrl+W）およびアプリ終了（Ctrl+Q）ショートカット追加

## 概要
キーボードのみでエディタの操作が完結できるよう、以下のショートカットキーを追加し、ヘルプ画面およびドキュメントを更新しました。

1. **`Ctrl + W`**: 現在アクティブなタブを閉じる（最後の1つのタブを閉じた場合は自動的に新規空タブを開く）
2. **`Ctrl + Q`**: アプリケーションを終了する（編集中の未保存データを安全に保存した上で終了）

---

## 変更内容

### 1. ショートカットハンドラの実装
- **[shortcuts.js](file:///c:/work/NoCapEdit/src/dist/js/ui/shortcuts.js)**
  - `tabs.js` から `closeTab` をインポートし、`Ctrl + W` 押下時に `closeTab(appState.currentTab)` を実行する処理を追加。
  - `../core/tauri.js` から `appWindow` をインポートし、`Ctrl + Q` 押下時に `appWindow.close()` を実行する処理を追加（安全な保存・終了ハンドラが動作）。

### 2. 多言語テキストおよびヘルプ画面
- **[i18n.js](file:///c:/work/NoCapEdit/src/dist/i18n.js)**
  - `help.shortcuts.closeTab`（`"タブを閉じる"`）および `help.shortcuts.exitApp`（`"アプリを終了"`）を追加。
- **[help.html](file:///c:/work/NoCapEdit/src/dist/help.html)**
  - 「ファイル・タブ操作」に `Ctrl + W`、「その他」に `Ctrl + Q` を追加。

### 3. 仕様書および各種ドキュメント
- **[spec.md](file:///c:/work/NoCapEdit/docs/spec.md)**: 4.3 タブ管理に `Ctrl + W` と `Ctrl + Q` の仕様を追加。
- **[SHORTCUTS.md](file:///c:/work/NoCapEdit/docs/SHORTCUTS.md)**: ショートカット一覧に `Ctrl + W` と `Ctrl + Q` を追記。
- **[USER_GUIDE.md](file:///c:/work/NoCapEdit/docs/USER_GUIDE.md)**: タブ操作欄に `Ctrl + W` / `Ctrl + T` のキーボード操作を追記。

### 4. バージョン管理
- バージョン番号を `0.1.75` から `0.1.76` に更新（`Cargo.toml`, `tauri.conf.json`, `nsis/installer.nsi`, `docs/DEVELOPMENT.md`）。

---

## 検証結果

- **ビルド・コンパイル検証**:
  - `cargo check` および `cargo test`: エラーなく正常に完了。
- **ショートカット動作**:
  - `Ctrl + W`: アクティブタブのクローズおよび最後のタブクローズ時の新規空タブ生成を確認。
  - `Ctrl + Q`: `appWindow.close()` 発火による自動保存と安全終了フローを確認。
  - `F1`: ヘルプ画面に新設ショートカットが正常に反映されることを確認。
