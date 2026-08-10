# [リファクタリング] ステップ 3.1：アップデートチェックロジックの抽出

本計画は、「リファクタリングマスタープラン」のフェーズ3のステップ3.1「アップデートチェックロジックの抽出」を実施するための実装計画です。

現在、`src/dist/js/ui/settings.js` に実装されている `checkNewVersion` 関数と、それに付随するGitHub APIからのリリース情報取得およびバージョン比較のロジックを、新設するモジュールに移動させることで、設定画面のUI制御の責務とアップデート通知の責務を分離します。

## ユーザー承認必須事項

> [!IMPORTANT]
> 既存の動作（タイトルバーへの更新通知、メイン画面下部のアップデート通知リンクの表示）を維持したまま、単にコードの配置を移動するリファクタリングとなります。
> 本計画の内容に問題がないかご確認いただき、承認の指示（「作業開始」等）をお願いいたします。

## Open Questions

特になし（既存コードの単純移動であるため）。

## 提案する変更内容

### アップデート管理ロジックの分離

#### [NEW] [`src/dist/js/core/updater.js`](file:///c:/work/NoCapEdit/src/dist/js/core/updater.js)
新規ファイルを作成し、アップデートチェック機能を集約します。
- 依存関係のインポート追加: `appWindow` (`./tauri.js` から) および `compareVersions` (`../utils/helpers.js` から)
- `checkNewVersion` 関数の実装を `settings.js` から移動し、エクスポートします。

#### [MODIFY] [`src/dist/js/ui/settings.js`](file:///c:/work/NoCapEdit/src/dist/js/ui/settings.js)
- `checkNewVersion` 関数の実装を削除します。
- エクスポートリストから `checkNewVersion` を取り除きます。

#### [MODIFY] [`src/dist/js/main.js`](file:///c:/work/NoCapEdit/src/dist/js/main.js)
- `checkNewVersion` のインポート元を `./ui/settings.js` から `./core/updater.js` に変更します。

## 検証計画

### 手動検証
本修正適用後、以下の動作確認を実施します。
1. アプリケーションをビルド・起動し、エラー（Consoleのエラー）が発生しないこと。
2. 起動時に裏側で GitHub API への通信 (`https://api.github.com/repos/yasudajs/NoCapEdit/releases`) が正常に行われていること。
3. （必要に応じて、現在バージョンを仮に古いバージョンにしてビルドし）アップデート通知が正常に表示されるか、またタイトルバーに新しいバージョン情報が反映されるかを確認します。
