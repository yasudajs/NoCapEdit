# フェーズ3 タスク一覧

- [x] `src/dist/js/shortcuts.js` の新規作成
  - [x] `shortcuts` 配列と `registerShortcut` 関数の実装
  - [x] キーイベントからショートカット文字列（combo）を生成する処理の実装
  - [x] グローバル `keydown` イベントリスナーの実装
- [x] `src/dist/js/main.js` の改修
  - [x] `shortcuts.js` のインポート追加
  - [x] 既存の `keydown` ハンドラの削除
  - [x] 基本ショートカット（F5, Ctrl+Tab, ズーム, 行高さ, Ctrl+S等）の `registerShortcut` を用いた登録への移行
  - [x] サイドバー用ショートカット（Ctrl+E, N, D）の一時的な `registerShortcut` を用いた登録
- [ ] 動作確認（手動テスト）
  - [x] `Ctrl+S` で保存が機能すること
  - [x] `Ctrl+Tab`, `Ctrl+Shift+Tab` でタブの切り替えができること
  - [x] `Ctrl++`, `Ctrl+-` （または `=`, `_` など対応キー）でズームの拡大・縮小ができること
  - [x] `Ctrl+Shift++`, `Ctrl+Shift+-` で行間隔の調整ができること
  - [x] `Ctrl+E` でサイドバーにフォーカスが移動すること
  - [x] `Ctrl+N` でファイル新規作成処理が走ること
  - [x] `Ctrl+D` でフォルダ新規作成処理が走ること
  - [x] `F5`, `Ctrl+R`, `Ctrl+P` が無効化されており、ブラウザのデフォルト挙動（リロードや印刷）が発生しないこと
