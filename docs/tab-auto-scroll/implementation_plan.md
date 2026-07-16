# タブオーバーフロー時の自動スクロールおよびキーボードナビゲーション実装計画

現在の実装では、多くのタブを開いた際に右側へタブが溢れてしまい、アクティブなタブが隠れて見えなくなる問題があります。
また、隠れたタブをキーボード操作で切り替える機能が不足していました。

この計画では、以下の2点を実装します。
1. **タブ自動スクロール**: タブの描画完了時、アクティブなタブを自動的かつ正確にスクロールして可視領域へ移動させます（画面レイアウトの崩れを防ぐため、コンテナのスクロールを直接制御します）。
2. **キーボードによるタブ切り替え**: `Ctrl + Tab` および `Ctrl + Shift + Tab` によるタブの左右切り替え（端でのループ付き）を実装します。

## 概要
- **対象ファイル**:
  - `src/dist/js/ui/tabs.js` (スクロール制御と切り替えロジックの追加)
  - `src/dist/js/main.js` (キーボードイベントのハンドリング)
  - `src/dist/style.css` (レイアウト崩れ防止の `min-width: 0` の追加)

## User Review Required

> [!NOTE]
> `Ctrl + Tab` と `Ctrl + Shift + Tab` は、一般のエディタやブラウザと同じ挙動で動作します。

## Proposed Changes

### フロントエンド UI ロジック

#### [MODIFY] [tabs.js](file:///c:/work/NoCapEdit/src/dist/js/ui/tabs.js)
- `renderTabs()` の末尾で、`requestAnimationFrame` を使ってアクティブタブを安全にスクロールさせます。
  ```javascript
  requestAnimationFrame(() => {
      const container = elements.tabsContainer;
      const activeRect = activeTab.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();
      const relativeLeft = activeRect.left - containerRect.left;
      const relativeRight = activeRect.right - containerRect.left;
      if (relativeLeft < 0) {
          container.scrollBy({ left: relativeLeft, behavior: 'smooth' });
      } else if (relativeRight > containerRect.width) {
          container.scrollBy({ left: relativeRight - containerRect.width, behavior: 'smooth' });
      }
  });
  ```
- 新たにタブのオフセット切り替え用ヘルパー関数 `switchTabByOffset(offset)` を定義します。
  ```javascript
  export async function switchTabByOffset(offset) {
      if (appState.tabs.length <= 1) return;
      const currentIdx = appState.tabs.findIndex(t => t.id === appState.currentTab);
      if (currentIdx === -1) return;
      
      let nextIdx = currentIdx + offset;
      if (nextIdx >= appState.tabs.length) {
          nextIdx = 0; // 右端なら先頭にループ
      } else if (nextIdx < 0) {
          nextIdx = appState.tabs.length - 1; // 左端なら末尾にループ
      }
      
      await switchTab(appState.tabs[nextIdx].id);
  }
  ```

#### [MODIFY] [main.js](file:///c:/work/NoCapEdit/src/dist/js/main.js)
- `window.addEventListener('keydown')` リスナーに `Ctrl + Tab` および `Ctrl + Shift + Tab` を検知する処理を追加します。
  ```javascript
  // Ctrl + Tab / Ctrl + Shift + Tab でタブ切り替え
  if (e.key === 'Tab' && e.ctrlKey) {
      e.preventDefault();
      const { switchTabByOffset } = await import('./ui/tabs.js');
      await switchTabByOffset(e.shiftKey ? -1 : 1);
      return;
  }
  ```

#### [MODIFY] [style.css](file:///c:/work/NoCapEdit/src/dist/style.css)
- `.top-bar-right`、`.tabs-group`、`.tabs-container` に `min-width: 0;` を設定し、横幅オーバーフローによるレイアウト崩れ（設定ボタンの画面外への押し出され）を防ぎます。（※対応済み）

## Verification Plan

### Manual Verification
1. アプリケーションを起動する。
2. 「＋」ボタンを連打して、タブを画面右端から溢れるまで多数作成する。
3. タブが溢れた状態で新規タブを作成したとき、自動的に右へスクロールし、新しいタブ（アクティブタブ）が可視領域に収まることを確認する。
4. 左側の見えなくなった既存タブをクリックして切り替えたとき、左へ自動的にスクロールし、そのタブが可視領域に収まることを確認する。
5. キーボードで `Ctrl + Tab` を繰り返し押し、タブが順次右に切り替わること、および右端に到達した際に一番左のタブに戻る（ループする）ことを確認する。
6. `Ctrl + Shift + Tab` を繰り返し押し、タブが順次左に切り替わること、および左端（先頭）に到達した際に一番右のタブに戻る（ループする）ことを確認する。
7. キーボードでタブを切り替えた際にも、切り替わった先のアクティブタブが自動的にスクロールし、常に可視領域に表示されることを確認する。
