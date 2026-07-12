# Phase 1: サイドバーの枠組み構築 実装計画

サイドバー（エクスプローラ）のガワとなるUIを構築し、開閉・リサイズ・設定の保存機能を実装します。このフェーズではファイル一覧の表示は行いません。

## Proposed Changes

### フロントエンドUI
#### [MODIFY] src/dist/index.html
- `<body>` 直下に `<div id="app-layout" class="app-layout">` を追加し、既存の `#app` コンテナをその中にラップする。
- 左端にアイコンバー（`#icon-bar`）と、エクスプローラ切り替え用のトグルボタン（`#sidebar-toggle-btn`）を追加する。
- トグルボタンの横に、サイドバー領域（`#sidebar`）とリサイズハンドル（`#sidebar-resize-handle`）を追加する。

#### [MODIFY] src/dist/style.css
- `:root` に `--sidebar-width: 220px;` を追加。
- `.app-layout` に対して `display: flex; height: 100vh; overflow: hidden;` を指定し、横並びレイアウトを構成する。
- `.sidebar`, `.icon-bar`, `.icon-btn`, `.resize-handle` のスタイル定義を追加し、非表示用の `.hidden` クラスを設定する。
- `.resize-handle` には `cursor: col-resize;` を設定し、境界線らしくスタイリングする。

### フロントエンドロジック
#### [MODIFY] src/dist/main.js
- `appState` に `sidebarVisible` と `sidebarWidth` の初期値を追加。
- DOM要素キャッシュ（`elements`）に `sidebarToggleBtn`, `sidebar`, `sidebarResizeHandle` などを追加。
- **トグル機能**: `sidebarToggleBtn` のクリックイベントで `sidebar.classList.toggle('hidden')` を行い、状態を `appState` に反映後 `saveSettings()` を呼ぶ。
- **リサイズ機能**: `mousedown`, `mousemove`, `mouseup` イベントリスナーを使用し、ドラッグに合わせて `--sidebar-width` を動的に変更。ドラッグ終了時に `saveSettings()` を呼ぶ。
- **設定の復元**: `get_settings` 取得時の処理内に、サイドバーの開閉状態と幅を復元する処理を追加。

### バックエンド（Rust）
#### [MODIFY] src/main.rs
- `AppSettings` 構造体に `sidebar_visible: bool` および `sidebar_width: u32` フィールドを追加。
- 起動時のデフォルト値として、`default_sidebar_visible` (false) と `default_sidebar_width` (220) 関数を追加し、serdeのdefault属性に設定する。

## Verification Plan
### Manual Verification
- アプリを起動し、左端のボタンでサイドバーが正しく開閉できるか。
- サイドバーとエディタの境界線をドラッグし、幅がスムーズに変更できるか。
- 任意の幅・開閉状態でアプリを終了し、再起動した際にその状態が正しく維持されているか。
