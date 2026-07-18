# v0.2 リファクタリング マスタープラン

## 📖 背景と経緯

v0.1系（`master`）とv0.2系（`v0.2`ブランチ）を併存させ、コンフリクトを最小化する方法を検討した結果、以下の結論に至った：

1. v0.2のコードをベースとし、将来的に `master` を v0.2 で上書き統合する
2. v0.2のサイドバー関連コードが複数ファイルに散在している問題を解消する（リファクタリング）
3. 「シンプルモード」設定を追加し、サイドバーを無効化すればv0.1相当の動作になるようにする
4. これにより、2つのブランチを維持する必要がなくなり、コンフリクトの問題自体が消滅する
5. 将来の機能追加（ファイル検索、grep等）に備え、ショートカット管理や機能モジュールの役割分担を整理する

> **注意**: `master` への統合（ブランチマージ）は本計画の範囲外とする。全リファクタリング完了後に別途実施する。

## 🎯 目標

- `main.js`、`settings.js`、`state.js` に散在しているサイドバー関連のロジックを、サイドバーモジュール側に集約する
- `main.js` からサイドバーへの依存を「1つの初期化呼び出し」に最小化する
- キーボードショートカットを集中レジストリ方式で管理し、機能追加時のキー競合防止と一覧性を確保する
- 関心の分離を行い、コードの保守性を向上させる
- 最終的に「シンプルモード」フラグでサイドバー全機能をオン/オフできる構造にする

---

## 📈 進捗状況（全10フェーズ）

| フェーズ | 内容 | 状態 |
|---|---|---|
| 1 | ブリッジモジュールの作成 | ✅ 完了 |
| 2 | サイドバー初期化ロジックの移動 | ✅ 完了 |
| 3 | ショートカットレジストリの作成 | ⬜ 未着手 |
| 4 | サイドバー用ショートカットの移動 | ⬜ 未着手 |
| 5 | ファイルシステム監視のサイドバー部分移動 | ⬜ 未着手 |
| 6 | settings.js のサイドバー関連分離 | ⬜ 未着手 |
| 7 | state.js のサイドバー関連整理 | ⬜ 未着手 |
| 8 | シンプルモード機能の実装 | ⬜ 未着手 |
| 9 | 統合テストとクリーンアップ | ⬜ 未着手 |
| 10 | 関連ドキュメントの更新 | ⬜ 未着手 |

---

## 📊 現状の問題点（サイドバーコードの散在状況）

| ファイル | サイドバー関連の混入箇所 | 行数(概算) |
|---|---|---|
| `main.js` | import文、初期化（状態復元・CSS変数・initSidebar呼出）、キーボードショートカット3種（Ctrl+E/N/D）、file-system-changed内のツリー更新・DOMクエリ、DOMContentLoadedでのinitSidebar呼出 | ~50行 |
| `settings.js` | `saveApplicationSettings()` 内の `sidebar_visible`/`sidebar_width` 保存 | ~5行 |
| `state.js` | `sidebarVisible`/`sidebarWidth` プロパティ、サイドバーDOM要素キャッシュ5個、`initElements()` のサイドバー要素特殊処理 | ~20行 |
| `sidebar.js` | サイドバー本体（1770行） — ここは問題なし | — |

---

## 📁 リファクタリング後のファイル構成（目標）

```
src/dist/js/
├── main.js              ← アプリ起動・コア初期化。サイドバーへの参照は initSidebarIntegration() の1呼出のみ
├── state.js             ← アプリ状態管理
├── shortcuts.js         ← [NEW] ショートカットレジストリ（集中管理）
├── core/
│   ├── fileSystem.js    ← ファイル操作（変更なし）
│   └── tauri.js         ← Tauri API（変更なし）
├── ui/
│   ├── editor.js        ← エディタ（変更なし）
│   ├── settings.js      ← 基本設定（サイドバー設定を除去）
│   ├── tabs.js          ← タブ管理（変更なし）
│   ├── sidebar.js       ← サイドバー本体（ファイルツリーUI）
│   └── sidebar-integration.js  ← [NEW] サイドバー領域の管理（main.jsとの橋渡し）
└── utils/
    └── helpers.js       ← ユーティリティ（変更なし）
```

### 各ファイルの責務

