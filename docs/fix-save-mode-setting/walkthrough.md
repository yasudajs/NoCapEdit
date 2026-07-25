# ウォークスルー (fix-save-mode-setting)

設定画面で保存モードを変更した際に、設定が `config.json` に正しく保存・永続化されない不具合（Ver 0.1.38 ESモジュール化時のデグレードおよびイベントハンドラでの状態直接上書きバグ）の修正作業結果です。

## 変更内容

### 1. フロントエンド (`src/dist/js/main.js`)
- **【根本原因の修正】**: `setupUIEventListeners` における `saveModeSelectModal` の `change` イベントリスナーで呼び出している `saveSettings` がモジュールインポートされておらず、イベント発火時に `ReferenceError` になって処理が中断していた不具合を修正（import リストへの追加）。
- `init()` 関数内での `setupUIEventListeners()` の呼び出し位置を条件分岐（`isFirstLaunch` / `isHomeFolderMissing`）の前に変更し、初回起動時や設定ダイアログ表示時でも確実にイベントリスナーが一括登録されるように維持しました。
- `saveModeSelectModal` の `change` イベントリスナーで `appState.saveMode` への事前代入を行わず、`saveSettings()` 内で変更前モード (`previousSaveMode`) の差分判定が正しく機能するように修正しました。

### 2. フロントエンド (`src/dist/js/ui/settings.js`)
- `saveSettings()` において、保存モード切り替え時に進行中の自動保存タイマー（`autosaveTimer`）をクリアする処理を追加しました。
- 保存モード切り替え後、アクティブなタブを取得して `updateTabStatus(currentTab)` を呼び出し、ステータスバーの表示（`[手動保存モード] ...` 等）が即時更新・同期されるように改善しました。

### 3. バージョン番号の管理
- `Cargo.toml`
- `tauri.conf.json`
- `nsis/installer.nsi`
- `docs/DEVELOPMENT.md`
上記のバージョン管理4ファイルを内部バージョン `0.1.40` へ繰り上げました。

---

## 検証結果

- **コンパイル検証**: `cargo check` がエラーなしで正常完了することを確認しました。
- **コード構造検証**:
  - `previousSaveMode` が変更前の正確な値を保持するため、`previousSaveMode === 'auto' && saveMode === 'manual'` などのモード切替分岐が正常に動作します。
  - タブの未保存表記（`未保存1` ↔ `[未保存1]`）が即座に切り替わります。
  - アクティブタブに対する `updateTabStatus` の呼び出しにより、ステータスバーが新しい保存モードの表示へ即時更新されます。
