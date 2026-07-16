# v0.2系 タブ移動時のエディタインデント挿入不具合の修正ウォークスルー

v0.2系において、エディタにフォーカスがある状態で `Ctrl + Tab` または `Ctrl + Shift + Tab` を押してタブを切り替える際、エディタに Tab 文字（インデント）が挿入されてしまう不具合を修正しました。

---

## 実施した変更内容

### 1. 内部バージョンの更新 (`0.2.14` → `0.2.15`)
以下の4ファイルのバージョン管理情報を更新しました。
* [Cargo.toml](file:///c:/work/NoCapEdit/Cargo.toml)
* [tauri.conf.json](file:///c:/work/NoCapEdit/tauri.conf.json)
* [nsis/installer.nsi](file:///c:/work/NoCapEdit/nsis/installer.nsi)
* [docs/DEVELOPMENT.md](file:///c:/work/NoCapEdit/docs/DEVELOPMENT.md)

### 2. 製品仕様書の最終更新日更新
* [docs/spec.md](file:///c:/work/NoCapEdit/docs/spec.md) の最終更新日を `2026-07-17` へ更新しました。

### 3. フロントエンドの修正
* [js/main.js](file:///c:/work/NoCapEdit/src/dist/js/main.js) 内のエディタ用 `keydown` イベントリスナーにおいて、`Tab` キー押下時の処理にガードを追加し、`Ctrl` キーまたは `Alt` キーが同時に押されている場合は処理をバイパス（何もしないで `return`）するよう修正しました。

---

## 検証結果

### 1. ビルド検証
* `cargo check` により正常にコンパイルが通り、ビルドエラーがないことを確認しました。
