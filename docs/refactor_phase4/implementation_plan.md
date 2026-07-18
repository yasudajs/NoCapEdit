# Phase 4: サイドバー用ショートカットの移動 実装計画

本計画は `refactor_v0.2_separation_master_plan.md` に基づくフェーズ4の実装内容を定義するものです。

## 🎯 目標

- `main.js` に直書きされているサイドバー専用のキーボードショートカット(`Ctrl+E`, `Ctrl+N`, `Ctrl+D`) を、フェーズ1で作成したブリッジモジュール `sidebar-integration.js` に移動させる。
- `main.js` には、シンプルモード時やサイドバー無効時に備えて、`Ctrl+N` を「新規タブ作成」の機能として登録する。
- ショートカットが重複した場合（`Ctrl+N` など）に、後から登録されたモジュール（ここでは `sidebar-integration.js`）のショートカットが優先して実行されるように、ショートカットレジストリ (`shortcuts.js`) の探索ロジックを修正する。

## ⚠️ User Review Required

ショートカットレジストリの「後勝ち（後から登録されたものが優先される）」仕様への変更について確認をお願いします。
現在 `shortcuts.js` の `keydown` リスナーは配列を先頭から順に探索しているため、先に登録されたショートカットが優先されてしまいます。これを**配列の末尾から（逆順に）探索する**ように修正することで、後からモジュール（サイドバー等）が初期化された際に登録するショートカットが優先的に効くようにします。

## 📝 Proposed Changes

---

### Shortcuts Registry

ショートカットの競合時に後から登録されたものを優先する修正。

#### [MODIFY] [shortcuts.js](file:///c:/work/NoCapEdit/src/dist/js/shortcuts.js)
- `keydown` イベントリスナー内のループ `for (const s of shortcuts)` を `for (let i = shortcuts.length - 1; i >= 0; i--)` の逆順ループに変更。
- これにより、`main.js` で先に登録された `Ctrl+N` よりも、後から `sidebar-integration.js` で登録された `Ctrl+N` が先にマッチするようになる。

### Sidebar Bridge

サイドバー用のショートカットを登録する処理の追加。

#### [MODIFY] [sidebar-integration.js](file:///c:/work/NoCapEdit/src/dist/js/ui/sidebar-integration.js)
- `registerShortcut` およびサイドバーの操作関数（`focusSidebarTree`, `createItemGlobally`）を import する。
- `initSidebarIntegration()` 内で、以下のショートカットを登録する。
  - `Ctrl+E`: `focusSidebarTree()`
  - `Ctrl+N`: `createItemGlobally(false)`
  - `Ctrl+D`: `createItemGlobally(true)`

### Main Core

メイン初期化からサイドバー固有のショートカットを除去。

#### [MODIFY] [main.js](file:///c:/work/NoCapEdit/src/dist/js/main.js)
- `focusSidebarTree`, `createItemGlobally` の import を削除。
- `Ctrl+E`, `Ctrl+N`, `Ctrl+D` の既存のサイドバー用ショートカット登録を削除。
- 共通機能としての `Ctrl+N`（「新規タブ作成」: `createNewTab()` を実行）を `registerShortcut` で新たに登録する。

## 🧪 Verification Plan

### Manual Verification
以下の手順でショートカットの動作を確認します。
1. **共通ショートカットの確認**: アプリ起動後、`Ctrl+N` を押すとサイドバーでの「新規ファイル作成」が実行されること（`sidebar-integration.js` の設定が優先されていること）。
2. **サイドバー系ショートカットの確認**:
   - `Ctrl+E` でサイドバーツリーにフォーカスが移動すること。
   - `Ctrl+D` で新規フォルダ作成が実行されること。
3. **エラーの不在確認**: 開発者ツールのコンソールで不自然なエラーが出ていないこと（`Ctrl+N` 競合の警告が出るのは想定通り）。
