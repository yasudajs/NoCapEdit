# タブオーバーフロー時の自動スクロール実装計画

現在の実装では、多くのタブを開いた際に右側へタブが溢れてしまい、アクティブなタブが隠れて見えなくなる問題があります。
この計画では、JavaScript を用いて、タブの再描画時にアクティブなタブが自動的に可視領域へスクロールされるように修正します。

## 概要
- **対象ファイル**: `src/dist/js/ui/tabs.js`
- **変更内容**: `renderTabs()` 関数の最後で、現在アクティブなタブ要素 (`.tab.active`) を取得し、`scrollIntoView()` を使用してスクロール位置を調整する。

## User Review Required
この変更は非常にシンプルで影響範囲も `tabs.js` 内に留まります。
ユーザーから既に「自動スクロール」案の同意を得ていますが、念のための実装計画書提出となります。

## Proposed Changes

### フロントエンド UI ロジック

#### [MODIFY] [tabs.js](file:///c:/work/NoCapEdit/src/dist/js/ui/tabs.js)
- `renderTabs()` の末尾に以下の処理を追加します。
  ```javascript
  const activeTab = elements.tabsContainer.querySelector('.tab.active');
  if (activeTab) {
      activeTab.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
  }
  ```

## Verification Plan

### Manual Verification
1. アプリケーションを起動する。
2. 「＋」ボタンを連打して、タブを画面右端から溢れるまで多数作成する。
3. タブが溢れた状態で新規タブを作成したとき、自動的に右へスクロールし、新しいタブ（アクティブタブ）が可視領域に収まることを確認する。
4. 左側の見えなくなった既存タブをクリックして切り替えたとき、左へ自動的にスクロールし、そのタブが可視領域に収まることを確認する。
