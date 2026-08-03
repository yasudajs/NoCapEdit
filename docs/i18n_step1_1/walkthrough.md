# i18n リファクタリング: Phase 1 (Step 1.1) 完了報告 (Walkthrough)

## 概要
`settings.js` 内にハードコードされていた日本語の文字列を `i18n.js` に抽出し、多言語化関数 `window.t()` を利用して表示するよう修正しました。

## 実装内容
- `src/dist/i18n.js` の `DICT.ja` に以下の階層化されたキーを追加しました。
  - `settings`
  - `status`
  - `tabs`
- `src/dist/js/ui/settings.js` 内で使われていたハードコード文字列を `window.t('...')` に置き換えました。
  - 保存先フォルダのヒント表示 (`settings.folder.hint.*`)
  - ホームフォルダ未指定時のアラート (`settings.alert.home.folder.required`)
  - 未保存タブのラベル生成 (`tabs.unsaved.label`)
  - フォントグループ名の表示 (`settings.font.group.*`)
  - ステータス表示の各種メッセージ (`status.ready`, `status.loading.*`, `status.error.*`)

## 確認・検証結果
- コード上でシンタックスエラーがないことを確認しました。
- 全ての抽出対象文字列が `window.t()` 関数経由で呼び出されるようになりました。

以上で、Step 1.1（`settings.js` の対応）の作業は完了となります。
