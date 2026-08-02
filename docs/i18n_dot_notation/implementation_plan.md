# i18n ドット区切り（階層キー）対応 実装計画書

`src/dist/i18n.js` における多言語キーの表現方針をスネークケース単一文字列からドット区切り（`category.subcategory.key`）のネスト（階層）構造オブジェクト形式に変更し、`t()` 関数でドット記述キーを展開・参照できるように改修します。

## ユーザーレビュー要求事項

> [!NOTE]
> 現在 `i18n.js` 内に定義されている既存キーサンプル `folder_delete_error_not_empty_title` 等を、ドット区切りの `folder.delete.error_not_empty_title` 等に再構成します。

## 変更内容

### `src/dist/i18n.js`
#### [MODIFY] [i18n.js](file:///c:/work/NoCapEdit/src/dist/i18n.js)
1. **辞書構造のネスト化**:
   `DICT` 内の定義をモジュール・機能ごとに階層オブジェクト構造に再構成します。
   ```js
   const DICT = {
       ja: {
           folder: {
               delete: {
                   error_not_empty_title: "フォルダ削除エラー",
                   error_not_empty_msg: "このフォルダは空ではないため削除できません。\nエクスプローラでフォルダを開いて中身を確認しますか？",
               }
           }
       }
   };
   ```

2. **`t()` 関数のドット区切り探索対応**:
   文字列キー（例: `'folder.delete.error_not_empty_title'`）を受け取った際、`.` で分割してオブジェクトを階層的にたどる処理を追加します。キーが存在しない場合や未定義の場合はキー文字列そのものをフォールバックとして返します。
   ```js
   window.t = function(key) {
       if (!key || typeof key !== 'string') return key;
       const keys = key.split('.');
       let current = DICT[currentLang];
       for (const k of keys) {
           if (current && typeof current === 'object' && k in current) {
               current = current[k];
           } else {
               return key;
           }
       }
       return typeof current === 'string' ? current : key;
   };
   ```

---

## 検証計画

### 自動テスト / 動作確認
- 開発サーバー `npm run dev` またはビルド検証にて `i18n.js` が正常にロードされることを確認。
- ブラウザコンソールまたは `t()` 呼び出しテストにて以下の確認を行う：
  1. `t('folder.delete.error_not_empty_title')` → `"フォルダ削除エラー"` が取得できること。
  2. `t('folder.delete.error_not_empty_msg')` → メッセージ文字列が取得できること。
  3. 存在しないキー `t('non.existent.key')` → `"non.existent.key"` が返ること。