| ファイル | 責務 | 知るべきこと |
|---|---|---|
| `main.js` | 起動、コア初期化、基本ショートカット登録 | コアモジュールのみ |
| `shortcuts.js` | ショートカットの登録・競合検出・ディスパッチ | キーイベントの処理方法のみ |
| `sidebar-integration.js` | サイドバー領域の管理（初期化、ショートカット登録、FS監視連携、設定保存） | sidebar.js + shortcuts.js |
| `sidebar.js` | サイドバーUI本体（ツリー、D&D、コンテキストメニュー等） | 自身のUI操作のみ |
| `settings.js` | 基本設定の保存・復元・UI | コア設定のみ |
| `state.js` | アプリ全体の状態管理 | 状態の定義のみ |

### main.js の理想形（サイドバー関連部分）

```javascript
// import は1つだけ
import { initSidebarIntegration } from './ui/sidebar-integration.js';

// DOMContentLoaded
document.addEventListener('DOMContentLoaded', async () => {
    initElements();
    await init();
    updateEditorMetrics();
    initSidebarIntegration();  // ← これだけ。中でsimpleModeをチェック
});
```

### shortcuts.js のイメージ

```javascript
const shortcuts = [];

export function registerShortcut(combo, handler, options = {}) {
    const existing = shortcuts.find(s => s.combo === combo);
    if (existing) {
        console.warn(`ショートカット競合: ${combo} (${existing.category} vs ${options.category})`);
    }
    shortcuts.push({ combo, handler, ...options });
}

// グローバルキーボードリスナーは1つだけ
window.addEventListener('keydown', (e) => {
    const combo = buildCombo(e);
    for (const s of shortcuts) {
        if (s.combo === combo && s.enabled !== false) {
            e.preventDefault();
            s.handler(e);
            return;
        }
    }
});
```

---

## 🛠️ 作業フェーズ詳細

リスクを抑え、1フェーズ = 1セッション（30〜60分）で完結できるよう細分化。

---

### フェーズ 1: ブリッジモジュールの作成【※実装完了】

`main.js` とサイドバーの間の橋渡し役となる `sidebar-integration.js` を新規作成する。
このフェーズでは既存コードの移動は最小限にし、呼び出し経路を整理するだけ。

- **対象**: `main.js`, `ui/sidebar-integration.js`（新規）
- **作業内容**:
  - `js/ui/sidebar-integration.js` を新規作成
  - `initSidebarIntegration()` 関数をエクスポート
  - `main.js` のDOMContentLoadedから `initSidebar()` の直接呼出を `initSidebarIntegration()` 経由に変更
  - この時点では `initSidebarIntegration()` の中身は既存の `initSidebar()` を呼ぶだけのラッパー
- **検証**: 既存動作に変化がないこと
- **リスク**: 極小（呼び出し経路の変更のみ）

---

### フェーズ 2: サイドバー初期化ロジックの移動【※実装完了】

`main.js` の `init()` 内にあるサイドバーの初期表示制御を `sidebar-integration.js` に移動する。

- **対象**: `main.js`（L434-447付近）, `sidebar-integration.js`
- **作業内容**:
  - 以下のコードを `main.js` から `sidebar-integration.js` に移動:
    - `appState.sidebarVisible` / `appState.sidebarWidth` の設定値読み込み
    - `sidebar` / `sidebarResizeHandle` の `hidden` クラス切り替え
    - `iconBar` の幅設定
    - CSS変数 `--sidebar-width` の設定
  - `initSidebarIntegration()` 内で、`initSidebar()` の前にこれらの初期化を実行
- **検証**: サイドバーの初期表示（表示/非表示、幅）が正常であること
- **リスク**: 小（初期化タイミングに注意）

---

### フェーズ 3: ショートカットレジストリの作成【※実装完了】

`shortcuts.js` を新規作成し、`main.js` の巨大なkeydownハンドラをレジストリ方式に置き換える。
このフェーズでは**基本機能のショートカットのみ**を対象とし、サイドバー系は次フェーズで移動する。

