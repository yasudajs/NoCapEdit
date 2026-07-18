# シンプルモード機能 将来実装計画案 (WIP)

## 📖 概要
「シンプルモード」は、サイドバーおよび関連機能（ファイルツリー、サイドバーショートカット、アイコンバーなど）を無効化し、エディタ単体（v0.1相当）の動作にする機能です。
設定ダイアログから「フルモード」と「シンプルモード」をリアルタイムに切り替え可能にすることを目標とします。

---

## 🎯 仕様案

1. **設定項目とデータ管理**
   - バックエンド (`main.rs`): `AppSettings` に `simple_mode: bool` (デフォルト: `false`) を追加。
   - フロントエンド (`state.js`): `appState.simpleMode` を定義。
   - 設定画面 (`index.html`): 「動作モード」セレクトボックス (フルモード `full` / シンプルモード `simple`) を追加。

2. **UI表示の制御 (`sidebar-integration.js`)**
   - `simpleMode === true` の場合:
     - `#sidebar`, `#sidebar-resize-handle`, `#icon-bar` を非表示 (`.hidden`) にする。
     - サイドバーの初期表示処理・ファイルシステム監視リスナーの登録をスキップする。

3. **設定変更時の即時反映**
   - セレクトボックスの `change` イベントで即座に設定を保存し、`initSidebarIntegration()` を再呼び出ししてUI表示をリアルタイム更新する。

---

## ⚠️ 判明した課題・問題点

フェーズ8の事前検証において、以下の課題が特定されました：

### 1. ショートカットキー実行によるサイドバーの強制再表示
- **現象**: フルモードからシンプルモードへ変更後、キーボードショートカット `Ctrl+E` を押すと、非表示になっていたサイドバーが強制的に再表示される。
- **原因**: 
  - フルモード時に `shortcuts.js` へ登録された `Ctrl+E` のハンドラ（`focusSidebarTree()`）が、シンプルモード切り替え後も解約されずにメモリ上に残る。
  - `focusSidebarTree()` 内部に `if (!appState.sidebarVisible) elements.sidebar.classList.remove('hidden');` という処理が存在するため、ショートカットが発火するとサイドバーが表示状態に戻ってしまう。

### 2. サイドバー系ショートカット（Ctrl+N, Ctrl+D等）の競合
- シンプルモード時には `Ctrl+N` は「新規タブ作成」として動作する必要があるが、サイドバー用ショートカットが残っていると優先度の関係で意図しない動作になる可能性がある。

---

## 🛠️ 解決策・設計指針

将来実装時には、以下の対策を講じる必要があります：

### 対策1: サイドバー操作関数での `simpleMode` ガード（推奨・確実）
`focusSidebarTree()` をはじめとするサイドバー操作関数の冒頭で `simpleMode` の状態をチェックし、シンプルモード時は処理を中断（`return`）します。

```javascript
// sidebar.js
export async function focusSidebarTree() {
    if (appState.simpleMode) {
        return; // シンプルモード中はサイドバーを展開・フォーカスしない
    }
    // ...従来の処理...
}
```

### 対策2: ショートカットレジストリ（`shortcuts.js`）への登録解除・動的無効化APIの導入
`shortcuts.js` にカテゴリ単位での無効化または登録解除機能を追加し、モード変更時に適切に切り替えます。

```javascript
// shortcuts.js の拡張案
export function unregisterShortcutsByCategory(category) {
    // 指定カテゴリのショートカットを配列から削除
}
export function setCategoryEnabled(category, enabled) {
    // 指定カテゴリの有効/無効フラグを一括変更
}
```

### 対策3: モード切替時のクリーンアップ処理
`initSidebarIntegration()` 実行時に、シンプルモードであれば既存のサイドバー関連リスナーやショートカットの解除を明示的に行うクリーンアップ処理を入れる。

---

## 📋 将来の実装手順まとめ

1. `shortcuts.js` にカテゴリ無効化・解除APIを追加。
2. `sidebar.js` の `focusSidebarTree()` 等の公開関数に `appState.simpleMode` ガードを追加。
3. `main.rs`, `state.js`, `index.html`, `main.js`, `settings.js` に設定配管（`simple_mode`）を実装。
4. `sidebar-integration.js` での切り替え・クリーンアップ処理の実装。
5. 手動検証（Ctrl+E 等の非発火確認、モード即時切り替えの確認）。
