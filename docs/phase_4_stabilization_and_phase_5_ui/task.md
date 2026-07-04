# タスクリスト

- `[x]` Phase 4: 保存処理の排他制御の実装
  - `[x]` `main.js` のタブオブジェクト初期化に `isSaving` プロパティを追加
  - `[x]` `saveTabIfDirty` で `isSaving` フラグによる二重保存のロック制御を実装
  - `[x]` `persistTabWithRecovery` の二重呼び出し防止
- `[x]` Phase 5: トースト通知の導入とUI微調整
  - `[x]` `index.html` にトースト用コンテナ（`#toastContainer`）を追加
  - `[x]` `style.css` にトースト通知およびフェードイン・フェードアウトのアニメーションスタイルを追加
  - `[x]` `main.js` に `showToast(message, type)` 関数を実装し、保存完了・失敗時にトーストを表示
  - `[x]` 全体的な Obsidian 風 of UI微調整（フォントやタブ余白など）
- `[x]` 動作検証
  - `[x]` 自動保存、タブ切替時、アプリ終了時の挙動の確認
- `[x]` 追加タスク: トースト通知機能の削除とクリーンアップ
  - `[x]` `main.js` から `showToast` の定義および呼び出し箇所を削除
  - `[x]` `index.html` から `#toastContainer` を削除
  - `[x]` `style.css` からトースト用のCSSスタイルを削除
