# [Ctrl+T による新規タブ追加のショートカット実装]

現在「＋」ボタンでのみ可能な新規タブ追加操作を、キーボードショートカット `Ctrl+T` で行えるようにします。

## 調査結果

既存のショートカットキー（Ctrl+S での保存、Ctrl+Tab でのタブ切り替えなど）はすべてフロントエンド側 (`src/dist/js/ui/shortcuts.js`) で `keydown` イベントを監視して実装されています。
Tauri (Rust) 側でのグローバルショートカット等は使用されていません。

## Proposed Changes

フロントエンドのショートカット監視処理に `Ctrl+T` のキャッチ処理を追加し、既存の新規タブ作成ロジック (`createNewTab`) を呼び出します。
また、今後の開発の指針とするため、アーキテクチャ設計としてショートカットの実装方針をドキュメントに明記します。

### 1. コードの修正
- [MODIFY] [shortcuts.js](file:///C:/work/NoCapEdit/src/dist/js/ui/shortcuts.js)
  - `src/dist/js/ui/tabs.js` から `createNewTab` 関数をインポートするよう追記。
  - `keydown` イベントリスナーの `if (e.ctrlKey)` ブロック内に `Ctrl+T` 判定を追加。
  - 判定内で `e.preventDefault()` を実行し、`createNewTab()` を呼び出す。

### 2. ドキュメントの更新
- [MODIFY] [ARCHITECTURE.md](file:///C:/work/NoCapEdit/docs/ARCHITECTURE.md)
  - 「ショートカットキーの実装方針」についての項目を追記し、**「イベント処理はTauri側のGlobalShortcutではなく、フロントエンド（JS）側で一元管理する」**という設計思想を明文化する。
- [MODIFY] [SHORTCUTS.md](file:///C:/work/NoCapEdit/docs/SHORTCUTS.md)
  - ショートカット一覧に `Ctrl+T` (新規タブ) を追加。
- [MODIFY] [history.md](file:///C:/work/NoCapEdit/docs/history.md)
  - バージョン変更履歴に本機能追加を追記（実装完了後）。
- [NEW] [walkthrough.md](file:///C:/work/NoCapEdit/docs/wip/add-tab-shortcut/walkthrough.md)
  - 作業完了後にウォークスルーを作成。

## Verification Plan

### Manual Verification
1. アプリを起動し、キーボードで `Ctrl+T` を押下する。
2. 新しいタブ（"Untitled" 等）が追加され、エディタ画面が切り替わることを確認する。
3. `Ctrl+S` など他の既存ショートカットが正常に動作し続けていることを確認する。
