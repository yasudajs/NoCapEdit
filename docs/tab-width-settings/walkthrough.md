# ウォークスルー: タブ幅選択機能およびタブサイズ連動リファクタリング (v0.2.31)

## 1. 概要
本改定（`v0.2.31`）では、先行レビューにおける軽微な改善提案（`tabSize` のハードコード解消・動的取得、およびタブ文字時のインデントガイド幅連動）を解決するとともに、設定ドックにおいてタブ文字の表示幅を **「2文字幅」** と **「4文字幅」** から選択可能にする機能追加を実施しました。

---

## 2. 変更内容の詳細

### 2.1 レビュー指摘対応（リファクタリング & 堅牢化）
1. **定数化と動的取得 (`src/frontend/js/ui/codemirror.js`)**:
   - `DEFAULT_TAB_SIZE = 4` を定数定義し、マジックナンバーを排除。
   - インデントガイド描画ロジック（`buildDecorations`）内で、`tabSize` を `view.state.tabSize || DEFAULT_TAB_SIZE` から動的に取得するように変更。
2. **インデントガイド幅とタブ幅の完全連動**:
   - タブ文字（`\t`）によるインデント時のインデントガイド幅（`indentUnitWidth`）を、CodeMirrorの `tabSize`（2 または 4）と完全に連動させました。
   ```javascript
   const tabSize = view.state.tabSize || DEFAULT_TAB_SIZE;
   const unitFacet = view.state.facet(indentUnit) || '    ';
   const indentUnitWidth = unitFacet.length > 0 && unitFacet !== '\t' ? unitFacet.length : tabSize;
   ```

### 2.2 タブ幅選択機能の追加
1. **設定ドックUI (`src/frontend/index.html` & `src/frontend/i18n.js`)**:
   - 「Tabキーの挙動」セレクトボックスを、一般的によく使われる「4文字幅」を先に、「2文字幅」を後に並べて一貫性を持たせました。
     - **タブ文字 (4文字幅)** (`tab4`): Tabキーで `\t` を挿入、4文字幅で表示（デフォルト）
     - **タブ文字 (2文字幅)** (`tab2`): Tabキーで `\t` を挿入、2文字幅でコンパクトに表示
     - **スペース 4文字** (`space4`): Tabキーで半角スペース4個を挿入
     - **スペース 2文字** (`space2`): Tabキーで半角スペース2個を挿入
2. **インデント拡張の更新 (`getIndentExtension`)**:
   - `indentCompartment` に `indentUnit` とあわせて `EditorState.tabSize.of(2)` または `of(4)` を設定。
   - スペース選択時にも `EditorState.tabSize` を合わせておくことで、スペースインデント設定のファイル内にタブ文字が混在している場合でも違和感なく適切な幅で表示されます。
3. **エディタ操作ヘルパー (`editor.js`)**:
   - `getIndentString()` において `tab2` および `tab4` を追加。
   - `applyIndent(tabBehavior)` を追加し、エディタ設定適用ヘルパーとして一元化。
4. **タブ切り替え時の同期 (`tabs.js`)**:
   - タブ切り替え（`switchTab`）時に `applyIndent(appState.tabBehavior)` を呼び出し、設定ドックで変更された最新のインデント設定が非アクティブタブの復帰時にも確実に即時反映されるようにしました。

### 2.3 後方互換性とサニタイズ
1. **Rust バックエンド (`src/settings.rs`)**:
   - `DEFAULT_TAB_BEHAVIOR` を `"tab4"` に更新。
   - `AppSettings::load` において、過去バージョンで保存された `"tab"` を `"tab4"` に正規化し、不正値にはフォールバックするサニタイズ処理を追加。
   - 単体テスト `test_tab_behavior_default_and_sanitize` を追加。
2. **JavaScript フロントエンド (`main.js`, `settings.js`)**:
   - 設定読み込み時に `"tab"` を `"tab4"` として安全に正規化し、セレクトボックスの選択状態を正しく反映。

---

## 3. 検証結果

### 3.1 自動テスト
- **Rust 単体テスト (`cargo test`)**:
  ```text
  running 7 tests
  test settings::tests::test_settings_clamp_ranges ... ok
  test settings::tests::test_tab_behavior_default_and_sanitize ... ok
  test settings::tests::test_indent_guides_default_and_deserialize ... ok
  test settings::tests::test_line_numbers_default_and_deserialize ... ok
  test settings::tests::test_ruler_default_and_deserialize ... ok
  test commands::tests::test_save_text_file_atomic_overwrite ... ok
  test commands::tests::test_next_available_file_path_single_digit_sequence ... ok

  test result: ok. 7 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.01s
  ```
- **フロントエンドビルド (`npm run build`)**:
  - Vite によるバンドルが警告・エラーなく正常完了（`built in 9.13s`）。

---

## 4. 変更ファイル一覧

| ファイル | 変更概要 |
|---|---|
| `Cargo.toml` | バージョンを `0.2.31` に更新 |
| `package.json` | バージョンを `0.2.31` に更新 |
| `tauri.conf.json` | バージョンを `0.2.31` に更新 |
| `nsis/installer.nsi` | `VERSION` を `0.2.31`、`VERSIONWITHBUILD` を `0.2.31.0` に更新 |
| `docs/DEVELOPMENT.md` | ポータブル版ZIP名中のバージョンを `0.2.31` に更新 |
| `docs/spec.md` | インデント設定およびインデントガイドの仕様記述を最新化 |
| `docs/USER_GUIDE.md` | インデント設定の選択肢（tab4, tab2, space4, space2）と動作説明を更新 |
| `docs/history.md` | Ver 0.2.31 の改定履歴を追記 |
| `src/settings.rs` | `DEFAULT_TAB_BEHAVIOR` 更新、サニタイズ処理および単体テスト追加 |
| `src/frontend/index.html` | セレクトボックスの option 更新（`tab4`, `tab2`, `space4`, `space2`） |
| `src/frontend/i18n.js` | 多言語化テキスト更新（`tab4`, `tab2`, `space4`, `space2`） |
| `src/frontend/js/ui/codemirror.js` | `DEFAULT_TAB_SIZE` 定義、動的取得、`indentUnitWidth` 連動、`getIndentExtension` 更新 |
| `src/frontend/js/ui/editor.js` | `getIndentString()` の `tab2`/`tab4` 対応、`applyIndent` ヘルパー追加 |
| `src/frontend/js/ui/settings.js` | 初期化時の `"tab"` → `"tab4"` 正規化 |
| `src/frontend/js/main.js` | 設定読み込み時の `"tab"` → `"tab4"` 正規化 |
| `src/frontend/js/ui/tabs.js` | `switchTab` での `applyIndent` 呼び出し追加 |
