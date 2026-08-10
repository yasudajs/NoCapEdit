# [リファクタリング] ステップ 3.2：設定管理（永続化）ロジックの抽出

本計画は、「リファクタリングマスタープラン」のフェーズ3のステップ3.2「設定管理（永続化）ロジックの抽出」を実施するための実装計画です。

現在 `src/dist/js/ui/settings.js` は、「設定画面（UI）の制御」だけでなく「アプリ全体の設定値の保存（Rustバックエンドとの通信）」という2つの責務を抱えています。これが将来的に他のUIモジュール（テーマ管理やエディタ管理など）と循環参照を引き起こす原因となっています。
そこで、設定の永続化管理のみを専門に行う `core/settingsManager.js` を新設し、依存関係を一方通行（各UI層 → Core層）に整理する基盤を作ります。

## ユーザー承認必須事項

> [!IMPORTANT]
> - 本ステップではテーマやフォントのUI適用ロジックはまだ移動しません。純粋に「設定をファイルに保存する」機能の基盤抽出のみを行います。
> - この基盤が安定していることを確認した上で、次のステップ 3.3（テーマ分離）へ進みます。
> 
> 本計画の内容に問題がないかご確認いただき、承認の指示（「作業開始」等）をお願いいたします。

## 提案する変更内容

### 設定管理（永続化）ロジックの分離

#### [NEW] [`src/dist/js/core/settingsManager.js`](file:///c:/work/NoCapEdit/src/dist/js/core/settingsManager.js)
新規ファイルを作成し、設定の保存を担う以下の関数を集約します。
- `saveSettings()`
- `saveApplicationSettings()`
- `saveSettingsDelay()`
※ 依存モジュール (`appState`, `invoke`, `updateStatus` など) をインポートします。
※ 必要に応じて、将来の拡張のために `loadSettings()`（現在 `main.js` 内に直書きされている設定読み込み処理）もここに集約するか検討します（今回は最小限として保存処理の移行に留めることも可能です）。

#### [MODIFY] [`src/dist/js/ui/settings.js`](file:///c:/work/NoCapEdit/src/dist/js/ui/settings.js)
- `saveSettings`, `saveApplicationSettings`, `saveSettingsDelay` の実装を削除します。
- 削除した関数を `../core/settingsManager.js` からインポートするように変更し、イベントハンドラ内での呼び出しはそのまま維持します。

#### [MODIFY] [`src/dist/js/main.js`](file:///c:/work/NoCapEdit/src/dist/js/main.js) & [`src/dist/js/ui/editor.js`](file:///c:/work/NoCapEdit/src/dist/js/ui/editor.js)
- `saveSettings` や `saveSettingsDelay` のインポート元を `./ui/settings.js` から `./core/settingsManager.js` に変更します。

## 検証計画

### 手動検証
本修正適用後、以下の動作確認を実施します。
1. アプリケーションをビルド・起動し、エラーが発生しないこと。
2. 設定ダイアログを開き、何らかの設定（例：保存モードやテーマなど）を変更した際に、正常に設定ファイルに保存されること。
3. アプリを再起動した際に、変更した設定が維持されていること（保存処理が正常にバックエンドに届いていることの確認）。
