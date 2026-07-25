# 保存モード変更不具合の修正 (fix-save-mode-setting)

設定画面で保存モードを変更した際に、設定が `config.json` に正しく保存・永続化されない不具合（Ver 0.1.38 リファクタリング時のデグレードおよびイベントハンドラでの状態直接上書きバグ）を修正します。

## 根本原因
`main.js` における `saveModeSelectModal` の `change` イベントリスナーから呼び出される `saveSettings` 関数がモジュールインポートされておらず、イベント発火時に `ReferenceError` となり処理が中断していたことが原因でした。エラーがコンソールにのみ出力（サイレントエラー）されていたため、設定値も保存されずUIも更新されない状態になっていました。

## User Review Required

なし

## Open Questions

なし

## Proposed Changes

### フロントエンド（JS）

イベントリスナーの登録処理において、設定の読み込み後に正しくUIの状態を反映し、その後の変更がバックエンドへ保存されるように修正します。

#### [MODIFY] `src/dist/js/main.js`
- `saveSettings` 関数のモジュールインポートを追加し、`ReferenceError` を解消します。
- `init()` 関数内での `setupUIEventListeners()` の呼び出し位置を修正し、起動条件に関わらず常にイベントリスナーが一括登録されるように維持します。
- `saveModeSelectModal` の `change` イベントリスナーで `appState.saveMode` への事前代入を行わず、`await saveSettings()` のみを呼ぶ構造に修正します（`saveSettings()` 内部で `previousSaveMode` が変更前状態を正しく取得できるようにするため）。

#### [MODIFY] `src/dist/js/ui/settings.js`
- `saveSettings()` 関数内で、保存モード切り替え時に進行中の `appState.autosaveTimer` を `clearTimeout` で確実にクリアします。
- `saveSettings()` 関数内で、モード切り替え後に `getCurrentTab()` でアクティブなタブを取得し、`updateTabStatus(tab)` を実行してステータスバーを新しい保存モードの表示へ即時更新します。

---

### 設定・ビルド定義

#### [MODIFY] `Cargo.toml`
#### [MODIFY] `tauri.conf.json`
#### [MODIFY] `nsis/installer.nsi`
#### [MODIFY] `docs/DEVELOPMENT.md`
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
