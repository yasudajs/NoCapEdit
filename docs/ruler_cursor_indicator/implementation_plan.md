# ルーラー カーソル位置インジケーター改善 実装計画書

## 1. 概要
ルーラー上に表示されているカーソル位置インジケーター（現在：全高25pxの赤い縦棒）が目立ちすぎているため、控えめで洗練されたデザインに変更する。
ユーザーとの検討・比較を経て合意された**「案2-B: ルーラー内側最下端、高さ1px、次文字位置の1文字幅（アンダーライン）」**を採用する。

---

## 2. 変更内容の詳細

### 2.1 CSSスタイルの変更 (`src/frontend/style.css`)
`.ruler-cursor` のスタイル定義を変更する。

- **現在**:
  ```css
  .ruler-cursor {
      position: absolute;
      bottom: 0;
      width: 2px;
      height: 100%;
      background-color: var(--ruler-cursor);
      pointer-events: none;
      z-index: 4;
  }
  ```
- **変更後**:
  ```css
  .ruler-cursor {
      position: absolute;
      bottom: 0;
      width: 0; /* JS側で動的に設定 */
      height: 1px;
      background-color: var(--ruler-cursor);
      pointer-events: none;
      z-index: 4;
  }
  ```
  - `height: 1px;` により、ルーラー全高（25px）から1pxへ極薄化。
  - `bottom: 0;` により、ルーラーの内側下端（グレー境界線 `border-bottom` の直上）に密着して表示。

### 2.2 JavaScriptインジケーター制御の変更 (`src/frontend/js/ui/ruler.js`)
`updateRulerCursor()` 内で、インジケーターの横幅を半角1文字幅（`getCharWidth()`）に動的設定する。

- **変更箇所**:
  ```javascript
  export function updateRulerCursor() {
      if (!elements.rulerCursor) return;
      if (!isRulerActive()) {
          elements.rulerCursor.classList.add('hidden');
          return;
      }

      const view = getEditorView();
      if (!view || !elements.rulerTrackWrapper) {
          elements.rulerCursor.classList.add('hidden');
          return;
      }

      const head = view.state.selection.main.head;
      const coords = view.coordsAtPos(head);

      if (coords && elements.rulerTrackWrapper) {
          const trackRect = elements.rulerTrackWrapper.getBoundingClientRect();
          const cursorX = coords.left - trackRect.left;
          const charWidth = getCharWidth();

          elements.rulerCursor.style.left = `${Math.round(cursorX)}px`;
          elements.rulerCursor.style.width = `${charWidth}px`;
          elements.rulerCursor.classList.remove('hidden');
      } else {
          elements.rulerCursor.classList.add('hidden');
      }
  }
  ```
  - キャレット位置（`cursorX`）を始点として、これから入力される1文字分の幅（`charWidth`）の範囲にアンダーラインが表示される。
  - フォントサイズ変更（ズーム）やウィンドウリサイズ時も `syncRulerMetrics()` から再計算され、常に正確な文字幅に追従する。

---

## 3. 影響範囲
- `src/frontend/style.css`: `.ruler-cursor` のCSS定義
- `src/frontend/js/ui/ruler.js`: `updateRulerCursor()` の幅更新ロジック
- `docs/spec.md`: ルーラー仕様項目の記載更新
- バージョン管理ファイル5点（0.2.33へのインクリメント）

---

## 4. 検証項目
1. **基本表示確認**:
   - ルーラー内側最下端に高さ1px・1文字幅の赤いアンダーラインが表示されること。
   - ルーラーの数字や目盛り、タブを遮らず上品に表示されること。
2. **カーソル追従確認**:
   - 矢印キー移動、マウスクリック、文字入力、行頭・行末移動時に正確に追従すること。
   - 横スクロール時にも目盛り線とズレずに追従すること。
3. **文字幅・ズーム連動確認**:
   - フォントサイズ変更（ズーム `Ctrl + Wheel` / `Ctrl + +/-`）時に、インジケーターの横幅が文字幅に正確に追従すること。
   - フォントファミリー変更時にも追従すること。
4. **テーマ切り替え確認**:
   - Dark、Soft Dark、Light の各テーマで視認性が保たれていること。
5. **ルーラーON/OFF連動確認**:
   - `Alt + R` または設定画面でのルーラー非表示時に、インジケーターが正しく非表示になること。
