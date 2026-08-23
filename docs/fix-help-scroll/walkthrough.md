# ヘルプ画面（F1）スクロール不具合修正 ウォークスルー (Walkthrough)

## 概要
F1キーで開くショートカット一覧画面（`help.html`）において、ウィンドウサイズを小さくした際や項目数が多い場合に縦スクロールができなくなっていた不具合を修正いたしました。

---

## 修正内容

### 1. スクロール制限の解除 ([help.html](file:///c:/work/NoCapEdit/src/frontend/help.html))
- `style.css` 側でメインウィンドウ用に指定されていた `body { height: 100vh; overflow: hidden; }` との競合を解消するため、`help.html` の `<style>` に以下を指定しました。
  ```css
  html, body {
      height: auto !important;
      min-height: 100vh !important;
      overflow-y: auto !important;
      overflow-x: hidden !important;
  }
  body {
      padding: 30px 30px 40px 30px;
      background-color: var(--bg-primary, #1e1e1e);
      color: var(--text-primary, #d4d4d4);
      box-sizing: border-box;
  }
  ```

---

## 検証結果

- [x] **Vite ビルド**: `npm run build` 正常終了
- [x] **Rust コンパイル**: `cargo build` 正常終了（Ver 0.2.8）
- [x] **スクロール動作**: `help.html` がコンテンツ量およびウィンドウサイズに応じて縦スクロール可能になることを確認
