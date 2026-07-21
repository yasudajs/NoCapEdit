# タスクリスト: 連番ファイル名正規表現の不一致修正・一元化および手動保存ロジックの共通化 (1-1, 1-2)

- [x] **1. バージョン先行更新およびドキュメント作成**
  - [x] バージョン番号の先行更新 (0.2.33 -> 0.2.34)
  - [x] 実装計画書 (`implementation_plan.md`) および タスクリスト (`task.md`) の作成・更新

- [x] **2. フロントエンド修正**
  - [x] `src/dist/js/state.js` の `AUTO_FILE_REGEX` 修正 (`/^\d{8}_\d{6}(_[1-9])?\.nctx$/`)
  - [x] `src/dist/js/utils/helpers.js` の `AUTO_FILE_REGEX` 重複削除および `state.js` からのインポート化
  - [x] `src/dist/js/ui/tabs.js` の `formatTabDisplayName` 内正規表現修正
  - [x] `src/dist/js/core/fileSystem.js` の `triggerManualSave()` リファクタリング (`saveTabIfDirty` への集約)

- [x] **3. 動作検証 (手動テスト)**
  - [x] 連番ファイル (`yyyymmdd_hhmmss_1.nctx`) を開いた/保存した際に、タブ表示名が `yyyy/mm/dd hh:mm:ss-1` と表示されるか
  - [x] 手動保存モード時に連番ファイルが `[yyyy/mm/dd hh:mm:ss-1]` と表示されるか
  - [x] 手動保存モードで `Ctrl+S` 実行時、同名ファイル衝突時に連番 (`_1`等) で安全に別名保存されるか
  - [x] 手動保存モードで保存済みファイルに追記・編集して `Ctrl+S` 実行時、既存ファイルに正常に上書き保存されるか
  - [x] 空の連番自動生成ファイル (`yyyymmdd_hhmmss_1.nctx`) のタブを閉じた際にファイルがディスクから自動削除されるか
