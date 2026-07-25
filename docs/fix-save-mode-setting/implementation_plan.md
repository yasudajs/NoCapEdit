# 保存モード変更不具合の修正 (fix-save-mode-setting)

設定画面で保存モードを変更した際に、設定が `config.json` に正しく保存・永続化されない不具合（Ver 0.1.38 リファクタリング時のデグレード）を修正します。

## User Review Required

> [!IMPORTANT]
> - 本修正により、初回起動時や保存先フォルダ再設定画面が開いている状態でも、各設定項目（保存モード、Tabキーの挙動、文字数カウント等）の変更が即時に `config.json` へ永続化されるようになります。
> - 内部バージョンを `0.1.40` へ繰り上げます。

## Open Questions

特にありません。

## Proposed Changes

### フロントエンド (`src/dist/js/`)

#### [MODIFY] [main.js](file:///c:/work/NoCapEdit/src/dist/js/main.js)
- `init()` 関数内での `setupUIEventListeners()` の呼び出し位置を修正し、`isFirstLaunch` や `isHomeFolderMissing` の判定条件に関わらず常にイベントリスナーが一括登録されるように変更します。
- `setupUIEventListeners()` 内の `elements.saveModeSelectModal` の `change` イベントリスナーにおいて、他の設定項目（`tabBehaviorSelectModal` 等）の記述と統一し、`appState.saveMode = e.target.value` を明示的に設定してから `saveSettings()` を呼ぶように調整します。

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
- 設定画面を開き、保存モードを「自動保存」から「手動保存」へ変更する。
- アプリを再起動し、保存モードが「手動保存」として保持・復元されるか確認する（`config.json` の `"save_mode": "manual"` も確認）。
- 再度設定画面で「手動保存」から「自動保存」へ戻し、正しく `"save_mode": "auto"` に更新されるか確認する。
