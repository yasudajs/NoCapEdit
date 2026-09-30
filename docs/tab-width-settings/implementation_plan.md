# タブ幅選択機能およびタブサイズ連動リファクタリング 実装計画書

## 1. 概要・背景
- **背景**:
  - 先のレビュー指摘において、以下の2点（軽微な改善提案）が挙げられた。
    1. `codemirror.js` における `tabSize = 4` のハードコード解消（将来の可変タブサイズに対応できるよう動的取得・定数化する）
    2. タブ文字（`\t`）時のインデントガイド幅（`indentUnitWidth`）とタブ幅（`tabSize`）の連動
  - 現状のインデント設定（`tabBehavior`）では、スペースインデントは「2文字」「4文字」を選択できるのに対し、タブインデントはCodeMirrorのデフォルトである「4文字幅」固定となっていた。
- **目的**:
  - レビュー指摘の改善（`view.state.tabSize` の動的取得・定数化、および `indentUnitWidth` と `tabSize` の連動）を実施しコードを堅牢化する。
  - アプリ全体共通設定として、タブ文字の表示幅を **「2文字幅」** と **「4文字幅」** から選択可能にする機能を追加する。
  - 既存設定ファイル（`config.json`）との完全な後方互換性を担保する。
- **対象バージョン**: `0.2.31`

---

## 2. 仕様変更詳細

### 2.1 設定ドック（Tabキーの挙動）
設定ドック（`#tabBehaviorSelectModal`）の選択肢を以下のように拡張・更新する（一般的な4文字幅を先に、2文字幅を後に並べて一貫性を持たせる）。

| 選択肢ラベル（日本語） | 設定値（value） | 説明 |
|---|---|---|
| **タブ文字 (4文字幅)** | `tab4` | Tabキーで `\t` を挿入。表示幅は半角4文字分（デフォルト） |
| **タブ文字 (2文字幅)** | `tab2` | Tabキーで `\t` を挿入。表示幅は半角2文字分 |
| **スペース 4文字** | `space4` | Tabキーで半角スペース4個を挿入 |
| **スペース 2文字** | `space2` | Tabキーで半角スペース2個を挿入 |

※後方互換性: 既存の `config.json` 等に保存されている値 `"tab"` は、UIおよびエディタ内部で `"tab4"` と同等として透過的に扱う。

### 2.2 多言語化（i18n）
`src/frontend/i18n.js` の `ui.dialog.settings.tabBehavior` 配下に以下のキーを定義する（HTMLの `<option>` から直接参照されるため、不要な旧キー `tab` は廃止・削除し、`tab4`, `tab2`, `space4`, `space2` の4つに統一）。
- `tab4`: `"タブ文字 (4文字幅)"`
- `tab2`: `"タブ文字 (2文字幅)"`
- `space4`: `"スペース 4文字"`
- `space2`: `"スペース 2文字"`

### 2.3 CodeMirror 6 連携 (`codemirror.js`)
1. **定数化と動的取得**:
   - `DEFAULT_TAB_SIZE = 4;` を定数定義。
   - `buildDecorations(view)` 内で `tabSize` を `view.state.tabSize || DEFAULT_TAB_SIZE` から動的取得。
   - `indentUnitWidth` の計算において、タブ文字時は `tabSize` に連動させる：
     ```javascript
     const unitFacet = view.state.facet(indentUnit) || '    ';
     const indentUnitWidth = (unitFacet.length > 0 && unitFacet !== '\t') ? unitFacet.length : tabSize;
     ```
2. **インデント拡張の更新 (`getIndentExtension`)**:
   - `EditorState.tabSize` を `indentCompartment` に含める。
     - `tab2`: `[indentUnit.of('\t'), EditorState.tabSize.of(2)]`
     - `tab4` (または `tab`): `[indentUnit.of('\t'), EditorState.tabSize.of(4)]`
     - `space2`: `[indentUnit.of('  '), EditorState.tabSize.of(2)]`
     - `space4`: `[indentUnit.of('    '), EditorState.tabSize.of(4)]`
   - ※スペース選択時にも `EditorState.tabSize` を合わせておくことで、ファイル内にタブ文字が混在していた場合でも適切な幅（2 or 4）でレンダリングされる。

