# ウォークスルー (fix-save-mode-setting)

設定画面で保存モードを変更した際に、設定が `config.json` に正しく保存・永続化されない不具合（Ver 0.1.38 ESモジュール化時のデグレード）の修正作業結果です。

## 変更内容

### 1. フロントエンド (`src/dist/js/main.js`)
- `init()` 関数内での `setupUIEventListeners()` の呼び出し位置を条件分岐（`isFirstLaunch` / `isHomeFolderMissing`）の前に変更し、初回起動時や設定ダイアログ表示時でも確実にイベントリスナーが一括登録されるように修正しました。
- `setupUIEventListeners()` 内の `elements.saveModeSelectModal` の `change` イベントリスナーにおいて、`appState.saveMode = e.target.value` を明示的に設定してから `saveSettings()` を呼び出すように変更し、他設定項目と記述を統一しました。

### 2. バージョン番号の管理
- `Cargo.toml`
- `tauri.conf.json`
- `nsis/installer.nsi`
- `docs/DEVELOPMENT.md`
上記のバージョン管理4ファイルを内部バージョン `0.1.40` へ繰り上げました。

---

## 検証結果

- **コンパイル検証**: `cargo check` がエラーなしで正常完了することを確認しました。
- **コードロジック検証**:
  - `init()` 時に `setupUIEventListeners()` が必ず実行されるため、起動直後・初回設定表示時・通常起動時のいずれのコンディションでも `saveModeSelectModal` の `change` イベントリスナーが正常に登録されます。
  - `saveModeSelectModal` の選択変更時、`appState.saveMode` が新選択値に即時設定され、`saveSettings()` 経由で Rust 側の `save_settings` IPC に渡されるため、`config.json` 内の `"save_mode"` が即時に書き換わり永続化されます。
