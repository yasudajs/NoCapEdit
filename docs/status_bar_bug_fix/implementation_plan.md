# 実装計画書: ステータスバーのファイル状態表示バグ修正

左下のステータスバーにおける、新規空ファイル保存時の誤表示、およびタブを閉じた際のステータス不一致バグを修正します。

## Proposed Changes

### フロントエンド

#### [MODIFY] [main.js](file:///c:/work/NoCapEdit/src/dist/main.js)
- **`saveTabIfDirty(tab)`**:
  - 戻り値として、実際にファイル保存処理を実行したか（`boolean`）を返すように変更します。
  - 空ファイルスキップや、dirtyでない等の理由で保存を実行しなかった場合は `false`、保存が成功した場合は `true` を返します。
- **`triggerManualSave()`**:
  - `saveTabIfDirty` の戻り値（`saved`）をチェックします。
  - `saved === true` の場合のみ「〜を作成」または「保存済み」のステータスに更新し、`false`（保存スキップ）の場合は `updateTabStatus(tab)` を呼んでステータスを現在のタブ状態（新規空ファイルなら「保存準備完了」等）に戻します。
- **`autoSave()`**:
  - `saveTabIfDirty` の戻り値が `true` の場合のみ「〜を作成」または「保存済み」を表示し、`false` の場合は `updateTabStatus(tab)` を呼んでステータスを現在のタブ状態に戻します。
- **`closeTab(tabId)`**:
  - アクティブなタブを閉じた際の別タブへの切り替えで、`appState.currentTab = appState.tabs[0].id` による直接代入を `await switchTab(appState.tabs[0].id)` の呼び出しに変更します。これでタブ切り替えに伴うステータスの復元処理が正しく走るようになります。

### バージョン管理ファイル (0.1.34 -> 0.1.35)
※すでに更新済みです。
#### [MODIFY] [Cargo.toml](file:///c:/work/NoCapEdit/Cargo.toml)
- `version` を `"0.1.35"` に更新。
#### [MODIFY] [tauri.conf.json](file:///c:/work/NoCapEdit/tauri.conf.json)
- `package.version` を `"0.1.35"` に更新。
#### [MODIFY] [installer.nsi](file:///c:/work/NoCapEdit/nsis/installer.nsi)
- `VERSION` を `"0.1.35"`、`VERSIONWITHBUILD` を `"0.1.35.0"` に更新。
#### [MODIFY] [DEVELOPMENT.md](file:///c:/work/NoCapEdit/docs/DEVELOPMENT.md)
- ポータブル版ビルド例のZIPファイル名のバージョンを `"0.1.35"` に更新。

## Verification Plan

### Automated Tests
- アプリケーションが正常にビルドできることを確認します。
  - `cargo build`

### Manual Verification
- アプリを起動し、以下の手順を実行してバグが修正されていることを検証します。
  1. 新規ウィンドウを開き、未入力状態で `Ctrl+S` を押す。
     - **期待される挙動**: ステータスは「保存準備完了」のままであり、ファイルは作成されないこと（「未保存1 を作成」と表示されない）。
  2. 手順1の状態から、既存の `.nctx` ファイルを開く。
     - **期待される挙動**: ステータスが「[開いたファイル名] を開きました」と更新されること。
  3. 手順2の状態から、開いたファイルのタブを閉じる。
     - **期待される挙動**: 自動的に「未保存1」タブがアクティブになり、ステータスも「保存準備完了」に同期すること（閉じたファイルの状態が残らない）。
  4. 新規タブで文字を入力した後に `Ctrl+S` を押す、または自動保存される。
     - **期待される挙動**: 実際にファイルが作成され、ステータスに「[作成されたファイル名] を作成」と表示されること。
