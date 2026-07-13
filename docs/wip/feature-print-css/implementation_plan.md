# 印刷機能（印刷用CSS：@media print）の追加 実装計画書 (WIP)

本ドキュメントは、将来的に NoCapEdit に「テキスト印刷機能」を追加したくなった際の実装計画書（検討用）です。
ブラウザエンジンが持つ標準の印刷機能（`window.print()` / `Ctrl + P`）を利用しつつ、CSSの `@media print` 規則を用いて、アプリのUI（タブやサイドバーなど）を除外した「入力テキストのみ」を綺麗に出力する最小限の実装アプローチを定義します。

---

## 変更内容

### 1. フロントエンド（CSS）

#### [MODIFY] [style.css](file:///c:/work/NoCapEdit/src/dist/style.css)
印刷時専用のスタイル（`@media print`）を末尾に追記します。これにより、紙面に出力する際のデザインを制御します。

```css
/* ==========================================
   印刷用スタイル（紙面への出力制御）
   ========================================== */
@media print {
    /* 1. 印刷に不要なアプリUIをすべて非表示にする */
    .top-bar,
    .sidebar,
    .resize-handle,
    .status-bar,
    .dialog-overlay,
    #settingsDialog {
        display: none !important;
    }

    /* 2. レイアウトを画面全体（紙面全体）に広げる */
    html, body, .app-layout, .main-content, .app-container, .editor-container {
        width: 100% !important;
        height: 100% !important;
        margin: 0 !important;
        padding: 0 !important;
        background: #ffffff !important;
        color: #000000 !important;
        box-shadow: none !important;
    }

    /* 3. エディタ（テキスト入力欄）のスクロールバーや枠線を消し、印刷に最適化する */
    textarea.editor {
        border: none !important;
        outline: none !important;
        resize: none !important;
        width: 100% !important;
        height: auto !important; /* テキスト量に応じてページが自動改ページされるようにする */
        overflow: visible !important; /* スクロールバーを表示せず、全テキストが見えるようにする */
        font-family: inherit !important;
        font-size: 12pt !important; /* 印刷に適したフォントサイズに固定（または選択値を使用） */
        line-height: 1.6 !important;
        color: #000000 !important;
        background: transparent !important;
    }
}
```

### 2. フロントエンド（JavaScript）

#### [MODIFY] [main.js](file:///c:/work/NoCapEdit/src/dist/js/main.js) (v0.2の場合) / [main.js](file:///c:/work/NoCapEdit/src/dist/main.js) (v0.1の場合)
現在、`Ctrl + P` による印刷ショートカットは `e.preventDefault()` で禁止されています。
印刷機能を有効化する際には、この禁止処理を解除（または明示的に `window.print()` を呼び出す処理へ上書き）します。

```javascript
// 修正前（現在の状態）
if (e.key === 'p' || e.key === 'P' || e.code === 'KeyP') {
    e.preventDefault();
    return;
}

// 修正後（印刷有効化時）
if (e.key === 'p' || e.key === 'P' || e.code === 'KeyP') {
    e.preventDefault();
    window.print(); // 印刷ダイアログを起動
    return;
}
```

---

## 検証計画（将来用）

### 手動テスト
印刷機能を有効化したアプリ上で、以下の動作を確認します。

1.  **印刷画面の起動**:
    *   `Ctrl + P` キーを押した際に、ブラウザ標準の印刷プレビュー画面が立ち上がること。
2.  **プレビューの見た目確認**:
    *   プレビュー画面に「タブバー」「サイドバー」「ステータスバー」「歯車ボタン」などが写り込んでおらず、エディタに書いた「テキストのみ」が白地に黒文字で表示されていること。
    *   スクロールバーが表示されていないこと。
3.  **複数ページの処理**:
    *   テキストが長い場合、自動的に2ページ目、3ページ目へと綺麗に改ページされてプレビューに表示されること。
