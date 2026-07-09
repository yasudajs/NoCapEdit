# 自動アップデートチェック機能の実装計画

## Goal

NoCapEdit の起動時にバックグラウンドで最新バージョンがリリースされているかをチェックし、新しいバージョンが存在する場合にのみ、タイトルバーおよび設定画面に控えめな通知を表示する機能を実装します。
これにより、ユーザーの作業や起動速度を妨げることなく、最新版の存在を知らせることができます。

## User Review Required

> [!NOTE]
> アプリ起動時のネットワークアクセスについて
> 本機能の実装により、アプリ起動時に `api.github.com` への通信が発生します。
> これによりセキュリティソフトやファイアウォールで通信確認のプロンプトが出る可能性がありますが、GitHub の公開APIに対するリードオンリーのリクエストであるため安全です。

## Proposed Changes

### フロントエンドロジック (JavaScript)

#### [MODIFY] [main.js](file:///c:/work/NoCapEdit/src/dist/main.js)
- `checkNewVersion(currentVersion)` 関数の追加
  - アプリ起動処理の完了から約3秒後に実行される非同期関数。
  - GitHub API (`https://api.github.com/repos/yasudajs/NoCapEdit/releases/latest`) を fetch で呼び出す。
  - エラー発生時は `try...catch` で握りつぶし、何もしない。
  - バージョンが異なる場合、以下を実行：
    1. `document.title` に `(Update: vX.Y.Z)` を追記する。
    2. 後述のHTML通知コンテナのテキストおよびリンクURLを更新し、表示状態にする。
- 初期化関数 (`init`) の最後に `checkNewVersion` を呼び出す処理を追記。

### フロントエンドUI (HTML/CSS)

#### [MODIFY] [index.html](file:///c:/work/NoCapEdit/src/dist/index.html)
- `#settingsDialog` の `.dialog-content` 先頭に、アップデート通知用のコンテナを追加する。
- デフォルトでは `hidden` クラスを付与して非表示とする。
- 構造例：
  ```html
  <div id="updateNoticeContainer" class="update-notice hidden">
      <p>アップデート可能です Ver. <span id="currentVerSpan"></span> → Ver. <span id="latestVerSpan"></span></p>
      <a href="#" id="releaseLink">リリースノートを開く</a>
  </div>
  ```

#### [MODIFY] [style.css](file:///c:/work/NoCapEdit/src/dist/style.css)
- 追加した通知コンテナ `.update-notice` 用のスタイル（余白、背景色、ボーダー等）を定義する。
  - 既存のデザインテーマ（ダーク・ライト）に馴染みつつ、控えめに目立つ配色とする。

### バックエンド/設定

#### [MODIFY] [tauri.conf.json](file:///c:/work/NoCapEdit/tauri.conf.json)
- （確認のみ）現在 `shell.open` は `true` となっており、追加設定なしで外部ブラウザでのURLオープンが可能です。変更は不要です。

## Verification Plan

### Manual Verification
- **動作確認**:
  1. 一時的に `main.js` 内での現在のバージョン（`settings.app_version` 等）を `0.0.1` などの古いバージョンに書き換えて実行する。
  2. アプリ起動後、約3秒待つ。
  3. タイトルバーに `(Update: v0.1.x)` が表示されることを確認する。
  4. 設定アイコンをクリックし、最上段に通知メッセージとリンクが表示されることを確認する。
  5. リンクをクリックすると、システムの標準ブラウザで対象バージョンのGitHubリリース画面が開くことを確認する。
- **ネットワークエラー確認**:
  - インターネット接続を切断した状態で起動し、アプリの挙動がブロックされないこと、エラーダイアログが出ないことを確認する。
