# Tauri v2 移行に関する追加検討事項

> [!NOTE]
> **本ドキュメントの全項目は解決済みです。**
> 各項目の対策・方針は `migration_plan.md` に反映済みのため、本ドキュメントはクリーンアップ対象です。

## 1. フロントエンドからのプラグインAPI呼び出し（`withGlobalTauri` 環境） — ✅ 解決済み

**結論**: `app.withGlobalTauri: true` を設定し、Rust側でプラグインを初期化（`.plugin(tauri_plugin_dialog::init())` 等）すれば、`window.__TAURI__.dialog` 等としてグローバルに利用可能。npmバンドラー不要。→ migration_plan.md フェーズ5-3, フェーズ6 に反映済み。

## 2. Rust側の `fs` プラグインの要否確認 — ✅ 解決済み

**結論**: 現在のRustコードは `tauri::path` / `tauri::fs` 等のTauri独自ファイルシステムAPIを一切使用しておらず、全て `std::fs` 等の標準ライブラリで実装されているため、`tauri-plugin-fs` の導入は不要。

## 3. イベント送信（emit/listen）のフロントエンドでの購読パス — ✅ 解決済み

**結論**: `withGlobalTauri: true` 設定時のアクセスパスは v1 と同じ `window.__TAURI__.event.listen` のまま変更なし。→ migration_plan.md フェーズ6 に反映済み。

## 4. `package.json` 導入の可能性（フォールバック） — ✅ 解決済み

**結論**: 問題1が解決されたことで、npmバンドラー導入のフォールバックは不要。現在のピュアな静的ファイル構成を維持可能。
