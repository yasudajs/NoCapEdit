# 実装計画書レビュー: ルーラー機能の品質改善 (Ver 0.2.26)

レビュー日: 2026-09-28

---

## 総合評価

全体的に、レビュー指摘事項を正確に理解し、適切な対応方針が立てられている**良い計画書**です。
以下に確認・修正が必要な点を挙げます。

---

## ✅ 問題なし

| 項目 | 評価 |
|---|---|
| **3.3 CSSマジックナンバー解消** | `:root` に `--ruler-height` 変数を導入し、`.ruler-container` と `.ruler-guides-overlay` の両方で参照する方針は適切。 |
| **3.5 フォント変更時の同期連動** | `theme.js` の `applyFontFamily()` に `syncRulerMetrics()` を追加する方針は正しい。現状 `theme.js` にはルーラー関連の依存がなく、このファイルが最も直接的な修正箇所。 |
| **4. バージョン更新** | 5ファイルのリストが規約通り。 |

---

## ⚠️ 確認・修正が必要な点

### 1. 項目3.1: i18nのキー構造がプロジェクト規約と不一致

計画書ではフラットなドット記法で記載されている：

```javascript
'ruler.marker.tooltip': '{col}桁目マーカー ...',
```

しかし `i18n.js` の `DICT` は**ネストされたオブジェクト構造**で管理されている：

```javascript
const DICT = {
    ja: {
        folder: { delete: { error: { ... } } },
        settings: { ... },
        ...
    }
};
```

`t('ruler.marker.tooltip', { col })` の呼び出し自体は `t()` 関数がドット区切りでキーを辿る実装なので**動作上は問題ない**が、`DICT` への追加は以下のようなネスト構造にする必要がある：

```javascript
ruler: {
    marker: {
        tooltip: '{col}桁目マーカー (ドラッグで移動、クリックで削除)',
        max_reached: 'マーカーの上限（{max}個）に達しています'
    }
}
```

→ **計画書のコード例を、ネスト構造の記述に修正すべき。**

---

### 2. 項目3.2: `width: max-content` では解決しない可能性が高い

計画書の方針：

```css
.ruler-track {
    min-width: 100%;
    width: max-content;
}
```

**問題点**: `.ruler-track` は `position: absolute` であり、子要素（目盛り線の `div`）も全て `position: absolute; left: Npx` で配置されている。`position: absolute` の子要素は通常フローから外れるため、`max-content` による親の幅算出に寄与しない。結果として `max-content` が `0` となり、`min-width: 100%` のみが有効になる可能性がある。

**修正案**: CSS-only ではなく、`renderRulerTicks()` 内で JS により動的に設定する方が確実：

```javascript
// renderRulerTicks() 内で目盛り描画後に:
const charWidth = getCharWidth();
elements.rulerTrack.style.width = `${Math.ceil(totalCols * charWidth) + 10}px`;
```

→ **対象ファイルも `style.css` から `ruler.js` に変更が必要。**

---

### 3. 項目3.4: リネームの影響範囲が計画書に不足

現状のコードでは `editor.js` L8 で既にエイリアスインポートされている：

```javascript
import { applyRuler as setRulerVisible, ... } from './ruler.js';
```

`main.js`, `settings.js`, `tabs.js` からは `editor.js` の `applyRuler` を使っており、`ruler.js` のエクスポート名を直接参照しているファイルはない。

したがって修正の影響範囲は：

| ファイル | 修正内容 |
|---|---|
| `ruler.js` | `export function applyRuler` → `export function setRulerVisibility` |
| `editor.js` | `import { applyRuler as setRulerVisible, ... }` → `import { setRulerVisibility, ... }`（エイリアス不要に） |
| `editor.js` | 内部の `setRulerVisible(enable)` 呼び出しも `setRulerVisibility(enable)` に更新 |
| `main.js`, `settings.js`, `tabs.js` | **変更不要**（`editor.js` の `applyRuler` を使用しており影響なし） |

→ **計画書に `editor.js` 内の呼び出し箇所の修正方針（エイリアス削除）を明記すべき。**

---

### 4. 検証手順に「タブ切替時のルーラー状態維持」が不足

項目3.4（リネーム）はタブ切替の導線にも影響するため、検証手順に以下を追加することを推奨：

> **6. タブ切替時のルーラー状態確認**:
> - 複数タブでルーラーON/OFFをそれぞれ設定し、タブ切替時に各タブのルーラー状態が正しく復元されること。

---

## 📝 その他の軽微な指摘

- 項目3.5 のコードサンプルで `syncRulerMetrics()` 呼び出し時にルーラーが非表示の場合の考慮について：現在の `syncRulerMetrics()` は表示状態に関係なく動作する実装のため、オーバーヘッドは最小限。不要な DOM 操作を避けたい場合は `if (isRulerActive()) syncRulerMetrics();` とするのも一案。

---

## まとめ

| 項目 | 判定 | 対応 |
|---|---|---|
| 3.1 i18nキー構造 | ⚠️ 要修正 | ネストオブジェクト形式に書き直す |
| 3.2 トラック幅の動的化 | ⚠️ 要修正 | CSS `max-content` → JS動的設定に変更 |
| 3.3 CSS変数化 | ✅ OK | そのまま |
| 3.4 リネーム | ⚠️ 補足必要 | `editor.js` の修正範囲を明記 |
| 3.5 フォント同期 | ✅ OK | そのまま |
| 検証手順 | ⚠️ 追加推奨 | タブ切替テストを追加 |
