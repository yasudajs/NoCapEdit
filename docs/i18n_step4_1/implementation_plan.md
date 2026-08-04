# [Phase 4] Step 4.1: Rust バックエンドの多言語化対応

## 概要 (Goal Description)
`docs/wip/i18n_refactor/master_plan.md` の Phase 4 / Step 4.1 に基づき、Rust バックエンド（`main.rs`）からフロントエンド（JS）へ返却されるエラーメッセージ文字列を、i18n 用のキー（Error Key）に置換します。
JS側でそのキーを受け取り、画面へ表示する前に翻訳（`window.t`）を通すことで多言語化を実現します。

## User Review Required
以下の修正方針で問題ないでしょうか？
既存の `window.t` 実装は、登録されていない文字列（未知の生エラー等）が渡された場合に「その文字列自体をそのまま返す」という堅牢な仕様になっているため、このキーベースのアプローチが非常にシンプルに実現できます。問題がなければ実装作業へ進みます。

## Proposed Changes

### [MODIFY] [main.rs](file:///c:/work/NoCapEdit/src/main.rs)
フロントエンドへ直接表示される可能性のあるエラー文字列をキーに置換します。
- `next_available_file_path` 関数内: `"同名ファイル回避の上限に達しました"` -> `"fs.error.maxLimitReached"` に変更。
- `save_text_file` 関数内: `"保存先パスが不正です"` -> `"fs.error.invalidPath"` に変更。

### [MODIFY] [i18n.js](file:///c:/work/NoCapEdit/src/dist/i18n.js)
`DICT.ja.fs.error` の配下に、Rustからのエラーキーに対応する日本語文字列を追加します。
- `maxLimitReached`: "同名ファイル回避の上限に達しました"
- `invalidPath`: "保存先パスが不正です"

### [MODIFY] [fileSystem.js](file:///c:/work/NoCapEdit/src/dist/js/core/fileSystem.js)
保存失敗時のエラーダイアログ（`showSaveErrorDialog`）を呼び出している `persistTabWithRecovery` 関数内で、Rust から受け取った `error` 変数をそのまま表示するのではなく、`window.t(error)` を通して翻訳してから表示するように修正します。

## Verification Plan
1. アプリを起動する。
2. （可能であれば）異常なパスを指定するなどして保存エラーを発生させ、表示されるエラーダイアログ内の「理由」部分が、キー文字列（`fs.error.invalidPath`等）ではなく正しく日本語のメッセージとして翻訳されて表示されることを確認する。
