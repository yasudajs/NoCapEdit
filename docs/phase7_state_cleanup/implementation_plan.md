# Phase 7 実装計画: state.js のサイドバー関連整理

`state.js` 内に定義されているサイドバー関連の DOM 要素キャッシュおよび `initElements()` の特殊初期化ロジックを整理し、サイドバーモジュール側（`sidebar.js` / `sidebar-integration.js`）にカプセル化・委譲します。

---

## 🎯 目的・概要

現在 `state.js` の `elements` オブジェクトおよび `initElements()` 関数の中に、サイドバー固有のDOM要素（`sidebar`, `fileTree`, `contextMenu` など全10要素）の取得・管理処理が混入しています。
これをサイドバー側の初期化処理に委譲し、`state.js` をコア要素のみの状態管理ファイルへとクリーンにします。

---

## 🛠️ 変更内容詳細

### 1. `src/dist/js/state.js`

#### [MODIFY] [state.js](file:///c:/work/NoCapEdit/src/dist/js/state.js)
- `elements` オブジェクトからサイドバー専用の以下 10 個のプロパティ初期定義を削除:
  - `sidebarToggleBtn`
  - `sidebar`
  - `sidebarResizeHandle`
  - `fileTree`
  - `iconBar`
  - `contextMenu`
  - `menuNewFile`
  - `menuNewFolder`
  - `menuRename`
  - `menuDelete`
- `initElements()` 関数内の `else if` 特殊処理分岐（`sidebarToggleBtn`, `sidebarResizeHandle`, `fileTree`, `iconBar` の ID 読み替え処理）を削除し、コア要素専用のループに簡素化。

---

### 2. `src/dist/js/ui/sidebar.js`

#### [MODIFY] [sidebar.js](file:///c:/work/NoCapEdit/src/dist/js/ui/sidebar.js)
- `initSidebarElements()` 関数を追加（または `initSidebar()` 内で実行）し、サイドバー領域の 10 個の DOM 要素を `document.getElementById()` で取得して `elements` に動的割り当て。
- `sidebar.js` 内部や `sidebar-integration.js` の既存の `elements.xxx` 参照コードは変更せずにそのまま正常動作させ、後退リスクを最小化。

---

## 🧪 検証計画

### 自動検証
- npm test / ビルドエラーがないことを確認（該当スクリプトがある場合）

### 手動テスト項目
1. **初期表示**: アプリ起動時にサイドバーおよびツリーが正しく表示されること。
2. **表示トグル**: トグルボタンおよび `Ctrl+E` でサイドバーの開閉が正しく動作すること。
3. **幅リサイズ**: ドラッグでサイドバー幅の調整が正しく動作すること。
4. **コンテキストメニュー**: ツリー上・背景上での右クリックでコンテキストメニューが表示され、新規作成・削除・リネームが実行できること。
5. **外部変更検知**: ファイル作成・削除時にファイルツリーが正常に自動更新されること。
