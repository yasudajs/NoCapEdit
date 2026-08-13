# `AUTO_FILE_REGEX` 重複定義の修正計画

リファクタリングレビューで指摘された「3. `helpers.js` と `state.js` で `AUTO_FILE_REGEX` が重複定義」を修正します。
定数管理の集約化と状態管理モジュールの責務明確化のため、`state.js` 側にある不要な定数定義を削除します。

## User Review Required

以下の修正方針をご確認ください。

## Proposed Changes

### Frontend JS

#### [MODIFY] [state.js](file:///c:/work/NoCapEdit/src/dist/js/state.js)
`state.js` の8行目付近にある `AUTO_FILE_REGEX` のエクスポート宣言を削除します。
（コード全体を検索した結果、この定数は `state.js` 内や他のモジュールから `state.js` 経由でインポートされて使用されている箇所はなく、安全に削除可能であることを確認済みです。実際の使用は `helpers.js` 内で行われています。）

```diff
- export const AUTO_FILE_REGEX = /^\d{8}_\d{6}(_\d{2})?\.nctx$/;
```

## Verification Plan

### Automated Tests
- フロントエンドJSのためビルドエラーの直接的なチェックはありませんが、ESモジュールのロードエラーが発生しないことを手動確認で担保します。

### Manual Verification
- アプリを起動し、正常に画面が立ち上がること、および「未保存」タブが正しく動作すること（正規表現関連のロジックが壊れていないこと）を確認します。
