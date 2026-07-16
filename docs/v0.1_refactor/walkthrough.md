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

---

## 不具合修正履歴

### 1. 初期化エラーによるタブ非表示バグの修正
* **原因**: [js/main.js](file:///c:/work/NoCapEdit/src/dist/js/main.js) 内の `init()` で `applyFontFamily()` を呼び出しているにもかかわらず、`settings.js` からのインポートが漏れており、起動時に `ReferenceError: applyFontFamily is not defined` が発生して初期化処理（タブ生成やDOM描画など）が途中でクラッシュしていました。
* **対策**: `js/main.js` に `applyFontFamily` のインポートを追加しました。
* **追加の修正**: モジュール間の循環参照を防ぐため、[js/core/tauri.js](file:///c:/work/NoCapEdit/src/dist/js/core/tauri.js) からの `updateStatus`（`ui/tabs.js` 内）への不要な依存関係を削除（コメントアウト）しました。

### 2. Ctrl + Tab などのタブ移動時にエディタへTab文字が入る不具合の修正
* **原因**: エディタ（`textarea`）にフォーカスがある状態で `Ctrl + Tab` を押した際、エディタ用の `handleTabKey(e)` 内で `Ctrl` キーの判定が行われていなかったため、インデントの挿入処理が誤って実行されてしまっていました。
* **対策**: [js/ui/editor.js](file:///c:/work/NoCapEdit/src/dist/js/ui/editor.js) の `handleTabKey` 関数にガード条件を追加し、`Ctrl` キーまたは `Alt` キーが同時に押されている場合は処理をバイパス（何もしない）してイベントをグローバルへ通すように修正しました。


