# ウォークスルー: Step 1 `replaceAll` の `$` 特殊文字バグ修正 🔴

## 変更概要
検索・置換機能（`findReplace.js`）において、大文字・小文字を区別しない全件置換（`replaceAll`）時に、置換後文字列に含まれる `$` パターン（`$1`, `$&` 等）が JavaScript の正規表現置換パターンとして解釈されて意図せず展開・文字化けする不具合（C-1）を修正しました。

## 変更ファイル
- [`src/dist/js/ui/findReplace.js`](file:///c:/work/NoCapEdit/src/dist/js/ui/findReplace.js)
  - `fullText.replace(regex, replaceText)` を `fullText.replace(regex, () => replaceText)` に変更

## 検証結果
- **テストスクリプト実行**:
  - 対象: `apple banana APPLE orange`
  - 検索: `apple` / 置換: `$&_price_$100`（大文字小文字区別オフ）
  - 結果: `$&_price_$100 banana $&_price_$100 orange`（`$` 記号が展開されずにリテラルとして正確に置換されることを確認）
- **ビルド確認**: `cargo check` 正常完了
