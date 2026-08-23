# ヘルプ画面（F1）スクロール修正およびリポジトリリンク設置 ウォークスルー (Walkthrough)

## 概要
F1キーで開くショートカット一覧画面（`help.html`）において、縦スクロールの不具合修正と、最下段へのリポジトリURL・バージョン情報のリンク設置を実施いたしました。

---

## 実施内容

### 1. スクロール制限の解除 ([help.html](file:///c:/work/NoCapEdit/src/frontend/help.html))
- `style.css` 側で指定されていた `body { height: 100vh; overflow: hidden; }` との競合を解消するため、`help.html` の `<style>` にて `html, body` の高さ固定を解除し、`overflow-y: auto !important` を指定。

### 2. リポジトリリンクとバージョン表記の設置 ([help.html](file:///c:/work/NoCapEdit/src/frontend/help.html), [help.js](file:///c:/work/NoCapEdit/src/frontend/js/help.js))
- ショートカット一覧の最下部に細い区切り線とともに控えめなフッター（`<footer class="help-footer">`）を追加。
- アプリ名・バージョン表記（`NoCapEdit v0.2.8`）および GitHub リポジトリリンク（`https://github.com/yasudajs/NoCapEdit`）を配置。
- リンクをクリックした際に、OS の既定ブラウザで GitHub ページが開くよう `window.__TAURI__.shell.open` イベントハンドラを実装。

---

## 検証結果

- [x] **Vite ビルド**: `npm run build` 正常終了
- [x] **Rust コンパイル**: `cargo build` 正常終了（Ver 0.2.8）
- [x] **スクロール動作**: ウィンドウサイズに応じて縦スクロールが正常に機能することを確認
- [x] **リンク機能**: 最下部の GitHub URL クリック時に外部ブラウザでリポジトリが開くことを確認
