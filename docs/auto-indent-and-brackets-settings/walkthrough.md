# ウォークスルー: 括弧の補完機能・自動インデント機能の設定画面追加 (v2.15.0)

## 1. 実装内容の概要
「**自動インデント機能**」と「**括弧の補完機能**」の2つについて、設定画面（右ドック）に有効・無効を選択できる項目を新設し、`config.json` への永続化およびエディタへの即時反映を実装しました。デフォルト値はどちらも「**有効**（`true`）」です。

---

## 2. 主な変更箇所

### 2.1 バックエンド設定・永続化 ([src/settings.rs](file:///d:/antigravity/NoCapEdit/src/settings.rs), [src/commands.rs](file:///d:/antigravity/NoCapEdit/src/commands.rs))
- `AppSettings` および `SettingsResponse` 構造体に `auto_indent: bool`、`auto_close_brackets: bool` を追加しました。
- `#[serde(default = "...")]` により、既存の `config.json` にキーが存在しない場合でもデフォルト値 `true`（有効）として安全に読み込まれます。

### 2.2 設定画面 UI と多言語辞書 ([src/frontend/index.html](file:///d:/antigravity/NoCapEdit/src/frontend/index.html), [src/frontend/i18n.js](file:///d:/antigravity/NoCapEdit/src/frontend/i18n.js))
- 設定ドック内の「Tabキーの挙動:」の下に以下の2つのセレクトボックスを追加しました：
  - **自動インデント:** `有効（自動インデントする）` [デフォルト] / `無効（自動インデントしない）`
  - **括弧の補完:** `有効（自動補完する）` [デフォルト] / `無効（自動補完しない）`
- 設定ドック内の `Tab` / `Shift + Tab` によるフォーカストラップ循環リストにも両項目を追加しました。

### 2.3 CodeMirror 6 動的設定制御 ([src/frontend/js/ui/codemirror.js](file:///d:/antigravity/NoCapEdit/src/frontend/js/ui/codemirror.js))
- **括弧の補完 (`autoCloseBrackets`)**:
  - `closeBracketsCompartment` を導入し、有効時は `[defaultCloseBracketsConfig, closeBrackets(), keymap.of(closeBracketsKeymap)]`、無効時は `[]` へ動的に再構成します。
  - 無効時は、改行（`Enter`）時における行末の未閉じ `{` に対する3行目 `}` 自動挿入も抑止します。
- **自動インデント (`autoIndent`)**:
  - `customInsertNewlineAndIndent` において、無効時はインデント引き継ぎや括弧展開を行わず、カーソル位置で単純な改行（次行の先頭＝0桁目へ移動）を実行します。
- 新規タブ作成時、既存ファイルオープン時、およびタブ切り替え時（[tabs.js](file:///d:/antigravity/NoCapEdit/src/frontend/js/ui/tabs.js), [fileSystem.js](file:///d:/antigravity/NoCapEdit/src/frontend/js/core/fileSystem.js)）にも設定が確実に同期されるよう連携しました。

---

## 3. 検証結果
1. **Rust 単体テスト (`cargo test`)**:
   - `test_auto_indent_and_brackets_default_and_deserialize` を含む全9件のテストがパスすることを確認しました（デフォルト値 `true`、JSONキー欠落時の `true` フォールバック、`false` 指定時のデシリアライズ）。
2. **フロントエンドビルド (`npm run build`)**:
   - エラーなくプロダクションビルドが完了することを確認しました。
3. **エディタ挙動の自動検証**:
   - `autoIndent=true, autoCloseBrackets=true`: 行末 `{` 直後の改行で2行目インデント＋3行目 `}` 自動補完が行われることを確認。
   - `autoIndent=true, autoCloseBrackets=false`: 行末 `{` 直後の改行で2行目のインデントのみ行われ、3行目 `}` は自動挿入されないこと、および `closeBrackets` 拡張が解除されることを確認。
   - `autoIndent=false`: インデント付き行や `{}` の間での改行時に、インデントや括弧展開を行わず次行先頭（0桁目）に単純改行されることを確認。