- **対象**: `shortcuts.js`（新規）, `main.js`
- **作業内容**:
  - `js/shortcuts.js` を新規作成（`registerShortcut()`, `buildCombo()`, グローバルkeydownリスナー）
  - `main.js` の keydown ハンドラから以下の基本ショートカットを `shortcuts.js` へのレジストリ登録に置き換え:
    - `Ctrl+S`（保存）、`Ctrl+Tab` / `Ctrl+Shift+Tab`（タブ切替）
    - `Ctrl++` / `Ctrl+-`（ズーム）、`Ctrl+Shift++` / `Ctrl+Shift+-`（行高さ）
    - `F5` / `Ctrl+R` / `Ctrl+P`（無効化）
    - その他の基本ショートカット
  - `main.js` の `window.addEventListener('keydown')` ハンドラを削除し、`shortcuts.js` のグローバルリスナーに統合
  - エディタ固有のキー処理（Tab/Shift+Tabインデント等）はエディタ要素のリスナーとして残す
- **検証**: 全ての基本ショートカットが従来通り動作すること
- **リスク**: 小〜中（ショートカットの移行漏れに注意。全キーバインドのテストが必要）

---

### フェーズ 4: サイドバー用ショートカットの移動

サイドバー専用のショートカットを `main.js` から `sidebar-integration.js` に移動し、レジストリに登録する。

- **対象**: `main.js`, `sidebar-integration.js`
- **作業内容**:
  - 以下のショートカットを `main.js` から削除し、`sidebar-integration.js` から `registerShortcut()` で登録:
    - `Ctrl+E` → `focusSidebarTree()`
    - `Ctrl+N` → `createItemGlobally(false)`
    - `Ctrl+D` → `createItemGlobally(true)`
  - `main.js` 側では `Ctrl+N` を「新規タブ作成」として登録（シンプルモード時の動作）
  - `sidebar-integration.js` 側の `Ctrl+N` がフルモード時に優先される設計にする
- **検証**:
  - サイドバー系ショートカット（Ctrl+E/N/D）が正常動作すること
  - 共通ショートカット（Ctrl+S, Ctrl+Z 等）に影響がないこと
- **リスク**: 小（ショートカットの優先順位に注意）

---

### フェーズ 5: ファイルシステム監視のサイドバー部分移動

`main.js` の `file-system-changed` イベントハンドラ内にあるサイドバーツリー更新ロジックを分離する。

- **対象**: `main.js`（L315-368付近）, `sidebar-integration.js`
- **作業内容**:
  - `main.js` のハンドラから以下を削除:
    - `.tree-item[data-is-dir="true"]` のDOMクエリ
    - `loadDirectory()` の呼び出し
    - サイドバーツリー更新に関する全てのロジック
  - `sidebar-integration.js` 内で独自の `listen('file-system-changed')` を登録し、ツリー更新を処理
  - `main.js` にはタブのリネーム・クローズ等の基本処理のみ残す
- **検証**:
  - 外部でのファイル作成・削除・リネーム時にサイドバーツリーが正しく更新されること
  - タブの自動クローズ・リネームが正常動作すること
- **リスク**: 小〜中（`file-system-changed` イベントを2箇所で受信する形になるため、処理順序に注意）

---

### フェーズ 6: settings.js のサイドバー関連分離

`settings.js` に混入しているサイドバー設定の保存処理を分離する。

- **対象**: `settings.js`（`saveApplicationSettings()` L101-102付近）, `sidebar-integration.js`
- **作業内容**:
  - `saveApplicationSettings()` から `sidebar_visible` / `sidebar_width` の保存を除去
  - サイドバー設定の保存は `sidebar-integration.js` 側で、独自の保存関数またはフックで処理
  - `saveSettingsDelay()` 関数の所在を整理（現在 settings.js にあるが、sidebar.js からのみ呼ばれている）
- **検証**: サイドバーの表示状態・幅がアプリ再起動後も保持されること
- **リスク**: 中（設定の保存・読み込みフローの整合性に注意）

---

### フェーズ 7: state.js のサイドバー関連整理

`state.js` のサイドバー関連のプロパティとDOM要素キャッシュを整理する。

