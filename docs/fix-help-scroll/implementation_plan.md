# [実装計画] ヘルプ画面（F1）のスクロール不具合修正およびリポジトリリンク設置

## 1. 概要
1. F1キーで開くヘルプ画面（ショートカット一覧 `help.html`）において、縦スクロールができなくなっていた不具合を修正する。
2. ヘルプ画面の最下段に、アプリ名・バージョン番号および GitHub リポジトリへのリンクを設置し、クリック時に既定のブラウザで開くようにする。

---

## 2. 原因と修正方針

### 1. スクロール不具合修正
- **原因**: `style.css` 側の `body { height: 100vh; overflow: hidden; }` が適用され、`help.html` の `body` 高さが固定化されていた。
- **修正**: `src/frontend/help.html` の `<style>` にて `html, body` の高さ制限を解除し、`overflow-y: auto !important` を指定。

### 2. リポジトリリンクの設置
- **配置**: ショートカット一覧の最下部に区切り線（ボーダー）と控えめなフッター領域を追加。
- **内容**:
  - アプリ名およびバージョン表記（例: `NoCapEdit v0.2.8`）
  - GitHub リポジトリリンク（`https://github.com/yasudajs/NoCapEdit`）
- **ブラウザ起動**: Tauri の `shell.open` API を利用して、リンククリック時に OS 既定のブラウザで GitHub ページを開く。

---

## 3. 変更対象ファイル

### [MODIFY] [help.html](file:///c:/work/NoCapEdit/src/frontend/help.html)
- `html, body` のスタイル修正（スクロール有効化）
- 最下部にフッター要素（`<footer class="help-footer">`）とリンクを追加
- フッター用スタイル（文字サイズ、カラー、ホバー効果など）を追加

### [MODIFY] [help.js](file:///c:/work/NoCapEdit/src/frontend/js/help.js)
- リポジトリリンクのクリック時に `window.__TAURI__.shell.open` を呼び出して外部ブラウザで開くイベントリスナーを追加

---

## 4. バージョン管理と履歴
- 修正後のバージョン: `0.2.8`
- `docs/history.md` に Ver 0.2.8 として記録

---

## 5. 検証計画

### 動作確認手順
1. `cargo tauri dev` でアプリを起動
2. `F1` キーを押してヘルプ画面を開く
3. 最下部までスクロールし、フッター領域にバージョン情報と GitHub リポジトリリンクが表示されていることを確認
4. リンクをクリックした際に、既定のWebブラウザで GitHub リポジトリページ（`https://github.com/yasudajs/NoCapEdit`）が開くことを確認
5. ウィンドウサイズ変更時にスムーズに縦スクロールできることを確認
