# タブスクロールバー配色改善およびマウスホイール横スクロール機能 実装計画書

## 概要
タブが多数開かれてウィンドウ幅をオーバーフローした際の視認性と操作性を向上させるため、以下の2点を改善します。
1. **タブスクロールバーの配色変更**: 背景色と同化して見づらかったスクロールバーのつまみ（thumb）を、各テーマに合わせた薄い水色系に変更し、視認性を改善。ホバー時には少し濃くして操作感を向上。
2. **マウスホイールによる左右スクロール**: タブ表示領域にマウスカーソルがある時、マウスホイールの上下回転でタブ一覧を左右にスムーズスクロールできるようにする。

---

## 修正対象ファイル
- `src/dist/style.css` (CSSスタイル定義)
- `src/dist/js/ui/tabs.js` (または `src/dist/js/main.js` - タブUIイベント登録)

---

## 詳細設計

### 1. スクロールバーの配色変更 (`src/dist/style.css`)
各テーマのCSS変数（カスタムプロパティ）にタブスクロールバー用のカラー定義を追加し、`.tabs-container` のスクロールバースタイルに適用します。

#### テーマ別カラー定義:
- **Dark テーマ (`:root`)**
  - `--tab-scrollbar-thumb: rgba(90, 159, 212, 0.45);` (落ち着いた薄い水色)
  - `--tab-scrollbar-thumb-hover: rgba(90, 159, 212, 0.75);` (ホバー時)
  - `--tab-scrollbar-track: rgba(255, 255, 255, 0.03);`
- **Soft Dark テーマ (`body.soft-dark-theme`)**
  - `--tab-scrollbar-thumb: rgba(90, 159, 212, 0.45);`
  - `--tab-scrollbar-thumb-hover: rgba(90, 159, 212, 0.75);`
  - `--tab-scrollbar-track: rgba(255, 255, 255, 0.03);`
- **Light テーマ (`body.light-theme`)**
  - `--tab-scrollbar-thumb: rgba(0, 102, 204, 0.35);` (淡い水色ブルー)
  - `--tab-scrollbar-thumb-hover: rgba(0, 102, 204, 0.65);` (ホバー時)
  - `--tab-scrollbar-track: rgba(0, 0, 0, 0.03);`

#### スタイル定義の更新:
```css
.tabs-container::-webkit-scrollbar {
    height: 6px;
}

.tabs-container::-webkit-scrollbar-track {
    background: var(--tab-scrollbar-track);
}

.tabs-container::-webkit-scrollbar-thumb {
    background: var(--tab-scrollbar-thumb);
    border-radius: 3px;
    transition: background-color 0.2s ease;
}

.tabs-container::-webkit-scrollbar-thumb:hover {
    background: var(--tab-scrollbar-thumb-hover);
}
```

---

### 2. マウスホイールによる左右スクロール (`src/dist/js/ui/tabs.js` / `main.js`)
タブコンテナ（`#tabsContainer`）に `wheel` イベントリスナーを登録します。

#### 実装ロジック:
```javascript
export function setupTabScrollWheel() {
    const tabsContainer = elements.tabsContainer;
    if (!tabsContainer) return;

    tabsContainer.addEventListener('wheel', (e) => {
        // マウスホイールの垂直回転（deltaY）を水平スクロール（scrollLeft）に変換
        if (e.deltaY !== 0) {
            e.preventDefault();
            tabsContainer.scrollLeft += e.deltaY;
        }
    }, { passive: false });
}
```
- 初期化時（`setupUIEventListeners`）に呼び出して一度だけ登録します。
- `e.preventDefault()` を適用するため `{ passive: false }` を指定します。

---

## 検証手順

### 1. スクロールバー配色の検証
- タブを多数（10個以上）開いてウィンドウ幅をオーバーフローさせる。
- Dark、Soft Dark、Light の全テーマでタブスクロールバーのつまみ（thumb）が薄い水色で明確に視認できることを確認。
- つまみにカーソルを合わせた際、色が少し濃くなる（ホバー効果）ことを確認。

### 2. マウスホイールスクロールの検証
- タブ領域（タブ上や余白）にマウスカーソルを乗せ、マウスホイールを上下回転させた際に、タブ一覧が左右にスムーズにスクロールすることを確認。
- スクロール端（最左・最右）に達した際にも異常な挙動がないことを確認。
- 通常のタブクリック、タブ追加ボタン、閉じるボタン等の操作が問題なく行えることを確認。
