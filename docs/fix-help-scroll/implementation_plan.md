# [実装計画] ヘルプ画面（F1）のスクロール不具合修正

## 1. 概要
F1キーで開くヘルプ画面（ショートカット一覧 `help.html`）において、画面の高さを超えるコンテンツがある場合に縦スクロールができなくなっている不具合を修正します。

---

## 2. 原因と修正方針

### 原因
- `help.html` はテーマカラー等の変数共有のために `style.css` を読み込んでいます。
- `style.css` 側でメインウィンドウ用として定義されている `body { height: 100vh; overflow: hidden; }` が適用され、`help.html` の `body` 高さが固定化されスクロールが抑制されていました。

### 修正方針
- `src/frontend/help.html` の `<style>` にて、`html, body` に対する高さ制限を解除し、`overflow-y: auto !important` を指定することで、ウィンドウサイズに依存せずコンテンツが溢れた際に常に縦スクロールできるようにします。
- スクロールバーがテーマ配色（ダーク/ソフトダーク/ライト）と調和するようスタイルを整備します。

---

## 3. 変更対象ファイル

### [MODIFY] [help.html](file:///c:/work/NoCapEdit/src/frontend/help.html)
- `html, body` のスタイルを修正：
  ```css
  html, body {
      height: auto !important;
      min-height: 100vh !important;
      overflow-y: auto !important;
  }
  ```

---

## 4. バージョン管理と履歴
- 修正後のバージョン: `0.2.8`（内部バージョンをインクリメント）
- `docs/history.md` に Ver 0.2.8 としてヘルプ画面のスクロール修正を記録

---

## 5. 検証計画

### 動作確認手順
1. `cargo tauri dev` でアプリを起動
2. `F1` キーを押してヘルプ画面（ショートカット一覧）を開く
3. ウィンドウの高さを小さくリサイズする
4. マウスホイールまたはスクロールバーで、一番下（「その他」カテゴリの「アプリを終了 Ctrl + Q」）までスムーズにスクロールできることを確認
5. テーマを Dark / Soft Dark / Light に変更した際も同様にヘルプ画面がスクロールできることを確認
