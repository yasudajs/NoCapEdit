# i18n リファクタリング Step 4.1 ウォークスルー

## 概要
`docs/wip/i18n_refactor/master_plan.md` の Phase 4 / Step 4.1 に基づき、Rust バックエンド（`main.rs`）から返却されるハードコードされた日本語エラーメッセージを i18n キーに置換し、JS 側で翻訳して表示する対応を行いました。

## 実施内容

### 1. `main.rs` の修正
Rust 側から返される以下の2つのエラーメッセージをキー文字列に置換しました。
- `next_available_file_path` 内: `"同名ファイル回避の上限に達しました"` -> `"fs.error.maxLimitReached"`
- `save_text_file` 内: `"保存先パスが不正です"` -> `"fs.error.invalidPath"`

### 2. `i18n.js` の修正
`DICT.ja.fs.error` の配下に上記のキーを追加し、対応する日本語テキストを定義しました。
- `maxLimitReached: "同名ファイル回避の上限に達しました"`
- `invalidPath: "保存先パスが不正です"`

### 3. `fileSystem.js` の修正
保存失敗時のエラーダイアログ（`showSaveErrorDialog`）を呼び出している `persistTabWithRecovery` 関数内で、Rust から受け取った `error` 変数をそのまま表示するのではなく、`window.t(error)` を通すように修正しました。
これにより、未知のエラーメッセージはそのまま表示され、今回置換したエラーキーは日本語に翻訳されて表示されるようになります。

### 4. 進捗とバージョンの更新
- `docs/wip/i18n_refactor/master_plan.md` において、Step 4.1 のチェックボックスを完了（`[x]`）に更新しました。
- 各バージョン管理ファイル（`Cargo.toml`, `tauri.conf.json`, `installer.nsi`, `DEVELOPMENT.md`）のバージョンを `0.1.48` へインクリメントしました。
- `docs/history.md` に Ver 0.1.48 のリリースノートを追記しました。

## 検証項目（Manual Verification）
- [ ] アプリを起動し、テキストを入力して意図的に保存失敗（例えば、存在しない不正なドライブパスを設定で指定して保存するなど）を発生させる。
- [ ] エラーダイアログが表示され、エラー理由として「保存先パスが不正です」などの日本語が正しく表示されることを確認する。
