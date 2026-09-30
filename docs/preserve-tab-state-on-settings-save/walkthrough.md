# ウォークスルー: 設定ドック保存時におけるタブ個別状態の保持 (v0.2.32)

## 1. 概要
本改定（`v0.2.32`）では、インデントガイド表示などのショートカット（`Alt + I`, `Alt + Z`, `Alt + L`, `Alt + R`）によってアクティブタブで一時的にトグルされた表示状態が、設定ドックで別の設定項目（タブ幅やフォントサイズなど）を変更した際に勝手に基本設定値で初期化・上書きされてしまう不具合を修正しました。
あわせて、インデントガイドを表示したまま設定ドックでタブ幅を切り替えた際に、新しいタブ幅に合わせてガイド線が即座に正しく再描画されるよう、CodeMirrorプラグインの更新検知を強化しました。

---

## 2. 変更内容の詳細

### 2.1 設定ドック保存処理における差分変更検知 (`src/frontend/js/ui/settings.js`)
- `saveSettings()` において、タブ個別オーバーライドが可能な4項目（`wordWrap`, `lineNumbers`, `ruler`, `indentGuides`）について、保存前の `appState` の値と比較する差分変更判定を導入しました。
- ユーザーが設定ドックで **「そのセレクトボックス自体を明示的に変更した場合」のみ**、基本設定（`appState`）の更新と現在タブへの反映（上書き）を実行するようにしました。
- タブ幅やフォントサイズなど別の設定項目を変更した際には、現在タブの一時トグル設定（`currentTab.indentGuides` 等）を上書きせず、そのまま維持します。

```javascript
const wordWrapChanged = (appState.wordWrap !== wordWrap);
const lineNumbersChanged = (appState.lineNumbers !== lineNumbers);
const rulerChanged = (appState.ruler !== ruler);
const indentGuidesChanged = (appState.indentGuides !== indentGuides);

// ... appState の更新 ...

// アクティブタブの一時設定は、設定ドックで明示的に変更された項目のみ更新して即時反映
if (appState.currentTab) {
    const currentTab = getCurrentTab();
    if (currentTab) {
        if (wordWrapChanged) currentTab.wordWrap = wordWrap;
        if (lineNumbersChanged) currentTab.lineNumbers = lineNumbers;
        if (rulerChanged) currentTab.ruler = ruler;
        if (indentGuidesChanged) currentTab.indentGuides = indentGuides;
    }
}
if (wordWrapChanged) applyWordWrap(wordWrap);
if (lineNumbersChanged) applyLineNumbers(lineNumbers);
if (rulerChanged) applyRuler(ruler);
if (indentGuidesChanged) applyIndentGuides(indentGuides);
```

### 2.2 タブ幅変更時におけるインデントガイド即時再描画 (`src/frontend/js/ui/codemirror.js`)
- `indentGuidesPlugin` の `update(update)` において、ドキュメント変更（`docChanged`）や表示領域変更（`viewportChanged`）に加え、`tabSize`（タブ幅）や `indentUnit`（インデント単位）の Facet 変更を検知する条件を追加しました。
- インデントガイドを表示した状態で設定ドックからタブ幅を変更した場合、ガイド線の描画位置が即座に新しいタブ幅（2文字幅 / 4文字幅）に合わせて再計算・再描画されます。

```javascript
update(update) {
    const tabSizeChanged = update.startState.tabSize !== update.state.tabSize;
    const indentUnitChanged = update.startState.facet(indentUnit) !== update.state.facet(indentUnit);
    if (update.docChanged || update.viewportChanged || tabSizeChanged || indentUnitChanged) {
        this.decorations = this.buildDecorations(update.view);
    }
}
```

---

## 3. 検証結果

### 3.1 自動テスト
- **Rust 単体テスト (`cargo test`)**:
  ```text
  running 7 tests
  test settings::tests::test_tab_behavior_default_and_sanitize ... ok
  test settings::tests::test_settings_clamp_ranges ... ok
  test settings::tests::test_ruler_default_and_deserialize ... ok
  test settings::tests::test_indent_guides_default_and_deserialize ... ok
  test settings::tests::test_line_numbers_default_and_deserialize ... ok
  test commands::tests::test_save_text_file_atomic_overwrite ... ok
  test commands::tests::test_next_available_file_path_single_digit_sequence ... ok

  test result: ok. 7 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.01s
  ```
- **フロントエンドビルド (`npm run build`)**:
  - Vite によるバンドルが警告・エラーなく正常完了（`built in 9.21s`）。

---

## 4. 変更ファイル一覧

| ファイル | 変更概要 |
|---|---|
| `Cargo.toml` | バージョンを `0.2.32` に更新 |
| `package.json` | バージョンを `0.2.32` に更新 |
| `tauri.conf.json` | バージョンを `0.2.32` に更新 |
| `nsis/installer.nsi` | `VERSION` を `0.2.32`、`VERSIONWITHBUILD` を `0.2.32.0` に更新 |
| `docs/DEVELOPMENT.md` | ポータブル版ZIP名中のバージョンを `0.2.32` に更新 |
| `docs/spec.md` | 設定保存時におけるタブ個別状態の保護仕様を追記 |
| `docs/history.md` | Ver 0.2.32 の改定履歴を追記 |
| `src/frontend/js/ui/settings.js` | `saveSettings()` における差分変更判定の導入（未変更のタブ個別設定を保護） |
| `src/frontend/js/ui/codemirror.js` | `indentGuidesPlugin` の `update` での `tabSize` / `indentUnit` 変更検知を追加 |
