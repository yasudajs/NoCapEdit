# フェーズ1: ブリッジモジュール（sidebar-integration.js）の作成

## 概要

v0.2 リファクタリングマスタープランのフェーズ1として、`main.js` とサイドバーの間の橋渡し役となる `sidebar-integration.js` を新規作成する。

このフェーズでは **既存コードの移動は最小限** にし、呼び出し経路を整理するだけに留める。これにより、後続フェーズでのサイドバー関連コードの集約先（受け皿）を確立する。

- **対象ブランチ**: `v0.2`（v0.2系）
- **作業ブランチ**: `feature/refactor-phase1-bridge-module`
- **次バージョン**: `0.2.18`

---

## 現状の呼び出し構造

```
index.html
  └── js/main.js（type="module"）
        ├── import { initSidebar, loadDirectory, focusSidebarTree, createItemGlobally } from './ui/sidebar.js'
        └── DOMContentLoaded
              ├── initElements()
              ├── await init()          ← L434-447にサイドバー初期表示制御あり（フェーズ2で移動予定）
              ├── updateEditorMetrics()
              └── initSidebar()         ← sidebar.js の initSidebar() を直接呼出（L533）
```

## 目標の呼び出し構造（フェーズ1完了後）

```
index.html
  └── js/main.js
        ├── import { initSidebarIntegration } from './ui/sidebar-integration.js'
        ├── import { loadDirectory, focusSidebarTree, createItemGlobally } from './ui/sidebar.js'
        │   ↑ フェーズ1では残す（フェーズ4/5で移動予定）
        └── DOMContentLoaded
              ├── initElements()
              ├── await init()
              ├── updateEditorMetrics()
              └── initSidebarIntegration()  ← ブリッジ経由に変更
                    └── initSidebar()       ← 内部で sidebar.js を呼ぶだけ
```

---

## 提案する変更内容

### コンポーネント1: 新規ファイルの作成

#### [NEW] sidebar-integration.js

`main.js` とサイドバーモジュール間のブリッジ（橋渡し）モジュールを新規作成する。

**ファイルの内容:**
```javascript
// sidebar-integration.js — サイドバー統合モジュール（ブリッジ）
// main.js とサイドバーモジュール間の橋渡し役。
// 後続フェーズで、サイドバー関連の初期化・ショートカット登録・FS監視連携・設定保存を集約する。

import { initSidebar } from './sidebar.js';

/**
 * サイドバー統合の初期化
 * 現時点では initSidebar() を呼ぶだけのラッパー。
 * 後続フェーズで以下の責務を段階的に引き受ける:
 * - フェーズ2: サイドバー初期表示制御（sidebarVisible/sidebarWidth の読込と適用）
 * - フェーズ4: サイドバー用ショートカットの登録（Ctrl+E/N/D）
 * - フェーズ5: ファイルシステム監視のサイドバー部分
 * - フェーズ6: サイドバー設定の保存
 * - フェーズ8: シンプルモードのチェック（有効なら即return）
 */
export function initSidebarIntegration() {
    initSidebar();
}
```

**設計意図:**
- 後続フェーズで `main.js` からサイドバー関連コードを移動する際の受け皿として、まずモジュールの「入口」を確立する
- この時点では `initSidebar()` を呼ぶだけのシンプルなラッパーであり、既存動作を一切変えない
- コメントで将来の責務拡張計画を明記し、後続フェーズの見通しを示す

---

### コンポーネント2: main.js の変更

#### [MODIFY] main.js

`initSidebar` の直接呼出を `initSidebarIntegration` 経由に変更する。

**変更1: import文の変更（L7）**

```diff
-import { initSidebar, loadDirectory, focusSidebarTree, createItemGlobally } from './ui/sidebar.js';
+import { loadDirectory, focusSidebarTree, createItemGlobally } from './ui/sidebar.js';
+import { initSidebarIntegration } from './ui/sidebar-integration.js';
```

