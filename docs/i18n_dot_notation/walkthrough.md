# i18n ドット区切り（階層キー）対応 ウォークスルー

## 概要
`src/dist/i18n.js` における多言語キーの管理形式をスネークケース単一文字列からドット区切り階層構造オブジェクトに変更し、`t()` 関数でドット区切りのキー（例: `'folder.delete.error_not_empty_title'`）を展開して参照できるように改修しました。

## 変更内容

### 1. `src/dist/i18n.js`
- **辞書データ構造**: `DICT.ja` をネストオブジェクト形式に修正。
  ```js
  folder: {
      delete: {
          error_not_empty_title: "フォルダ削除エラー",
          error_not_empty_msg: "このフォルダは空ではないため削除できません。\nエクスプローラでフォルダを開いて中身を確認しますか？",
      }
  }
  ```
- **`window.t(key)` 関数**: キー文字列を `.` で分割し、辞書オブジェクトの階層をたどって安全に値を取り出す処理を追加。未定義キーの場合はフォールバックとしてキー名をそのまま返却。

---

## 検証結果

Node.js 環境での単体テストにより以下を確認しました：
1. `window.t('folder.delete.error_not_empty_title')` ➔ `"フォルダ削除エラー"`
2. `window.t('folder.delete.error_not_empty_msg')` ➔ `"このフォルダは空ではないため削除できません。\n..."`
3. `window.t('unknown.key')`（未登録キー） ➔ `"unknown.key"`（フォールバック動作）
