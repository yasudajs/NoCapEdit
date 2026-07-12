# Phase 1: サイドバーの枠組み構築 実装計画

## 目標
サイドバー（エクスプローラ）のガワとなるUIを構築し、開閉・リサイズ・設定の保存機能を実装する。このフェーズではファイル一覧の表示は行わない（中身は空）。

## 変更対象ファイルと実装内容

### 1. `index.html`
* メインレイアウトの変更
  * `<div id="app-layout">` のような親コンテナを設け、左から「アイコンバー」「サイドバー」「リサイズハンドル」「エディタ領域」が横並び（Flexbox）になるように再構築する。
  * 左端のアイコンバーにエクスプローラトグル用のボタン `<button id="sidebar-toggle-btn" title="エクスプローラ">🗂</button>` を追加する。
  * サイドバー本体 `<div id="sidebar" class="hidden">` を追加する（初期状態は非表示）。
  * 幅調整用の `<div id="sidebar-resize-handle"></div>` を追加する。

### 2. `style.css`
* レイアウト用CSSの追加
  * メイン領域を `display: flex;` で横並びにする。
  * `--sidebar-width` というCSS変数を定義し、`#sidebar` の `width` に適用する。
  * `.hidden` クラスが付与された要素は `display: none;` になるようにする。
  * `#sidebar-resize-handle` に `cursor: col-resize;` を設定し、境界線としてのスタイルを整える。

### 3. `main.js`
* **UI操作のロジック追加**
  * `sidebar-toggle-btn` のクリックイベントで、サイドバーの `.hidden` クラスをトグルする処理。
  * リサイズハンドルの `mousedown`, `mousemove`, `mouseup` イベントを利用したサイドバー幅の動的変更（ドラッグによるリサイズ）処理。
* **設定の保存と復元（永続化）**
  * サイドバーの開閉状態（`sidebar_visible`）および幅（`sidebar_width`）を `config.json` に保存するため、トグル操作やリサイズ完了時に既存の `save_settings` コマンドを呼び出す。
  * アプリ起動時（`get_settings` 取得後）に、設定値を読み込んでサイドバーの初期状態（表示状態・幅）を復元する処理。

### 4. `src-tauri/src/main.rs` (Rustバックエンド)
* **`AppSettings` 構造体の拡張**
  * `config.json` のマッピング先である `AppSettings` に以下のフィールドを追加する。
    * `sidebar_visible: bool` (デフォルト: `false`)
    * `sidebar_width: u32` (デフォルト: `220`)

## 検証項目
- [ ] エクスプローラボタンをクリックすると、サイドバーが開閉すること。
- [ ] 境界線をドラッグするとサイドバーの幅が滑らかに変わること。
- [ ] アプリを再起動した際、前回の開閉状態と幅が維持されていること。
