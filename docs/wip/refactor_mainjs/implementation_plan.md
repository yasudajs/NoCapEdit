# main.js リファクタリング（ES Modules分割）計画

現在の単一の巨大な `main.js` (約2200行) を ES Modules を用いて機能ごとに分割し、コードの可読性・保守性を向上させます。

## User Review Required

> [!WARNING]
> この変更はフロントエンド全体の大規模な構造変更になります。
> JavaScript を `<script type="module">` として読み込むように変更するため、今後ブラウザで単独の `index.html` を（サーバーなしで）直接開いての動作確認はできなくなりますが、Tauriアプリとして動作（`cargo run`）させる分には全く問題ありません。

## Open Questions

> [!IMPORTANT]
> - ファイルの整理方法について確認です。新しく `src/dist/js/` というフォルダを作成し、その中に `main.js` やその他のモジュールを配置する形でよろしいでしょうか？（`src/dist/` 直下がJSファイルだらけになるのを防ぐため、この構成を推奨します）

## Proposed Changes

### フロントエンド構造変更

#### [NEW] `src/dist/js/state.js`
- `appState`, `elements`キャッシュ, タブのカウンタなどの状態変数を一元管理してエクスポートする。

#### [NEW] `src/dist/js/core/tauri.js`
- `window.__TAURI__` の呼び出しラッパー (`invoke`, `listen`, `openDialog`等) および初期化チェック (`ensureTauriApi`) をまとめる。

#### [NEW] `src/dist/js/core/fileSystem.js`
- ファイルの保存・読み込み・自動保存ロジック（`saveTabAs`, `persistTabWithRecovery`, `autoSave`等）をまとめる。

#### [NEW] `src/dist/js/utils/helpers.js`
- `generateTabId`, `normalizePathForComparison`, `getFileNameFromPath` 等の純粋な便利関数群。

#### [NEW] `src/dist/js/ui/tabs.js`
- タブの作成、切り替え、閉じる処理、および描画処理（`renderTabs`, `formatTabDisplayName`等）。

#### [NEW] `src/dist/js/ui/editor.js`
- エディタの入力イベントハンドラ、フォントサイズ調整、行間調整などのロジック。

#### [NEW] `src/dist/js/ui/sidebar.js`
- ファイルツリーの描画、ディレクトリ読み込み、コンテキストメニュー関連。

#### [NEW] `src/dist/js/ui/settings.js`
- 設定ダイアログの開閉、設定保存、テーマ変更、フォントリスト読み込み関連。

#### [NEW] `src/dist/js/main.js` (エントリポイント)
- 上記モジュール群から必要な関数を `import` し、起動時の初期化（`init()`, イベントリスナ登録）を行う。

#### [DELETE] `src/dist/main.js`
- 古い巨大なファイルは削除する。

#### [MODIFY] `src/dist/index.html`
- 旧 `<script src="main.js"></script>` を削除し、新しく `<script type="module" src="js/main.js"></script>` に差し替える。

## Verification Plan

### Automated Tests
- バックエンド側の変更はないため、通常通り `cargo tauri build` が正常に終了するか確認する。

### Manual Verification
- `cargo run` でアプリを起動し、以下の基本機能がエラー無く（開発者ツールのコンソールにエラーが出ずに）動作するかを手動で確認する。
  1. アプリの起動とホームフォルダ設定の読み込み
  2. 新規ファイルの自動作成・文字入力・自動保存
  3. タブの作成と切り替え
  4. サイドバー（ファイルツリー）の展開とファイルオープン
  5. 設定画面からのテーマ・フォント変更
