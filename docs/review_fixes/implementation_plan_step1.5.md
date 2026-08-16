# 実装計画書: Step 1.5 [置換] ボタンの常時薄青解除・ホバー時のみ薄青に 🟡

## 概要
検索・置換ウィジェットにおいて、[置換] ボタン（`replaceOneBtn`）に `primary-btn` クラスが付与されているため、通常時から常に薄青色の背景で表示されてしまっています。  
[すべて置換] ボタンと同様に、**通常時は標準のボタン背景（薄グレー）** とし、**マウスホバー時のみ薄青（アクセント色）** に変化するようスタイルを統一します。

## 対象ファイル
- [`src/dist/index.html`](file:///c:/work/NoCapEdit/src/dist/index.html)
- [`src/dist/style.css`](file:///c:/work/NoCapEdit/src/dist/style.css)

## 修正内容の詳細

### 1. [MODIFY] [index.html](file:///c:/work/NoCapEdit/src/dist/index.html)
`replaceOneBtn` のクラス指定から `primary-btn` を削除し、`class="action-btn"` に統一します。

```diff
- <button id="replaceOneBtn" class="action-btn primary-btn" title="置換 (Enter)" data-i18n="ui.find.replace">置換</button>
+ <button id="replaceOneBtn" class="action-btn" title="置換 (Enter)" data-i18n="ui.find.replace">置換</button>
```

### 2. [MODIFY] [style.css](file:///c:/work/NoCapEdit/src/dist/style.css)
不要となった `.action-btn.primary-btn` および `.action-btn.primary-btn:hover` のCSS定義を削除します。

```diff
- .action-btn.primary-btn {
-     background-color: rgba(56, 189, 248, 0.45); /* ハイライトの内側水色と同じ */
-     border-color: rgba(14, 165, 233, 0.8);      /* ハイライトの枠青と同じ */
-     color: var(--text-primary);                 /* 文字は黒（テーマのデフォルト）のまま */
- }
- 
- .action-btn.primary-btn:hover {
-     background-color: rgba(56, 189, 248, 0.65);
-     border-color: rgb(14, 165, 233);
-     color: var(--text-primary);
- }
```

## 動作確認・検証計画

### 1. ボタンスタイルの目視確認
- 検索・置換バー（`Ctrl+H`）を開く
- **通常時**: [置換] ボタンが [すべて置換] ボタンと同じ外観（通常背景色、枠線あり）で表示されることを確認
- **マウスホバー時**: [置換] ボタンにマウスを乗せた際、薄青（アクセント色）にハイライトされることを確認

### 2. テーマ追従の確認
- ダーク / ソフトダーク / ライトの3テーマすべてで、通常時およびホバー時の視認性と統一感が保たれていることを確認

### 3. 置換機能の動作確認
- [置換] ボタンのクリックおよび Enter キーでの置換機能が正常に動作することを確認
