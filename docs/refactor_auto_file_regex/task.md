# タスクリスト: 連番ファイル名正規表現の不一致修正と一元化 (1-1)

- [ ] **1. バージョン先行更新およびドキュメント作成**
  - [x] バージョン番号の先行更新 (0.2.33 -> 0.2.34)
  - [x] 実装計画書 (`implementation_plan.md`) および タスクリスト (`task.md`) の作成

- [ ] **2. フロントエンド修正**
  - [ ] `src/dist/js/state.js` の `AUTO_FILE_REGEX` 修正 (`/^\d{8}_\d{6}(_[1-9])?\.nctx$/`)
  - [ ] `src/dist/js/utils/helpers.js` の `AUTO_FILE_REGEX` 重複削除および `state.js` からのインポート化
  - [ ] `src/dist/js/ui/tabs.js` の `formatTabDisplayName` 内正規表現修正

- [ ] **3. 動作検証 (手動テスト)**
  - [ ] 連番ファイル (`yyyymmdd_hhmmss_1.nctx`) を開いた/保存した際に、タブ表示名が `yyyy/mm/dd hh:mm:ss-1` と表示されるか
  - [ ] 手動保存モード時に `[yyyy/mm/dd hh:mm:ss-1]` と表示されるか
  - [ ] 空の連番自動生成ファイル (`yyyymmdd_hhmmss_1.nctx`) のタブを閉じた際にファイルがディスクから自動削除されるか
