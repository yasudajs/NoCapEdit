# [リファクタリング] ステップ 4.1：ショートカットキー処理の抽出 ウォークスルー

## 実装内容
リファクタリングマスタープランの「ステップ 4.1」に基づき、`main.js` に直接記述されていたグローバルなショートカット処理を分離しました。

- **バージョン更新**: `0.1.57` から `0.1.58` へバージョンアップしました (`Cargo.toml`, `tauri.conf.json`, `installer.nsi`)。
- **ショートカットモジュールの新設**: `src/dist/js/ui/shortcuts.js` を新規作成し、`setupKeyboardShortcuts` 関数を定義しました。
  - `window` に対する `wheel` イベント（Ctrl+ホイールでの拡大縮小等）と、`keydown` イベント（Ctrl+Tab, F5禁止, 拡大縮小等）の処理をそのまま移動しました。
- **既存ファイルの整理**:
  - `src/dist/js/main.js` から上記のイベントリスナー登録処理を削除し、代わりに `setupKeyboardShortcuts();` を呼び出すように変更しました。
  - 不要になったインポート（`switchTabByOffset`, `triggerManualSave` など）を `main.js` から削除し、依存関係を整理しました。

## 動作確認結果
- Rustビルド（`cargo check`）が正常に完了しました。
- `main.js` の肥大化が改善され、ショートカットに関するロジックが `shortcuts.js` に一元管理されるようになりました。これにより、今後のショートカットキーの追加・変更が容易になります。
