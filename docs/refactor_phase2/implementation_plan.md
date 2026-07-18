# サイドバー分離リファクタリング (Phase 2) 実装計画

`docs/wip/refactor_v0.2_separation_master_plan.md` のマスタープランに基づき、**フェーズ 2: サイドバー初期化ロジックの移動** の実装を行います。（※フェーズ 1 のブリッジモジュール `sidebar-integration.js` の作成および呼び出し経路の変更は既に完了していることを確認しました。）

## 目的
`main.js` の `init()` 内にあるサイドバーの初期表示制御を、新設したブリッジモジュール `sidebar-integration.js` に移動し、`main.js` 側の関心事を減らします。

## 変更内容（Phase 2）

### 1. `src/dist/js/ui/sidebar-integration.js` の拡張
以下のコードを `main.js` から移行し、`initSidebarIntegration()` 内で処理します。
- `appState` と `elements` のインポート追加
- `sidebarVisible` および `sidebarWidth` に基づく初期表示（クラスとスタイルの適用）
- `initSidebar()` の呼び出し前に初期表示状態を確定させる

### 2. `src/dist/js/main.js` のクリーンアップ
`init()` 内の以下のサイドバー初期表示制御（L439-L448付近）を削除します。
- `appState.sidebarVisible` による `elements.sidebar`, `elements.sidebarResizeHandle`, `elements.iconBar` の表示切り替え
- CSS変数 `--sidebar-width` の設定

## 確認事項
- `v0.2` ブランチから作業用ブランチ `refactor/phase2` を作成しました。
- 関連する4つの設定ファイル (`Cargo.toml`, `tauri.conf.json`, `nsis/installer.nsi`, `docs/DEVELOPMENT.md`) の内部バージョンを `0.2.18` から `0.2.19` に更新済みです。

## User Review Required

> [!NOTE]
> フェーズ 1 は既に既存コードに反映されていたため、今回はフェーズ 2 を対象とした実装計画としています。内容に問題がなければ「Proceed」ボタンで承認をお願いします。承認後、実装フェーズに進みます。

## 検証計画
- サイドバーの初期表示（表示/非表示、幅）が正常に維持されているか手動で確認します。
- `main.js` でエラーが発生せずにアプリが起動するか検証します。