- `initSidebar` を `sidebar.js` からの直接importリストから除去
- `sidebar-integration.js` から `initSidebarIntegration` をimport
- `loadDirectory`, `focusSidebarTree`, `createItemGlobally` は後続フェーズ（4, 5）で移動するため、フェーズ1ではそのまま残す

**変更2: DOMContentLoaded内の呼び出し変更（L533）**

```diff
 document.addEventListener('DOMContentLoaded', async () => {
     initElements();
     await init();
     updateEditorMetrics();
-    initSidebar();
+    initSidebarIntegration();
 });
```

---

### コンポーネント3: バージョン番号の更新

以下の4ファイルのバージョンを `0.2.17` → `0.2.18` に更新する。

| ファイル | 変更箇所 |
|---|---|
| Cargo.toml | `version = "0.2.17"` → `"0.2.18"` (L3) |
| tauri.conf.json | `"version": "0.2.17"` → `"0.2.18"` (L11) |
| installer.nsi | `VERSION "0.2.17"` → `"0.2.18"` / `VERSIONWITHBUILD "0.2.17.0"` → `"0.2.18.0"` (L22, L25) |
| DEVELOPMENT.md | ZIP名中の `0.2.17` → `0.2.18` (L35) |

---

## 変更しないもの（明示的に除外）

以下は後続フェーズの対象であり、フェーズ1では**一切変更しない**：

| 項目 | 対象フェーズ |
|---|---|
| `init()` 内のサイドバー初期表示制御（L434-447） | フェーズ2 |
| `loadDirectory`, `focusSidebarTree`, `createItemGlobally` の import 移動 | フェーズ4, 5 |
| キーボードショートカットの変更 | フェーズ3, 4 |
| `settings.js` のサイドバー設定保存 | フェーズ6 |
| `state.js` のサイドバー関連プロパティ | フェーズ7 |
| `sidebar.js` 本体 | 変更なし |

---

## 検証計画

### ビルド確認
- `cargo run` でアプリが正常に起動すること

### 手動検証（動作確認チェックリスト）
1. **アプリ起動**: 正常に起動し、初期画面が表示されること
2. **サイドバー表示**: サイドバートグルボタン（左上アイコン）をクリックして、サイドバーが正しく表示/非表示を切り替えられること
3. **サイドバーリサイズ**: サイドバーの右端ドラッグでリサイズが機能すること
4. **ファイルツリー**: ホームフォルダが設定されている場合、ファイルツリーが正常に表示されること
5. **既存ショートカット**: Ctrl+E（サイドバーフォーカス）、Ctrl+N（新規ファイル）、Ctrl+D（新規フォルダ）が動作すること
6. **基本操作**: 新規タブ作成、テキスト入力、保存（自動/手動）が正常に動作すること
7. **ブラウザコンソール**: エラーが出力されていないこと（F12でDevTools確認）

### 期待結果
- **全ての項目が、変更前と完全に同じ動作をすること**（呼び出し経路の変更のみで、機能的な変更はないため）

---

## リスク評価

| リスク | 影響 | 対策 |
|---|---|---|
| import パスの誤り | アプリ起動不可 | ビルド＆起動で即検出可能 |
| `initSidebar` の呼出漏れ | サイドバー未初期化 | `initSidebarIntegration()` 内で確実に呼出 |

**総合リスク: 極小**（呼び出し経路の変更のみ、ロジックの変更なし）

---

## 作業手順

1. `v0.2` ブランチから `feature/refactor-phase1-bridge-module` を作成
2. バージョン番号の更新（4ファイル）
3. `sidebar-integration.js` を新規作成
4. `main.js` の import と DOMContentLoaded を修正
5. `cargo run` でビルド＆起動確認
6. 手動検証チェックリストの実施
7. `history.md` に変更履歴を追記
8. コミット＆プッシュ
