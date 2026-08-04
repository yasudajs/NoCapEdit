# [Phase 2] Step 2.1: `fileSystem.js` の多言語化対応 (i18n)

`docs/wip/i18n_refactor/master_plan.md` の Phase 2 / Step 2.1 に基づき、`src/dist/js/core/fileSystem.js` に存在するハードコードされた日本語文字列を `src/dist/i18n.js` に抽出し、`window.t()` 関数経由で呼び出す仕組みに移行します。

## User Review Required
以下の移行内容（キー名の設計と文字列の定義）についてレビューをお願いします。
問題なければ、実装に進みます。

## Proposed Changes

### i18n.js

`src/dist/i18n.js` の `DICT.ja` 内に、新しく `fs` 階層を追加します。

#### [MODIFY] [i18n.js](file:///c:/work/NoCapEdit/src/dist/i18n.js)

```javascript
        fs: {
            error: {
                noSaveDialog: "別名保存ダイアログを利用できません",
                deleteEmptyFile: "空ファイル削除失敗"
            },
            status: {
                saving: "保存中...",
                saved: "保存済み",
                savedAs: "別名で保存済み",
                saveFailed: "保存失敗",
                aborted: "処理を中止しました",
                created: "{prefix}{fileName} を作成",
                loading: "ファイルを読み込み中...",
                opened: "{fileName} を開きました",
                loadFailed: "ファイル読み込み失敗"
            },
            dialog: {
                saveError: "保存に失敗しました。\n対象: {fileName}\n理由: {error}"
            }
        },
```
※ 既存の `tabs.status.manualSavePrefix` （`"[手動保存:Ctrl+S] "`）はそのまま再利用し、`fs.status.created` の `{prefix}` パラメータに渡す設計とします。

### fileSystem.js

`src/dist/js/core/fileSystem.js` 内の各文字列を `window.t()` を用いた形に書き換えます。

#### [MODIFY] [fileSystem.js](file:///c:/work/NoCapEdit/src/dist/js/core/fileSystem.js)

主な書き換え対象と対応するキー：
- `throw new Error('別名保存ダイアログを利用できません');` -> `window.t('fs.error.noSaveDialog')`
- `updateStatus('別名で保存済み', 'saved');` -> `window.t('fs.status.savedAs')`
- `updateStatus('空ファイル削除失敗', 'error');` -> `window.t('fs.error.deleteEmptyFile')`
- `updateStatus('保存中...', 'saving');` 等 -> `window.t('fs.status.saving')`
- `updateStatus('保存済み', 'saved');` 等 -> `window.t('fs.status.saved')`
- `保存に失敗しました。\n対象: ${tab.fileName}\n理由: ${error}` -> `window.t('fs.dialog.saveError', { fileName: tab.fileName, error: error })`
- `updateStatus('処理を中止しました', 'error');` -> `window.t('fs.status.aborted')`
- `updateStatus(tab.fileName + ' を作成', 'saved');` -> `window.t('fs.status.created', { prefix: '', fileName: tab.fileName })`
- `updateStatus(`${prefix}${tab.fileName} を作成`, 'saved', true);` -> `window.t('fs.status.created', { prefix: prefix, fileName: tab.fileName })`
  （※ ここでの `prefix` は `window.t('tabs.status.manualSavePrefix')` を取得して利用するよう修正）
- `updateTabStatus(tab, '保存失敗', 'error');` -> `window.t('fs.status.saveFailed')`
- `updateStatus('ファイルを読み込み中...', 'saving');` -> `window.t('fs.status.loading')`
- `updateStatus(tab.fileName + ' を開きました', 'saved');` -> `window.t('fs.status.opened', { fileName: tab.fileName })`
- `updateStatus('ファイル読み込み失敗', 'error');` -> `window.t('fs.status.loadFailed')`

## Verification Plan

### Manual Verification
以下の操作を行い、ステータスバーやダイアログに意図した日本語メッセージが正しく表示されることを確認します。
1. アプリを起動し、新規ファイルに文字を入力して少し待つ（自動保存をトリガー）。ステータスバーに「{ファイル名} を作成」「保存中...」「保存済み」が表示されるか。
2. `Ctrl+S` を押して手動保存する。ステータスバーに「[手動保存:Ctrl+S] {ファイル名} を作成」（または保存済み）が表示されるか。
3. エクスプローラー等から既存のファイルを読み込ませる。ステータスバーに「ファイルを読み込み中...」「{ファイル名} を開きました」が表示されるか。
4. ファイルを開いている状態で、ファイルを外部から削除してから保存させ、保存エラーダイアログ（保存に失敗しました...）が表示されるか。
5. エラーダイアログで「キャンセル」を押し、「処理を中止しました」が表示されるか。
