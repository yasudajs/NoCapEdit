# 実装計画書 - 手動保存モードにおける明示的ファイル名のタブ表示への角カッコ適用

## 概要
手動保存モード動作時において、ユーザーが明示的に命名・保存したファイルや外部から開いた既存ファイル（`aaa.nctx` や `memo.txt` 等のタイムスタンプ自動生成に該当しないファイル）について、タブ表示名に角カッコ `[ ]` が付与されていなかった問題を解消し、手動保存モード時は全タブの表示名を角カッコで囲む形式（例: `[aaa]`）へ統一します。

## 変更内容

### 1. 仕様書更新 (`docs/spec.md`)
- 4.3項「タブ管理と自動クリーンアップ」における「明示的な名前のファイル」の規定を更新。
- 手動保存モード時は、拡張子を除去したファイル名を `[ ]` で囲んで表示する旨を明記。

### 2. フロントエンド修正 (`src/dist/js/ui/tabs.js`)
- `formatTabDisplayName(fileName)` 関数内の明示的ファイル名の処理において、`appState.saveMode === 'manual'` の場合に `[${displayName}]` と囲んで返す分岐を追加。

### 3. 既存モジュール・共通処理の活用確認
- `appState.saveMode` の共通状態を参照して条件判定を行います。
- モード切替時（`settings.js` の設定変更時）には既存の `renderTabs()` が呼び出されるため、本修正のみで切り替え時の表示即時更新も自動的に対応されます。

## 修正対象ファイル

- [MODIFY] [spec.md](file:///c:/work/NoCapEdit/docs/spec.md)
- [MODIFY] [Cargo.toml](file:///c:/work/NoCapEdit/Cargo.toml)
- [MODIFY] [tauri.conf.json](file:///c:/work/NoCapEdit/tauri.conf.json)
- [MODIFY] [installer.nsi](file:///c:/work/NoCapEdit/nsis/installer.nsi)
- [MODIFY] [DEVELOPMENT.md](file:///c:/work/NoCapEdit/docs/DEVELOPMENT.md)
- [MODIFY] [tabs.js](file:///c:/work/NoCapEdit/src/dist/js/ui/tabs.js) (※実装承認後に修正)

## テスト・検証計画

### 自動テスト / コンパイルチェック
- `cargo build` が正常に成功すること。

### 手動テスト
1. **既存ファイルのオープン**:
   - 手動保存モード時、既存ファイル（例: `aaa.nctx`）を開いた際に、タブ名が `[aaa]` と表示されること。
   - 自動保存モード時、同ファイルを開いた際に `aaa` と表示されること。
2. **保存モード切り替え時の即時反映**:
   - 設定画面で保存モードを「手動保存」↔「自動保存」へ切り替えた際、既存ファイルタブの表示名が `[aaa]` ↔ `aaa` と即座に更新されること。
