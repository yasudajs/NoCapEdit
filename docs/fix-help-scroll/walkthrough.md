# ヘルプ画面（F1）スクロール修正および開発情報・リポジトリリンク設置 ウォークスルー (Walkthrough)

## 概要
F1キーで開くショートカット一覧画面（`help.html`）において、縦スクロールの不具合修正と、最下段への開発チーム名および GitHub リポジトリリンクの設置を実施いたしました。

---

## 実施内容

### 1. スクロール制限の解除 ([help.html](file:///c:/work/NoCapEdit/src/frontend/help.html))
- `style.css` 側で指定されていた `body { height: 100vh; overflow: hidden; }` との競合を解消するため、`help.html` の `<style>` にて `html, body` の高さ固定を解除し、`overflow-y: auto !important` を指定。

### 2. 開発チーム名とリポジトリリンクの設置 ([help.html](file:///c:/work/NoCapEdit/src/frontend/help.html), [help.js](file:///c:/work/NoCapEdit/src/frontend/js/help.js), [i18n.js](file:///c:/work/NoCapEdit/src/frontend/i18n.js))
- ショートカット一覧の最下部に細い区切り線とともに控えめなフッター（`<footer class="help-footer">`）を追加。
- 開発者情報（`開発：安田情報システム@NoCapEditチーム`）および GitHub リポジトリリンク（`https://github.com/yasudajs/NoCapEdit`）を配置。
- リンクをクリックした際に、OS の既定ブラウザで GitHub ページが開くよう `window.__TAURI__.shell.open` イベントハンドラを実装。
- 多言語化規約に従い、`i18n.js` に `help.footer` の翻訳キーを定義。

---

## 検証結果

- [x] **Vite ビルド**: `npm run build` 正常終了
- [x] **Rust コンパイル**: `cargo build` 正常終了（Ver 0.2.8）
- [x] **スクロール動作**: ウィンドウサイズに応じて縦スクロールが正常に機能することを確認
- [x] **開発情報・リンク表示**: 最下部に開発チーム名と GitHub URL が表示され、クリック時に外部ブラウザでリポジトリが開くことを確認
