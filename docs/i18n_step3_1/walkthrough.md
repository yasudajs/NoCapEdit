# i18n リファクタリング Step 3.1 ウォークスルー

## 概要
`docs/wip/i18n_refactor/master_plan.md` の Phase 3 / Step 3.1 に基づき、`src/dist/js/main.js` 内にハードコードされていた初期化・終了エラーやステータス通知メッセージなどの日本語文字列を抽出し、多言語化関数（`window.t()`）経由での呼び出しに置き換えました。

## 実施内容

### 1. `i18n.js` へのキー追加
`DICT.ja` 内に新たに `main` セクションを追加し、以下のエラー用キーを定義しました。
- `main.error.exitFailed`: "終了処理失敗"
- `main.error.initFailed`: "初期化エラー: {error}"

### 2. `main.js` の置き換え
ステータスバー等にメッセージを出力する `updateStatus` 関数呼び出し内の文字列を、`window.t()` の呼び出しに置き換えました。
- `updateStatus('終了処理失敗', 'error')` -> `updateStatus(window.t('main.error.exitFailed'), 'error')`
- `updateStatus('準備完了')` -> `updateStatus(window.t('status.ready'))` （※既存のキーを再利用）
- `updateStatus(\`初期化エラー: ${...}\`, 'error')` -> `updateStatus(window.t('main.error.initFailed', { error: ... }), 'error')`

### 3. 進捗とバージョンの更新
- `docs/wip/i18n_refactor/master_plan.md` において、Step 3.1 のチェックボックスを完了（`[x]`）に更新しました。
- 各バージョン管理ファイル（`Cargo.toml`, `tauri.conf.json`, `installer.nsi`, `DEVELOPMENT.md`）のバージョンを `0.1.46` へインクリメントしました。
- `docs/history.md` に Ver 0.1.46 のリリースノートを追記しました。

## 検証項目（Manual Verification）
- [ ] アプリを起動し、起動完了時にステータスバーに「準備完了」と表示されることを確認する。
- [ ] （可能であれば）意図的に初期化・終了エラーを発生させ、正しいメッセージが表示されるかを確認する。
