# Implementation Plan - Phase 5: ファイルシステム監視のサイドバー部分移動

`main.js` に残っている `file-system-changed` イベントハンドラのサイドバーツリー更新ロジックを分離し、`sidebar-integration.js` に移動・集約します。
これにより、`main.js` からサイドバーツリー直接更新への依存を除去し、責務の分離を進めます。

## User Review Required

> [!IMPORTANT]
> - `main.js` と `sidebar-integration.js` の2箇所で `file-system-changed` イベントをそれぞれリスニングします。
> - `main.js` はタブの自動削除・リネーム処理を担当し、`sidebar-integration.js` はツリーの自動再読み込み（デバウンス付き）を担当します。
> - イベント発生時の重複処理や干渉が発生しない構造にします。

## Proposed Changes

### UI / Integration Layer

#### [MODIFY] [sidebar-integration.js](file:///c:/work/NoCapEdit/src/dist/js/ui/sidebar-integration.js)
- `loadDirectory` を `sidebar.js` からインポート
- `normalizePathForComparison`, `getParentPath` を `../utils/helpers.js` からインポート
- `listen` を `../core/tauri.js` からインポート
- `initSidebarIntegration()` 内または別関数 `setupFileSystemListener()` にて `listen('file-system-changed', ...)` を設定
- サイドバーツリーのリロードデバウンス処理（`pendingChangedDirs`, `fileChangeDebounceTimer`）を `sidebar-integration.js` 内に配置・実装

### Main App Layer

#### [MODIFY] [main.js](file:///c:/work/NoCapEdit/src/dist/js/main.js)
- 7行目の `import { loadDirectory } from './ui/sidebar.js';` を削除
- `pendingChangedDirs`, `fileChangeDebounceTimer` 変数を削除
- `file-system-changed` イベントリスナー（L233-L338付近）からツリー更新のループおよび `loadDirectory` 呼び出しロジックを削除し、タブの自動クローズ・リネーム処理のみを残す

## Verification Plan

### Manual Verification
1. **外部ファイル生成・変更テスト**:
   - エクスプローラー等で `homeFolder` 配下にファイル/フォルダを作成・削除・リネームし、サイドバーツリーが自動的に最新化されるか確認。
2. **タブ連携テスト**:
   - 開いているファイルを外部で削除・リネームした際、タブが自動で閉じられる / タブ名が変更されるか確認。
3. **キーボードショートカット・基本機能テスト**:
   - `Ctrl+E`, `Ctrl+N`, `Ctrl+D` などのサイドバーショートカット、エディタの保存や操作が問題なく動作するか確認。
