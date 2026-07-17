# [Phase 1] サイドバーロジックの完全カプセル化

v0.2リファクタリングの第1フェーズとして、現在 `main.js` の中にハードコードされている「サイドバーの初期化・UI状態制御」に関するロジックを、独立したモジュールである `sidebar.js` の内部に隠蔽（カプセル化）します。

これにより、`main.js` 側はサイドバーの内部構造（どのクラスを `hidden` にするか等）を知る必要がなくなり、v0.1との共通化が格段に容易になります。

## 🔍 対象ファイル
- **[MODIFY]** `src/dist/js/main.js`
- **[MODIFY]** `src/dist/js/ui/sidebar.js`

## 🛠️ Proposed Changes (提案する変更内容)

### `src/dist/js/ui/sidebar.js`
- **新規関数の追加**: `applySidebarState(appState)` をエクスポートし、以下の責務を持たせます。
  - `appState.sidebarVisible` に基づく `elements.sidebar` や `elements.sidebarResizeHandle` の表示切り替え。
  - `elements.iconBar` の幅制御。
  - CSS変数 `--sidebar-width` の適用。
- この処理は現在 `main.js` の `init()` 内にベタ書きされているものと全く同じロジックを移行するだけです。

### `src/dist/js/main.js`
- **インポートの追加**: `applySidebarState` をインポートします。
- **ロジックの置き換え**: `init()` 関数内 (L434〜L447付近) にあるUI制御のハードコード部分を削除し、代わりに `applySidebarState(appState)` を1行呼び出す形に変更します。

## ⚠️ User Review Required
- このフェーズでは**「UIの初期化状態の分離」**のみを確実に行います。（ファイルシステム監視ロジックやキーボードショートカットの分離は、フェーズ2以降で段階的に行います）
- こちらの粒度でよろしければ、この実装計画の「承認」をお願いいたします。

## 🧪 Verification Plan (検証計画)
1. アプリを起動し、起動時にサイドバーが以前と同じ状態（開いている／閉じている、幅）で正しく復元・表示されることを確認する。
2. アプリにデグレーション（起動時のエラー等）が発生していないことを確認する。