### 2.4 エディタ入力ヘルパー (`editor.js`)
`getIndentString()` において、`tab2` および `tab4` を追加：
```javascript
export function getIndentString() {
    switch (appState.tabBehavior) {
        case 'space2': return '  ';
        case 'space4': return '    ';
        case 'tab2':
        case 'tab4':
        case 'tab':
        default:
            return '\t';
    }
}
```

### 2.5 設定管理・同期 (`settings.js`, `tabs.js`)
1. **初期値と後方互換 (`settings.js`)**:
   - 設定読み込み時に `appState.tabBehavior === 'tab'` であれば、セレクトボックスで `'tab4'` を選択状態にする。
2. **タブ切り替え時の同期 (`tabs.js`)**:
   - `switchTab(tabId)` 内で `updateIndent(appState.tabBehavior)` を呼び出し、設定変更後に別タブへ切り替えた場合でも常に最新のインデント設定（タブ幅）が反映されるようにする。

### 2.6 バックエンド設定管理 (`settings.rs`)
- `DEFAULT_TAB_BEHAVIOR` を `"tab4"` に更新。
- サニタイズ処理を追加（`"tab"`, `"tab4"`, `"tab2"`, `"space2"`, `"space4"` 以外の不正値の場合は `"tab4"` にフォールバック、`"tab"` は `"tab4"` に正規化）。
- 単体テストの追加・更新。

---

## 3. 変更対象ファイル一覧

| ファイル | 変更内容 |
|---|---|
| `src/settings.rs` | デフォルト値更新、サニタイズ処理、単体テスト更新 |
| `src/frontend/index.html` | 設定ドックの select option 更新（`tab4`, `tab2` 追加） |
| `src/frontend/i18n.js` | 多言語化テキスト（`tab4`, `tab2` 等）の追加 |
| `src/frontend/js/ui/codemirror.js` | 定数化、`tabSize` 動的取得、`getIndentExtension` 更新、インデントガイド幅連動 |
| `src/frontend/js/ui/editor.js` | `getIndentString()` の `tab2`, `tab4` 対応 |
| `src/frontend/js/ui/settings.js` | 後方互換対応（`tab` → `tab4`） |
| `src/frontend/js/ui/tabs.js` | `switchTab` での `updateIndent` 呼び出し |
| バージョン管理5ファイル | `0.2.30` → `0.2.31` に更新 |
| ドキュメント (`docs/spec.md`, `docs/USER_GUIDE.md`) | 設定仕様および説明の最新化 |

---

## 4. 検証計画

1. **設定値の切り替えと表示の確認**:
   - 「タブ文字 (4文字幅)」選択時: タブ文字が4文字幅で表示され、インデントガイドも4文字幅ごとに引かれること。
   - 「タブ文字 (2文字幅)」選択時: タブ文字が2文字幅で表示され、インデントガイドも2文字幅ごとに引かれること。
   - 「スペース 2文字」「スペース 4文字」選択時: 従来通りの動作が維持されていること。
2. **キー入力動作の確認**:
   - Tabキー押下時に、`tab4` / `tab2` では `\t` が挿入されること。
   - `space2` / `space4` ではスペースが挿入されること。
3. **タブ切り替え・複数タブ動作の確認**:
   - 複数タブを開いた状態で設定を変更し、タブを切り替えても最新のタブ幅設定が各タブに正しく適用されること。
4. **後方互換性テスト**:
   - `config.json` に `"tab_behavior": "tab"` を書き込んだ状態で起動し、正常に `"tab4"` として解釈・表示されること。
5. **自動テスト・ビルド確認**:
   - `cargo test` が全て通過すること。
   - `npm run build` がエラーなく完了すること。
