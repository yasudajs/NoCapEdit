# 検索・置換パネル UI 刷新（右上フロート2行レイアウト） ウォークスルー (Walkthrough)

## 概要
CodeMirror 6 への移行時に仮導入されていたデフォルトの横長英語検索パネルを廃止し、Ver 0.1 系で好評だった**エディタ右上フロート型・コンパクトな2行レイアウト（日本語対応・大文字区別Aa内包・件数表示・スムーズスクロール・Undo/Redo連動）**に刷新いたしました。
また、F1キーで開くヘルプ画面（ショートカット一覧）にも「検索・置換」カテゴリを新設し、各種操作方法を掲載いたしました。

---

## 実施内容

### 1. 検索・置換ウィジェット HTML & スタイルの復元
- **HTML ([index.html](file:///c:/work/NoCapEdit/src/frontend/index.html))**:
  - 1行目: `[検索入力欄  Aa]`、`0 / 0` マッチ件数表示、`▲`（前へ）、`▼`（次へ）、`✕`（閉じる）
  - 2行目: `[置換入力欄]`、`置換` ボタン、`すべて置換` ボタン
- **CSS ([style.css](file:///c:/work/NoCapEdit/src/frontend/style.css))**:
  - エディタ右上に浮遊配置（`top: 10px; right: 20px;`）、角丸カード＋ドロップシャドウ
  - ダーク / ソフトダーク / ライトの全テーマ配色に完全連動

### 2. `findReplace.js` モジュールの新設 ([findReplace.js](file:///c:/work/NoCapEdit/src/frontend/js/ui/findReplace.js))
- **CodeMirror 6 連携**:
  - `selectAndScrollTo`: マッチ位置へ選択範囲を移動し、エディタをスムーズに中央スクロール
  - `replaceRange` / `replaceAllMatches`: 単一置換および一括置換を CodeMirror トランザクションとして実行し、**Undo/Redo 履歴を完全に保持**
- **リアルタイム件数表示**:
  - 検索文字入力時にリアルタイムでマッチ一覧と `1 / 5` などの件数を更新（マッチなし時は `0 / 0` かつ赤文字表示）
- **キーボードショートカット**:
  - `Ctrl + F`: 検索パネルを開く（エディタでテキストを選択中の場合はその単語を自動入力して全選択）
  - `Ctrl + H`: 検索・置換パネルを開く（置換段を展開）
  - `Enter` / `Shift + Enter`: 次 / 前のマッチへ移動
  - `Alt + C`: 大文字/小文字区別（`Aa`）の切り替え
  - `Alt + A`: すべて置換
  - `Esc`: パネルを閉じてエディタにフォーカス復帰

### 3. ヘルプ画面への検索・置換操作の反映 ([help.html](file:///c:/work/NoCapEdit/src/frontend/help.html), [i18n.js](file:///c:/work/NoCapEdit/src/frontend/i18n.js))
- F1ヘルプ画面に独立した「検索・置換」カテゴリを追加し、上記の全ショートカット操作一覧を掲載。

---

## 検証結果

- [x] **Vite ビルド**: `npm run build` 正常終了
- [x] **Rust コンパイル & NSIS/MSI 生成**: `cargo tauri build` 正常終了（Ver 0.2.10）
- [x] **ポータブル版 ZIP 生成**: `target/release/bundle/NoCapEdit_v0.2.10_x64_portable.zip`
- [x] **ショートカット連携 & ヘルプ表示**: `Ctrl+F` / `Ctrl+H` / `Enter` / `Shift+Enter` / `Alt+C` / `Alt+A` / `Esc` の全操作およびヘルプ画面への反映を確認完了
