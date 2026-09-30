# 設定ドック保存時におけるタブ個別状態の保持 実装計画書

## 1. 概要・背景
- **背景**:
  - `Alt + I`（インデントガイド）、`Alt + Z`（折り返し）、`Alt + L`（行番号）、`Alt + R`（ルーラー）の各ショートカットは、アクティブタブに対してのみ一時的に表示状態をトグルし、タブ個別設定（`currentTab.xxx`）として保持される仕様となっている。
  - しかし、インデントガイドを無効（デフォルト）から `Alt + I` で一時表示している状態で、設定ドックを開いて「Tabキーの挙動（タブ幅）」や「フォントサイズ」など別の設定を変更すると、インデントガイドが勝手に無効（非表示）に戻ってしまう不具合が確認された。
- **原因**:
  - `src/frontend/js/ui/settings.js` の `saveSettings()` において、変更された項目だけでなく、設定ドック内の全コントロール（セレクトボックス等）の値を無条件で読み取り、アクティブタブの一時設定（`currentTab.indentGuides` 等）を設定ドックの値で上書きした上で `applyIndentGuides(indentGuides)` を呼び出していた。
  - そのため、設定ドックの「インデントガイドの表示」セレクトボックスが「無効（デフォルト）」のままの場合、別項目を変更して保存されたタイミングで現在タブの一時表示フラグが `false` で強制上書きされていた（`wordWrap`, `lineNumbers`, `ruler` も同様の潜在課題あり）。
- **目的**:
  - 設定ドックでの保存処理時に、コントロールの値が **「実際にユーザーによって変更された項目」のみ** 基本設定（`appState`）の更新と現在タブへの反映を行い、変更されていない項目については各タブの個別一時状態（ショートカットでのトグル状態）を維持するように修正する。
  - タブ幅変更時に、表示中のインデントガイドが新しいタブ幅に合わせて即座に再描画・追従されるよう、CodeMirrorプラグインの更新検知を強化する。
- **対象バージョン**: `0.2.32`

---

## 2. 仕様変更詳細

### 2.1 設定保存処理の差分変更検知 (`src/frontend/js/ui/settings.js`)
`saveSettings()` において、以下の4項目（タブ個別オーバーライドが可能な項目）について、保存前の `appState` の値と比較し、変更があった場合のみ現在タブへの上書きおよびエディタ適用関数を呼び出すように改修する。

- `wordWrap`（行の折り返し）
- `lineNumbers`（行番号表示）
- `ruler`（ルーラー表示）
- `indentGuides`（インデントガイド表示）

```javascript
// 差分変更判定
const wordWrapChanged = (appState.wordWrap !== wordWrap);
const lineNumbersChanged = (appState.lineNumbers !== lineNumbers);
const rulerChanged = (appState.ruler !== ruler);
const indentGuidesChanged = (appState.indentGuides !== indentGuides);

appState.wordWrap = wordWrap;
appState.lineNumbers = lineNumbers;
appState.ruler = ruler;
appState.indentGuides = indentGuides;

// アクティブタブの一時設定は、設定ドックで明示的に変更された項目のみ上書きする
if (appState.currentTab) {
    const currentTab = getCurrentTab();
    if (currentTab) {
        if (wordWrapChanged) currentTab.wordWrap = wordWrap;
        if (lineNumbersChanged) currentTab.lineNumbers = lineNumbers;
        if (rulerChanged) currentTab.ruler = ruler;
        if (indentGuidesChanged) currentTab.indentGuides = indentGuides;
    }
}

// エディタへの適用も変更があった項目のみ実行（または現在タブの有効状態を維持）
if (wordWrapChanged) applyWordWrap(wordWrap);
if (lineNumbersChanged) applyLineNumbers(lineNumbers);
if (rulerChanged) applyRuler(ruler);
if (indentGuidesChanged) applyIndentGuides(indentGuides);
```

これにより、タブ幅やフォントサイズ、行間、保存モード等の変更時に、ショートカットで一時トグルされた各タブの個別表示状態が維持される。

### 2.2 タブ幅変更時におけるインデントガイドの即時再描画 (`src/frontend/js/ui/codemirror.js`)
`indentGuidesPlugin` の `update(update)` において、ドキュメント変更（`docChanged`）や表示領域変更（`viewportChanged`）だけでなく、タブ幅（`tabSize`）やインデント単位（`indentUnit`）の Facet が変更された場合も検知して、デコレーションを再生成するように補強する。

```javascript
update(update) {
    const tabSizeChanged = update.startState.tabSize !== update.state.tabSize;
    const indentUnitChanged = update.startState.facet(indentUnit) !== update.state.facet(indentUnit);
    if (update.docChanged || update.viewportChanged || tabSizeChanged || indentUnitChanged) {
        this.decorations = this.buildDecorations(update.view);
    }
}
```

これにより、インデントガイドを表示したまま設定ドックで「タブ文字 (4文字幅)」から「タブ文字 (2文字幅)」に切り替えた際、ガイド線の位置が即座に2文字幅間隔へ再描画される。

---

## 3. 変更対象ファイル一覧

| ファイル | 変更概要 |
|---|---|
| `src/frontend/js/ui/settings.js` | `saveSettings()` における差分変更判定の導入（未変更のタブ個別状態を保護） |
| `src/frontend/js/ui/codemirror.js` | `indentGuidesPlugin` の `update` での `tabSize` / `indentUnit` 変更検知 |
| バージョン管理5ファイル | `0.2.31` → `0.2.32` に更新 |
| ドキュメント (`docs/spec.md`, `docs/history.md`) | 仕様書の補足および変更履歴追記 |

---

## 4. 検証計画

1. **インデントガイド一時表示中の設定変更テスト**:
   - 設定ドックでインデントガイドを「無効（デフォルト）」にした状態で、エディタ上で `Alt + I` を押しインデントガイドを表示する。
   - 設定ドックを開き、「Tabキーの挙動」を `tab4` から `tab2` に変更する。
   - **確認事項**:
     - インデントガイドが消えずに表示されたまま維持されること。
     - ガイド線の間隔が即座に4文字幅から2文字幅へ再描画されること。
2. **その他の一時トグル項目の保護テスト**:
   - `Alt + Z`（折り返し）、`Alt + L`（行番号）、`Alt + R`（ルーラー）をそれぞれトグルした状態で、設定ドックでフォントサイズや保存モード等を変更する。
   - 各タブのトグル状態が勝手に基本設定に戻らず維持されること。
3. **設定ドックでの明示的変更テスト**:
   - 設定ドックの「インデントガイドの表示」セレクトボックスを明示的に「有効」に変更した場合は、アクティブタブおよび基本設定が正しく「有効」に更新されること。
4. **自動テスト・ビルド確認**:
   - `cargo test` が全件パスすること。
   - `npm run build` がエラーなく正常完了すること。
