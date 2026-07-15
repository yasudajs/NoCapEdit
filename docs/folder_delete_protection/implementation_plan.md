# フォルダ削除時の安全対策（空ではないフォルダの削除制限）

削除機能において、誤操作による大規模なデータ消失を防ぐため、中身（ファイルやサブフォルダ）が含まれるフォルダの削除を一律ブロックする安全対策を導入します。また、削除ブロック時には、中身の確認がスムーズに行えるよう、OSのエクスプローラを直接開く導線を提供します。

## 変更の概要
- **Rustバックエンド (`src/main.rs`)**:
  - `trash_file_or_dir` と `delete_file_or_dir_permanently` にフォルダの「空」判定を追加。
  - ファイル名先頭が `.`（ドット）で始まるファイルや、`Thumbs.db` のみを含むフォルダは「空」とみなし、それ以外のファイルやフォルダを含む場合は `Err("FOLDER_NOT_EMPTY")` を返して削除をブロック。
- **JSフロントエンド (`src/dist/js/ui/sidebar.js` / `src/dist/i18n.js`)**:
  - `i18n.js` に警告メッセージおよびダイアログの日本語テキストを定義。
  - 通常削除・完全削除時のエラーハンドリングを強化し、エラー原因が `FOLDER_NOT_EMPTY` の場合は確認ダイアログを表示して、ユーザーが承諾した際に Tauri の `shell.open` API でフォルダをエクスプローラ表示する。

## User Review Required

> [!IMPORTANT]
> - この安全対策は、通常削除（ゴミ箱移動）と完全削除（Shift+Delete）の両方に一律適用されます。中身があるフォルダはゴミ箱への移動も制限されます。
> - 判定から除外されるのは、ファイル名先頭が `.` から始まるファイル（例: `.DS_Store` や `.gitignore`）および `Thumbs.db`（大文字小文字無視）のみです。それ以外の非表示ファイルや画像・PDFなどが含まれる場合も削除制限の対象となります。

## Open Questions

現在、オープンな疑問点はありません。ディスカッションに基づき、この仕様で進めます。

## Proposed Changes

### Rust Backend

#### [MODIFY] [main.rs](file:///c:/work/NoCapEdit/src/main.rs)
- ディレクトリがカスタムの「空」条件を満たすか判定するヘルパー関数 `is_dir_empty_custom` を追加。
- `trash_file_or_dir` コマンドで、対象がディレクトリの場合に上記ヘルパーを呼び出すよう変更。
- `delete_file_or_dir_permanently` コマンドでも同様に上記ヘルパーによるチェックを追加。
- 空ではないディレクトリに対して削除操作が走った場合、それぞれ `Err("FOLDER_NOT_EMPTY".to_string())` を返すよう実装。

### Frontend

#### [MODIFY] [i18n.js](file:///c:/work/NoCapEdit/src/dist/i18n.js)
- 多言語化（i18n）対応規約に従い、削除エラー時のタイトルおよび本文メッセージの日本語テキストを定義に追加：
  - `folder_delete_error_not_empty_title`: "フォルダ削除エラー"
  - `folder_delete_error_not_empty_msg`: "このフォルダは空ではないため削除できません。\nエクスプローラでフォルダを開いて中身を確認しますか？"

#### [MODIFY] [sidebar.js](file:///c:/work/NoCapEdit/src/dist/js/ui/sidebar.js)
- `deleteItemInTree` 関数および `deleteItemPermanentlyInTree` 関数の `try-catch` エラー処理を更新。
- エラーとして `FOLDER_NOT_EMPTY` が返された場合、以下の制御を追加：
  1. `window.t` を使用して警告文言を取得し、確認ダイアログ（`dialog.ask`）を表示。
  2. ユーザーが「はい」と答えた場合、`window.__TAURI__.shell.open(targetPath)` を用いて対象フォルダをOSのエクスプローラで表示。
- その他のエラーについては従来通りのエラーメッセージ表示を行う。

## Verification Plan

### Automated Tests
- 本プロジェクトには Rust/JS の自動テスト環境がまだ限定的であるため、手動テストにて検証を行います。

### Manual Verification
- テストケース（[task.md](file:///c:/work/NoCapEdit/docs/wip/folder_delete_protection/task.md) にチェックリスト化します）：
  1. 完全な空フォルダの削除（ゴミ箱移動、完全削除）が正常に行えること。
  2. `.DS_Store` や `.gitignore` などのドットファイルのみ、または `Thumbs.db` のみが存在するフォルダの削除が正常に行えること。
  3. テキストファイル（`.txt` 等）や画像ファイル（`.png` 等）が入っているフォルダの削除がブロックされ、警告ダイアログが表示されること。
  4. 空ではないフォルダ内に別のフォルダ（サブフォルダ）が1つあるだけでも削除がブロックされること。
  5. 警告ダイアログで「はい」を選択した際、対象フォルダがOSのエクスプローラで正しく開くこと。「いいえ」では何も起きないこと。
