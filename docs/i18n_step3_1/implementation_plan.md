# [Phase 3] Step 3.1: `main.js` の多言語化対応

## 概要 (Goal Description)
`docs/wip/i18n_refactor/master_plan.md` の Phase 3 / Step 3.1 に基づき、`src/dist/js/main.js` 内にハードコードされている日本語文字列を抽出し、`i18n.js`（`window.t()`）経由での呼び出しに置き換えます。

## User Review Required
以下の設計で進めてよろしいでしょうか？問題がなければ作業用ブランチにて実装作業を開始します。

## Proposed Changes

### [MODIFY] [i18n.js](file:///c:/work/NoCapEdit/src/dist/i18n.js)
`DICT.ja` 内に新たに `main` セクションを追加し、以下のエラーメッセージキーを定義します。

```javascript
        main: {
            error: {
                exitFailed: "終了処理失敗",
                initFailed: "初期化エラー: {error}"
            }
        },
```
※ 「準備完了」という文字列はすでに `status.ready` として登録されているため、そちらを再利用します。

### [MODIFY] [main.js](file:///c:/work/NoCapEdit/src/dist/js/main.js)
UI（ステータスバー等）に表示される以下の文言を `window.t()` 呼び出しに置き換えます。

- 36行目付近
  - 変更前: `updateStatus('終了処理失敗', 'error');`
  - 変更後: `updateStatus(window.t('main.error.exitFailed'), 'error');`
- 126行目付近
  - 変更前: `updateStatus('準備完了');`
  - 変更後: `updateStatus(window.t('status.ready'));`
- 143行目付近
  - 変更前: `updateStatus(\`初期化エラー: ${error.message || error}\`, 'error');`
  - 変更後: `updateStatus(window.t('main.error.initFailed', { error: error.message || error }), 'error');`

## Verification Plan
1. アプリを起動し、起動完了時にステータスバーに「準備完了」と表示されることを確認する。
2. （可能であれば）意図的にエラーを発生させ、「初期化エラー」や「終了処理失敗」が正しく i18n のテキストで表示されるかを確認する。
