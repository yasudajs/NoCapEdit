# `updater.js` のDOM操作分離に関する修正計画

リファクタリングレビューで指摘された「8. `updater.js` が直接DOMを操作」を修正します。
コアロジック層に位置する `updater.js` が `document.getElementById` や `document.title` を用いて直接UIを書き換えているため、関心の分離（Separation of Concerns）が不十分です。DOM操作を UI 層に移動し、`updater.js` は更新情報の取得と判定のみに専念させます。

## User Review Required

以下の修正方針をご確認ください。

## Proposed Changes

### Frontend JS

#### [MODIFY] [state.js](file:///c:/work/NoCapEdit/src/dist/js/state.js)
`elements` オブジェクトに以下の4プロパティを追加し、`initElements()` でキャッシュを行うよう修正します。
- `updateNoticeContainer`
- `currentVerSpan`
- `latestVerSpan`
- `releaseLink`

#### [NEW] [updaterUI.js](file:///c:/work/NoCapEdit/src/dist/js/ui/updaterUI.js)
UI層の新規モジュールとして `src/dist/js/ui/updaterUI.js` を作成し、`showUpdateNotice` 関数を定義します。
この関数は、アップデートが見つかった際の `document.title` 変更やウィンドウタイトルの更新、通知バナーの表示、およびリンクのイベントハンドラ登録を引き受けます。

#### [MODIFY] [updater.js](file:///c:/work/NoCapEdit/src/dist/js/core/updater.js)
DOM操作に関する記述を削除し、代わりに `ui/updaterUI.js` から `showUpdateNotice` をインポートして呼び出すように変更します。

```javascript
import { showUpdateNotice } from '../ui/updaterUI.js';
...
if (compareVersions(latestVersion, currentVersion) > 0) {
    showUpdateNotice(currentVersion, latestTag, latestVersion);
}
```

## Verification Plan

### Automated Tests
- なし（フロントエンドJSのリファクタリング）

### Manual Verification
- 意図的に古いバージョン番号を引数として渡すなどしてアップデート通知をトリガーし、画面上部にアップデート通知バナーが正常に表示されること、およびリンクをクリックしてブラウザでリリースページが開くことを確認します。
