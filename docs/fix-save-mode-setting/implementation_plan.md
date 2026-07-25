# 保存モード変更不具合の修正 (fix-save-mode-setting)

設定画面で保存モードを変更した際に、設定が `config.json` に正しく保存・永続化されない不具合（Ver 0.1.38 リファクタリング時のデグレードおよびイベントハンドラでの状態直接上書きバグ）を修正します。

## User Review Required

> [!IMPORTANT]
> - 本修正により、設定画面で保存モードを変更した際、`previousSaveMode` が正しく判定され、タブの未保存表示切替（`[未保存1]` ↔ `未保存1`）およびステータスバー表示（`[手動保存モード] ...` 等）が即時同期されるようになります。
> - 初回起動時や保存先フォルダ再設定画面が開いている状態であっても、各設定項目の変更が即時に `config.json` へ永続化されます。
> - 内部バージョンを `0.1.40` へ繰り上げます。

## Open Questions

特にありません。

## Proposed Changes

### フロントエンド (`src/dist/js/`)

#### [MODIFY] [main.js](file:///c:/work/NoCapEdit/src/dist/js/main.js)
- `init()` 関数内での `setupUIEventListeners()` の呼び出し位置を修正し、起動条件に関わらず常にイベントリスナーが一括登録されるように維持します。
- `saveModeSelectModal` の `change` イベントリスナーで `appState.saveMode` への事前代入を行わず、`await saveSettings()` のみを呼ぶ構造に修正します（`saveSettings()` 内部で `previousSaveMode` が変更前状態を正しく取得できるようにするため）。

#### [MODIFY] [settings.js](file:///c:/work/NoCapEdit/src/dist/js/ui/settings.js)
- `saveSettings()` 関数内で、保存モード切り替え時に進行中の `appState.autosaveTimer` を `clearTimeout` で確実にクリアします。
- `saveSettings()` 関数内で、モード切り替え後に `getCurrentTab()` でアクティブなタブを取得し、`updateTabStatus(tab)` を実行してステータスバーを新しい保存モードの表示へ即時更新します。

---

### 設定・ビルド定義

#### [MODIFY] [Cargo.toml](file:///c:/work/NoCapEdit/Cargo.toml)
#### [MODIFY] [tauri.conf.json](file:///c:/work/NoCapEdit/tauri.conf.json)
#### [MODIFY] [installer.nsi](file:///c:/work/NoCapEdit/nsis/installer.nsi)
#### [MODIFY] [DEVELOPMENT.md](file:///c:/work/NoCapEdit/docs/DEVELOPMENT.md)
- バージョン番号を `0.1.39` から `0.1.40` に繰り上げ済み（セット更新）。

---

## Verification Plan

### Automated Tests
- `cargo check` によるコンパイルチェック。

### Manual Verification
- アプリを起動し、設定画面を開く。
- 保存モードを「自動保存」から「手動保存」へ変更する。
  - タブの表示名が `未保存1` から `[未保存1]` へ即時変化することを確認。
  - ステータスバー表示が `[手動保存モード] ...` へ即時更新されることを確認。
  - `config.json` の `"save_mode"` が `"manual"` へ変更されたことを確認。
- アプリを再起動し、保存モードが「手動保存」として保持・復元されることを確認。
- 再度設定画面で「手動保存」から「自動保存」へ戻し、タブ表示名およびステータスバー、`config.json` が `"save_mode": "auto"` に即時更新されることを確認。
