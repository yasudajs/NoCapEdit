# main.js リファクタリング作業タスク

- `[x]` `src/dist/js/` ディレクトリの作成
- `[x]` `src/dist/js/state.js` の実装 (appState, elements等)
- `[x]` `src/dist/js/utils/helpers.js` の実装 (ユーティリティ関数群)
- `[x]` `src/dist/js/core/tauri.js` の実装 (Tauri API)
- `[x]` `src/dist/js/core/fileSystem.js` の実装 (保存・読み込みロジック)
- `[x]` `src/dist/js/ui/tabs.js` の実装 (タブ管理UI)
- `[x]` `src/dist/js/ui/editor.js` の実装 (エディタ制御UI)
- `[x]` `src/dist/js/ui/sidebar.js` の実装 (ファイルツリー・コンテキストメニューUI)
- `[x]` `src/dist/js/ui/settings.js` の実装 (設定ダイアログ・フォント・テーマ制御UI)
- `[x]` `src/dist/js/main.js` の実装 (エントリポイント、イベントリスナー登録、初期化処理)
- `[x]` `src/dist/index.html` の更新 (`<script type="module" src="js/main.js"></script>` への変更)
- `[x]` 旧 `src/dist/main.js` の削除
- `[x]` ビルド（`cargo build`）とアプリ起動の検証
