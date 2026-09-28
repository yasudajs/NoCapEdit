# 実装計画書: ルーラー機能のレビュー指摘対応・品質改善 (Ver 0.2.26)

## 1. 概要
Ver 0.2.25 で追加されたルーラー機能について、コードレビューで挙がった5つの指摘事項（多言語化対応、トラック幅の動的化、CSS変数の導入、関数名の重複解消、フォント変更時の同期連動）に対応し、コードの保守性・堅牢性・UX品質を向上させます。

---

## 2. 修正対象と方針

| 項目 | 重要度 | 対象ファイル | 修正内容 |
|---|---|---|---|
| **1. マーカーtitleのi18n化** | 🔴 高 | `src/frontend/i18n.js`<br>`src/frontend/js/ui/ruler.js` | `i18n.js` のネストオブジェクト構造に従ってキーを追加し、ハードコードされている日本語ツールチップ・警告ログを `t(...)` 経由に置換 |
| **2. ルーラートラック幅の動的化** | 🟡 中 | `src/frontend/js/ui/ruler.js`<br>`src/frontend/style.css` | 子要素が `position: absolute` であるため、`renderRulerTicks()` 内で JS により動的に `style.width`（桁数×文字幅）を算出して設定。CSSの固定幅 `10000px` はフォールバック・最小幅化 |
| **3. CSSマジックナンバー解消** | 🟡 中 | `src/frontend/style.css` | `--ruler-height: 26px` 変数を導入し、コンテナ高さとガイド線位置を連動 |
| **4. `applyRuler` 名前の重複解消** | 🟡 中 | `src/frontend/js/ui/ruler.js`<br>`src/frontend/js/ui/editor.js` | `ruler.js` の関数を `setRulerVisibility` にリネーム。`editor.js` のエイリアスインポート（`applyRuler as setRulerVisible`）を解消 |
| **5. フォント変更時の同期連動** | 🟢 低 | `src/frontend/js/ui/theme.js` | `applyFontFamily()` 内で `syncRulerMetrics()` を呼び出し |

---

## 3. 詳細実装設計

### 3.1 マーカーtitleのi18n化
`src/frontend/i18n.js` の `DICT` にネストオブジェクト形式で翻訳キーを追加：
```javascript
// 日本語 (ja)
ja: {
    // ...
    ruler: {
        marker: {
            tooltip: '{col}桁目マーカー (ドラッグで移動、クリックで削除)',
            max_reached: 'マーカーの上限（{max}個）に達しています'
        }
    }
}

// 英語 (en)
en: {
    // ...
    ruler: {
        marker: {
            tooltip: 'Col {col} marker (Drag to move, click to delete)',
            max_reached: 'Maximum number of markers ({max}) reached'
        }
    }
}
```
`src/frontend/js/ui/ruler.js` で `t('ruler.marker.tooltip', { col })` および `t('ruler.marker.max_reached', { max: MAX_MARKERS })` を使用。

### 3.2 ルーラートラック幅の動的化
`ruler-track` 内の子要素はすべて `position: absolute` で配置されているため、CSS の `width: max-content` は親の幅算出に寄与せず `0` となってしまう。
そのため、`src/frontend/js/ui/ruler.js` の `renderRulerTicks()` 内で、JS により動的に幅を設定する：
```javascript
// renderRulerTicks() 内で:
const charWidth = getCharWidth();
const totalCols = DEFAULT_RULER_COLS;
// 必要幅（全桁数分 + 余白）を動的に設定
elements.rulerTrack.style.width = `${Math.ceil(totalCols * charWidth) + 10}px`;
```
`src/frontend/style.css` の `.ruler-track` は以下のように調整：
```css
.ruler-track {
    position: absolute;
    top: 0;
    left: 0;
    height: 100%;
    min-width: 100%;
    pointer-events: auto;
}
```

### 3.3 CSSマジックナンバーの解消
`src/frontend/style.css` の `:root` にルーラー高さの変数を新設し、コンテナとガイド線オーバーレイの両方で参照：
```css
:root {
    --ruler-height: 26px;
    /* ... */
}

.ruler-container {
    height: var(--ruler-height);
    /* ... */
}

.ruler-guides-overlay {
    top: var(--ruler-height);
    /* ... */
}
```

### 3.4 `applyRuler` 名前の重複解消と影響範囲
現状のコードでは `src/frontend/js/ui/editor.js` の先頭で `import { applyRuler as setRulerVisible, ... } from './ruler.js';` とエイリアスインポートされている。
他のファイル（`main.js`, `settings.js`, `tabs.js`）はすべて `editor.js` の `applyRuler` を呼び出しており、影響を受けない。

修正内容：
- `src/frontend/js/ui/ruler.js`:
  - `export function applyRuler(enable)` → `export function setRulerVisibility(enable)` にリネーム
- `src/frontend/js/ui/editor.js`:
  - `import { setRulerVisibility, ... } from './ruler.js';` に更新（不要なエイリアスを解消）
  - 内部呼び出しを `setRulerVisibility(enabled);` に統一
- `main.js`, `settings.js`, `tabs.js`:
  - 変更不要（`editor.js` の `applyRuler` を継続使用）

### 3.5 フォントファミリー変更時の同期連動
`src/frontend/js/ui/theme.js` の `applyFontFamily()` 内で、フォント変更後にルーラーの再同期を行う：
```javascript
import { syncRulerMetrics } from './ruler.js';

export function applyFontFamily() {
    if (appState.fontFamily === 'default' || !appState.fontFamily) {
        document.documentElement.style.setProperty('--editor-font-family', DEFAULT_MONOSPACE_FONTS);
    } else {
        document.documentElement.style.setProperty('--editor-font-family', `"${appState.fontFamily}", ${DEFAULT_MONOSPACE_FONTS}`);
    }
    // 等幅フォント変更による文字幅（charWidth）の変化に追従
    syncRulerMetrics();
}
```

---

## 4. バージョン更新（フェーズ2開始時）
5つの管理ファイルのバージョン番号を `0.2.25` → `0.2.26` に更新：
1. `Cargo.toml`
2. `package.json`
3. `tauri.conf.json`
4. `nsis/installer.nsi`
5. `docs/DEVELOPMENT.md`

---

## 5. 検証手順
1. **Rustテスト・ビルド確認**:
   - `cargo test` の実行（全パス確認）
   - `npm run build` の実行（エラーなく完了）
2. **多言語化（i18n）確認**:
   - マーカーにホバーしたときのツールチップ表示が `i18n.js` 定義に従って正しく表示されること。
3. **極大フォントサイズ時のルーラートラック確認**:
   - フォントサイズを 72px に拡大した際、300桁目まで目盛りが途切れず正しく描画・スクロールできること。
4. **CSS変数の連動確認**:
   - `--ruler-height` の値に基づき、ルーラーの高さと縦ガイド線の開始位置（`top`）が隙間なく一致すること。
5. **フォントファミリー変更時の再計算確認**:
   - 設定ドックで等幅フォントを変更した際、ルーラーの文字幅・目盛り間隔が即座に追従して正しく再計算されること。
6. **タブ切替時のルーラー状態確認**:
   - 複数タブでルーラーON/OFFをそれぞれ設定し、タブ切替時に各タブのルーラー状態およびマーカー配置が正しく復元されること。
