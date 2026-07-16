# リファクタリング（モジュール分割＆i18n導入）ウォークスルー

v0.1系（`master` ブランチ）のフロントエンド JavaScript コードを、v0.2系と共通のモジュール分割構造へ移行し、多言語対応の基礎インフラ（`i18n.js`）を導入しました。

---

## 実施した変更内容

### 1. 内部バージョンの更新 (`0.1.37` → `0.1.38`)
* [Cargo.toml](file:///c:/work/NoCapEdit/Cargo.toml)
* [tauri.conf.json](file:///c:/work/NoCapEdit/tauri.conf.json)
* [nsis/installer.nsi](file:///c:/work/NoCapEdit/nsis/installer.nsi)
* [docs/DEVELOPMENT.md](file:///c:/work/NoCapEdit/docs/DEVELOPMENT.md)

### 2. 製品仕様書の更新
* [docs/spec.md](file:///c:/work/NoCapEdit/docs/spec.md) にて、多言語化（i18n）方針およびフロントエンドのモジュール構造に関する技術方針を追加しました。

### 3. 多言語化インフラの追加
* [i18n.js](file:///c:/work/NoCapEdit/src/dist/i18n.js) を新規作成し、多言語辞書 `DICT` とグローバル関数 `window.t` を定義しました。

### 4. モジュール分割とリファクタリング
巨大な単一ファイル `src/dist/main.js`（約1550行）を削除し、役割ごとに以下のモジュール構造に分割しました。
* [js/state.js](file:///c:/work/NoCapEdit/src/dist/js/state.js): アプリ状態（`appState`、DOMキャッシュ）の定義。
* [js/core/tauri.js](file:///c:/work/NoCapEdit/src/dist/js/core/tauri.js): Tauri API のラッパー。
* [js/utils/helpers.js](file:///c:/work/NoCapEdit/src/dist/js/utils/helpers.js): 共通ユーティリティ関数。
* [js/ui/editor.js](file:///c:/work/NoCapEdit/src/dist/js/ui/editor.js): エディタ制御、ズーム・行間変更、Tabキーインデント制御。
* [js/ui/tabs.js](file:///c:/work/NoCapEdit/src/dist/js/ui/tabs.js): タブの生成・切替・削除・自動スクロール。
* [js/ui/settings.js](file:///c:/work/NoCapEdit/src/dist/js/ui/settings.js): 設定画面、テーマ制御、システムフォント遅延ロード。
* [js/core/fileSystem.js](file:///c:/work/NoCapEdit/src/dist/js/core/fileSystem.js): 保存、自動保存、安全保存、終了時の保存処理。
* [js/main.js](file:///c:/work/NoCapEdit/src/dist/js/main.js): アプリケーション起動とグローバルキーイベント監視。

### 5. index.html の変更
* [index.html](file:///c:/work/NoCapEdit/src/dist/index.html) のスクリプトインポートを、モジュール形式に変更しました。
  ```html
  <script src="i18n.js"></script>
  <script type="module" src="js/main.js"></script>
  ```

---

## 検証結果

### 1. ビルド検証
* `cargo check` がエラーなく正常に完了することを確認しました（コンパイル成功）。

### 2. コード構造の同期
* v0.2ブランチのモジュール構造と完全に一致させました（v0.1側の機能スコープに沿った実装になっています）。これにより、将来の機能同期やバグ修正の自動マージが容易になります。
