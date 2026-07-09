# アップデート通知のバージョン比較修正

GitHubから取得した最新のリリースバージョンと現在のバージョンの比較が単純な不一致（`!==`）で行われているため、ローカルのバージョンの方が新しい場合にもアップデート通知が表示されてしまう問題を修正します。

## 修正内容

### src/dist/main.js

- [MODIFY] [main.js](file:///c:/work/NoCapEdit/src/dist/main.js)
  - セマンティックバージョニングの大小比較を行う関数 `compareVersions` を追加する。
  - `checkNewVersion` 関数内の `if (latestVersion !== currentVersion)` を `if (compareVersions(latestVersion, currentVersion) > 0)` に変更する。

## 確認計画

### 手動確認
- 修正コードを適用した状態でアプリを起動し、公開バージョン（`0.1.18`）よりも新しいローカルバージョン（`0.1.19`）の場合にアップデート通知が表示されないことを確認する。
