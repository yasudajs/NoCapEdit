# 実装計画書レビュー結果

- **レビュー日時**: 2026-09-15
- **対象**: `implementation_plan.md`（マルチディスプレイ移動時のIMEインライン入力位置ずれ修正）
- **結果**: ✅ 承認可能（軽微な確認事項あり）

---

## 良い点

1. **原因分析が正確**: TSFの座標同期ロス → フォーカス再取得で復旧するという現象の分析と、「blur→focus で再同期」という修正方針が合致している。
2. **デバウンス導入**: `tauri://move` はドラッグ中に大量に発火するため、150ms のデバウンスは適切。
3. **IME入力中のフェイルセーフ**: `compositionend` 直後に遅延実行する設計は、変換中のフォーカス喪失（入力が飛ぶ）を防ぐ重要なセーフガード。
4. **影響範囲が限定的**: `editor.js` と `main.js` の2ファイルのみの変更で、既存ロジックへの干渉が少ない。

---

## 確認・指摘事項

### 1. `editorView` のアクセス方法
`codemirror.js` の `editorView` はモジュールローカル変数（`let editorView = null;`）であるため、`resyncEditorPosition()` を `editor.js` に実装する場合は `getEditorView()` を経由してアクセスする必要がある。既に `editor.js` で `getEditorView` をインポート済みのため問題ないが、実装時に直接 `editorView` を参照しないよう注意。

### 2. `compositionstart` / `compositionend` の監視先
現時点ではプロジェクト内に composition イベントのハンドリングが存在しない。アプリ側でフラグ管理（例: `appState.isComposing`）する場合は、`editorView.contentDOM` に対してリスナーを登録する必要がある。

> [!IMPORTANT]
> `resyncEditorPosition()` の中で composition イベントのリスナーを登録・解除する場合、リスナーのライフサイクル管理（多重登録防止、解放漏れ）に留意すること。

### 3. `tauri://move` イベントの利用可能性
`main.js` では既に `listen` を使って `single-instance-file` と `tauri://file-drop` をリッスンしている。`tauri://move` と `tauri://scale-change` も同じ `listen` API で購読可能なので、既存パターンと整合する。問題なし。

### 4. `blur()` → `focus()` のタイミング
計画書では `blur()` → `requestAnimationFrame` → `focus()` としているが、`requestAnimationFrame` の1フレーム（約16ms）で TSF の座標がリセットされるかは環境依存。不安定な場合は `setTimeout(…, 0)` または `setTimeout(…, 50)` に変更する余地も想定しておくとよい。

### 5. 単一ディスプレイでの `tauri://move` イベント
単一ディスプレイ環境でもウィンドウ移動のたびに blur→focus が走る。150ms のデバウンスがあるため通常は問題ないが、ウィンドウ移動直後に即座にタイピングを開始した場合に一瞬フォーカスが外れる可能性がある点は意識しておくべき。

---

## 修正案（軽微）

| 項目 | 内容 |
|---|---|
| `package.json` | 前回の修正（v0.2.19）で `package.json` もバージョン更新対象に含まれていたが、計画書の変更対象ファイル一覧には「バージョン管理4ファイル (`Cargo.toml` 等)」としか記載されていない。`package.json` も更新対象に含めるか確認が必要。 |
