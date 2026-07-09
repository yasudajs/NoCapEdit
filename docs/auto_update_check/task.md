# Task List: 自動アップデートチェック機能の実装

- [x] `main.js` へのロジック追加
  - [x] GitHub API を呼び出して最新バージョンを取得する非同期関数 `checkNewVersion` を作成
  - [x] 取得エラー時のハンドリング (何も通知しない) の実装
  - [x] バージョン比較ロジックの実装
  - [x] `document.title` の更新処理
- [x] `index.html` の更新
  - [x] `#settingsDialog` 内にアップデート通知用のコンテナ (`.update-notice`) を追加
  - [x] コンテナは初期状態で `hidden` クラスを設定
- [x] `style.css` の更新
  - [x] `.update-notice` 用のスタイルを追加
- [x] `main.js` とUIの連携
  - [x] `checkNewVersion` 内で、新バージョンがある場合に通知コンテナを表示状態にする
  - [x] リンク先URLとバージョンテキストを動的にセットする処理を追加
  - [x] リンククリック時に `window.__TAURI__.shell.open` を呼び出すイベントリスナーを登録
- [x] テスト・動作確認
  - [x] 手動でバージョンを古くして通知が出るか確認する
  - [x] オフラインで起動した時、通知が出ないことを確認する
  - [x] リンクが外部ブラウザで開くか確認する
