# 実装計画書: Step 1 `replaceAll` の `$` 特殊文字バグ修正 🔴

## 概要
検索・置換機能（`findReplace.js`）において、大文字・小文字を区別しない全件置換（`replaceAll`）を実行した際、置換後文字列に含まれる `$` 記号（`$1`, `$&`, `$'` 等）が JavaScript の `String.prototype.replace` の特殊パターンとして解釈されてしまい、置換後の文字列が意図せず破損・文字化けする不具合（C-1）を修正します。

## 対象ファイル
- [`src/dist/js/ui/findReplace.js`](file:///c:/work/NoCapEdit/src/dist/js/ui/findReplace.js)

## 修正内容の詳細

### [MODIFY] [findReplace.js](file:///c:/work/NoCapEdit/src/dist/js/ui/findReplace.js)
`replaceAll` 関数内の正規表現による全件置換処理において、第2引数に置換後文字列をそのまま渡すのではなく、置換文字列を返すアロー関数 `() => replaceText` を渡すように変更します。これにより、置換文字列内の `$` パターン展開を無効化し、ユーザーが入力したリテラル文字列がそのまま置換されます。

```diff
     let newFullText;
     if (isMatchCase) {
         newFullText = fullText.split(query).join(replaceText);
     } else {
         const regex = new RegExp(escapeRegExp(query), 'gi');
-        newFullText = fullText.replace(regex, replaceText);
+        newFullText = fullText.replace(regex, () => replaceText);
     }
```

## 動作確認・検証計画

### 1. `$` 特殊パターンの置換検証
- テキストエリアに `apple banana APPLE orange` を入力
- 検索文字列: `apple`、置換文字列: `$&_price_$100`（大文字小文字区別オフ）
- 「すべて置換」を実行
- **期待結果**: `$100` や `$&` が展開・化けることなく、`$&_price_$100 banana $&_price_$100 orange` に正確に置換されること

### 2. 通常文字列の全件置換検証
- 検索文字列: `banana`、置換文字列: `grape`（大文字小文字区別オフ）
- 「すべて置換」を実行
- **期待結果**: 正常に置換されること

### 3. 大文字小文字区別あり（`isMatchCase` オン）の検証
- 大文字小文字区別ボタンをオンにし、「すべて置換」が従来通り正常に動作することを確認

### 4. Undo / Redo の連動確認
- 「すべて置換」後に `Ctrl+Z` で置換前の状態に戻り、`Ctrl+Y` で再度置換状態になることを確認