- **対象**: `state.js`, `sidebar-integration.js`
- **作業内容**:
  - `initElements()` 内のサイドバー要素特殊処理（`sidebarToggleBtn`, `sidebarResizeHandle`, `fileTree`, `iconBar` の個別処理）を、sidebar側の初期化に委譲
  - サイドバーDOM要素（`sidebar`, `sidebarToggleBtn`, `sidebarResizeHandle`, `fileTree`, `iconBar`, `contextMenu`, `menuNewFile`, `menuNewFolder`, `menuRename`, `menuDelete`）の参照管理を sidebar 側に移動
  - `appState.sidebarVisible` / `appState.sidebarWidth` は appState に残す（sidebar.js の多数箇所で参照されているため、無理に移動しない）
- **検証**: 全サイドバー機能が正常動作すること
- **リスク**: 中（sidebar.js が `elements.*` を多数参照しているため、参照経路の変更に注意）

---

### フェーズ 8: シンプルモード機能の実装

リファクタリング完了後、「シンプルモード」設定を追加し、サイドバーの有効/無効を切り替え可能にする。

- **対象**: `state.js`, `settings.js`, `sidebar-integration.js`, `index.html`（設定UI）
- **作業内容**:
  - `appState` に `simpleMode` プロパティを追加
  - `sidebar-integration.js` の `initSidebarIntegration()` 冒頭で `simpleMode` をチェックし、有効なら即 return（ショートカット登録もスキップ）
  - 設定ダイアログに「モード」切替UIを追加（シンプル/フル）
  - シンプルモード時はサイドバーHTML要素を `hidden` のまま維持
  - モード切替時はアプリ再起動を推奨（または即時切替を実装）
- **検証**:
  - シンプルモード: サイドバーが一切表示されず、Ctrl+E/N/D が動作しないこと
  - フルモード: サイドバーの全機能が正常動作すること
  - モード切替後の設定保持
- **リスク**: 小（リファクタリングが正しく行われていれば、分岐を1箇所追加するだけ）

---

### フェーズ 9: 統合テストとクリーンアップ

- **作業内容**:
  - フルモード/シンプルモード両方で全機能の統合テスト
  - 不要なimport文・未使用コードの除去
  - `main.js` からサイドバー関連のimportが `sidebar-integration.js` のみになっていることを確認
- **リスク**: 小

---

### フェーズ 10: 関連ドキュメントの更新

統合テスト完了後、リファクタリングの結果を各ドキュメントに反映する。

- **対象**: `docs/spec.md`, `docs/DEVELOPMENT.md`, `docs/history.md`
- **作業内容**:
  - `spec.md`: 対象バージョンの更新、モジュール分割セクション（4.11）に `shortcuts.js` / `sidebar-integration.js` の追加反映、シンプルモードの仕様追記、バージョン識別用アイコン・アップデートチェックの系統分離に関する記述の見直し
  - `DEVELOPMENT.md`: ポータブル版ビルド手順の更新、モジュール構成の設計思想（ショートカットレジストリパターン、ブリッジモジュールパターン等）の追記
  - `history.md`: リファクタリング全体の変更履歴を追記
- **リスク**: 極小

---

## 🔮 将来の拡張パターン（v0.3以降）

今回のリファクタリングで確立する `sidebar-integration.js` + `shortcuts.js` のパターンにより、将来の機能追加は以下の手順で行える：

### 例: ファイル検索機能の追加

```
src/dist/js/ui/
├── sidebar.js                ← ファイルツリーパネル（既存）
├── sidebar-integration.js    ← パネル切替管理を追加
├── search.js                 ← [NEW] 検索UIパネル
└── search-integration.js     ← [NEW] 検索とコアの橋渡し（任意）
```

1. `search.js` を作成（検索UIの実装）
2. `sidebar-integration.js` にパネル切替ロジックを追加（icon-barのボタンでファイルツリー/検索を切替）
3. `shortcuts.js` に `registerShortcut('Ctrl+Shift+F', ...)` で登録
4. `index.html` に icon-bar のボタンとパネル用divを追加

**`main.js` は一切変更不要。**

### ファイル構造の進化の指針

| タイミング | やること |
|---|---|
| パネルが2つになった時 | `sidebar.js` を `filetree.js` にリネーム検討 |
| パネルが3つ以上になった時 | `ui/panels/` ディレクトリへの整理を検討 |
| 機能モジュールが増えた時 | `features/` ディレクトリへの再編を検討 |

今の段階で先回りしてディレクトリを作る必要はない。実際に必要になった時に整理する。
