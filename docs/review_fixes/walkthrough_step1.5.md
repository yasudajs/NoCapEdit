# ウォークスルー: Step 1.5 [置換] ボタンの常時薄青解除・ホバー時のみ薄青に 🟡

## 変更概要
検索・置換ウィジェットにおいて、[置換] ボタン（`replaceOneBtn`）に `primary-btn` クラスが付与されていたため通常時から常に薄青色の背景で表示されていた問題を修正しました。  
[すべて置換] ボタンと同様に通常時は標準の背景色（薄グレー）とし、マウスホバー時のみ薄青（アクセント色）に変化するように統一しました。

## 変更ファイル
- [`src/dist/index.html`](file:///c:/work/NoCapEdit/src/dist/index.html)
  - `replaceOneBtn` から `primary-btn` クラスを削除し `class="action-btn"` に統一
- [`src/dist/style.css`](file:///c:/work/NoCapEdit/src/dist/style.css)
  - 不要となった `.action-btn.primary-btn` および `.action-btn.primary-btn:hover` を削除

## 検証結果
- **CSS / HTML 整合性確認**:
  - `primary-btn` クラスの参照残りが 0 件であることを確認
  - `replaceOneBtn` と `replaceAllBtn` の両方が `.action-btn` スタイルに統一されたことを確認
- **ビルド確認**: `cargo check` 正常完了
