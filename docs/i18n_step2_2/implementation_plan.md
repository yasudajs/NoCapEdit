# [Phase 2] Step 2.2: `tauri.js` の対応（調査およびクリーンアップ）

## 調査結果と対応方針（Goal Description）
`docs/wip/i18n_refactor/master_plan.md` の Phase 2 / Step 2.2 では、`src/dist/js/core/tauri.js` 内のシステムエラー文言の多言語化を予定していました。

しかし、事前調査（Gitのコミット履歴 `580ebeac` の確認）により以下の事実が判明しました。
- `tauri.js` 内に存在した UI 通知処理（`updateStatus` への依存）は、`ui/tabs.js` との間に**モジュールの循環参照（Circular Dependency）**を引き起こす原因となっていました。
- この循環参照による起動時クラッシュ（ReferenceError）を解消するため、過去の不具合修正（Ver 0.1.38 のモジュール分割時周辺）で当該の通知処理と `import` 文はすでにコメントアウトされています。

そのため、現在の `tauri.js` には UI に表示される有効な日本語文字列（ハードコード）が存在しません。
今回は、i18n対応として追加の翻訳キーを定義するのではなく、**不要になったコメントアウトを完全に削除してコードをクリーンアップする**ことを本ステップ（Step 2.2）の実装内容とします。

## User Review Required
上記の方針（不要なコメントアウトと import 文の削除）に基づいて実装を進めてよろしいでしょうか？
問題がなければ、作業用ブランチを作成して実装に進みます。

## Proposed Changes

### [MODIFY] [tauri.js](file:///c:/work/NoCapEdit/src/dist/js/core/tauri.js)
不要となっている以下のコメント行を削除し、コードを整理します。

- 1行目: `// import { updateStatus } from '../ui/tabs.js';` の削除
- 13行目付近: `// updateStatus('Tauri API 初期化失敗', 'error');` の削除

## Verification Plan
1. コードからコメントアウトが完全に削除されていることを確認。
2. アプリのビルドおよび起動を行い、UIの描画や機能に影響が出ていない（循環参照が再発していない等）ことを確認します。
