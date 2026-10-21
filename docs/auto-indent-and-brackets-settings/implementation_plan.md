# 括弧の補完機能・自動インデント機能の設定画面追加 実装計画書

## 1. 概要・目的
現在エディタで常時有効となっている「**括弧の補完機能**」と「**自動インデント機能**」の2つについて、設定画面（右ドック）に選択項目を追加し、ユーザーがそれぞれ「有効 / 無効」を切り替え・永続化できるようにします。
デフォルト値はどちらも「**有効**（`true`）」とします。

---

## 2. 仕様設計

### 2.1 設定画面（右ドック）のUI項目
`Tabキーの挙動:` のすぐ下に、入力補助に関する設定として以下の2項目を追加します。

| 項目名（ラベル） | 設定キー (Rust / JSON) | フロントエンド状態キー | デフォルト値 | 選択肢（表示文言） |
| :--- | :--- | :--- | :--- | :--- |
| **自動インデント:** | `auto_indent` | `autoIndent` | `true` (有効) | ・`有効（自動インデントする）` (`"true"`)<br>・`無効（自動インデントしない）` (`"false"`) |
| **括弧の補完:** | `auto_close_brackets` | `autoCloseBrackets` | `true` (有効) | ・`有効（自動補完する）` (`"true"`)<br>・`無効（自動補完しない）` (`"false"`) |

- 設定を変更した瞬間に開いているタブ・エディタへ即座に反映され、`config.json` に自動保存されます。
- 設定ドック内のキーボードナビゲーション（`Tab` / `Shift + Tab` によるフォーカス移動、`↑` / `↓` での選択）にも完全対応します。
- 既存の `config.json` に該当キーが存在しない場合（旧バージョンからのアップデート時）も、デフォルト値 `true`（有効）として安全にフォールバックします。

---

### 2.2 各設定の有効・無効時の挙動

#### ① 括弧の補完 (`auto_close_brackets` / `autoCloseBrackets`)
- **有効 (`true` / デフォルト)**:
  - 半角の括弧・クォート6種（`{}`、`()`、`[]`、`""`、`''`、```` `` ````）を入力した際、閉じ文字を自動挿入してカーソルを中央に配置します。
  - 閉じ文字の直前でのオーバータイプ（重複挿入せず右へ移動）、空ペア中央での `Backspace` 同時削除、選択範囲のペア囲みが動作します。
  - 自動インデント有効時において、行末の未閉じ `{` の直後で `Enter` を押した際、3行目に閉じ波括弧 `}` を自動挿入します。
- **無効 (`false`)**:
  - CodeMirror の `closeBrackets` 拡張および `closeBracketsKeymap` を Compartment 経由で無効化（空配列 `[]` に再構成）し、開き文字入力時の自動補完・オーバータイプ・ペア同時削除・選択囲みをすべて行わないようにします。
  - 改行時（自動インデント有効時）に行末の未閉じ `{` 直後で `Enter` を押した際も、3行目への `}` 自動挿入は行いません（2行目のインデントのみ行います）。

#### ② 自動インデント (`auto_indent` / `autoIndent`)
- **有効 (`true` / デフォルト)**:
  - `Enter` キー押下時、`customInsertNewlineAndIndent` により前行の行頭空白（全角スペース・半角スペース・タブ）の引き継ぎ、プログラミング言語でのブロック開始時の1段深いインデント付与、および括弧ペア（`{}`、`[]`、`()`）間での改行展開（Bracket Explosion）を行います。
- **無効 (`false`)**:
  - `Enter` キー押下時、自動インデントや括弧展開を行わず、カーソル位置で単純な改行（選択範囲がある場合は改行で置換し、次行の先頭＝0桁目にカーソルを配置する純粋な改行処理）を行います。
  - ※CodeMirror 6 の `defaultKeymap` には標準で `Enter: insertNewlineAndIndent` が含まれているため、自動インデント無効時はフォールバックさせず、明示的にインデントなしの改行（`@codemirror/commands` の `insertNewline` 相当）を実行して完了させます。

---

## 3. 変更対象ファイル

### 3.1 バックエンド (Rust)
1. **[src/settings.rs](file:///d:/antigravity/NoCapEdit/src/settings.rs)**
   - `AppSettings` 構造体に `auto_indent: bool`、`auto_close_brackets: bool` を追加（`#[serde(default = "...")]` でともにデフォルト `true`）。
   - `SettingsResponse` 構造体に `auto_indent: bool`、`auto_close_brackets: bool` を追加。
   - `Default for AppSettings` に初期値設定を追加。
   - 単体テスト（デフォルト値 `true`、JSON欠落時の `true` フォールバック、`false` 指定時のデシリアライズ検証）を追加。
2. **[src/commands.rs](file:///d:/antigravity/NoCapEdit/src/commands.rs)**
   - `get_settings` コマンドのレスポンスに `auto_indent` と `auto_close_brackets` を追加。

### 3.2 フロントエンド (HTML / JS)
1. **[src/frontend/i18n.js](file:///d:/antigravity/NoCapEdit/src/frontend/i18n.js)**
   - 設定項目のラベル・選択肢・ツールチップ用の翻訳キー（`ui.tooltip.autoIndent`, `ui.tooltip.autoCloseBrackets`, `ui.dialog.settings.autoIndent.*`, `ui.dialog.settings.autoCloseBrackets.*`）を追加。
2. **[src/frontend/index.html](file:///d:/antigravity/NoCapEdit/src/frontend/index.html)**
   - 設定ドック内の `tabBehaviorSelectModal` の下に、`autoIndentSelectModal`（自動インデント）と `autoCloseBracketsSelectModal`（括弧の補完）のセレクトボックスを追加。
3. **[src/frontend/js/state.js](file:///d:/antigravity/NoCapEdit/src/frontend/js/state.js)**
   - `appState` に `autoIndent: true`, `autoCloseBrackets: true` を追加。
   - `elements` に `autoIndentSelectModal: null`, `autoCloseBracketsSelectModal: null` を追加。
4. **[src/frontend/js/core/settingsManager.js](file:///d:/antigravity/NoCapEdit/src/frontend/js/core/settingsManager.js)**
   - `saveApplicationSettings()` の保存オブジェクトに `auto_indent`, `auto_close_brackets` を追加。
5. **[src/frontend/js/ui/codemirror.js](file:///d:/antigravity/NoCapEdit/src/frontend/js/ui/codemirror.js)**
   - `closeBracketsCompartment` を新設し、`getDefaultExtensions()` で `autoCloseBrackets` 設定に応じて `[defaultCloseBracketsConfig, closeBrackets(), keymap.of(closeBracketsKeymap)]` と `[]` を切り替えられるようにする。
   - `updateAutoCloseBrackets(enable)` および `updateAutoIndent(enable)` を実装。
   - `customInsertNewlineAndIndent(view)` にて、`autoIndent` が無効な場合はインデントなしの単純改行を行い、`autoCloseBrackets` が無効な場合は未閉じ `{` に対する3行目 `}` 自動挿入を抑止するよう制御。
6. **[src/frontend/js/ui/editor.js](file:///d:/antigravity/NoCapEdit/src/frontend/js/ui/editor.js)**
   - `applyAutoIndent(enable)`、`applyAutoCloseBrackets(enable)` を追加。
7. **[src/frontend/js/ui/tabs.js](file:///d:/antigravity/NoCapEdit/src/frontend/js/ui/tabs.js)** / **[src/frontend/js/core/fileSystem.js](file:///d:/antigravity/NoCapEdit/src/frontend/js/core/fileSystem.js)**
   - 新規タブ作成時、既存ファイルオープン時、およびタブ切り替え時に `autoIndent` と `autoCloseBrackets` の設定状態を反映。
8. **[src/frontend/js/ui/settings.js](file:///d:/antigravity/NoCapEdit/src/frontend/js/ui/settings.js)** / **[src/frontend/js/main.js](file:///d:/antigravity/NoCapEdit/src/frontend/js/main.js)**
   - 起動時の初期値ロード、設定ドック開閉時のセレクトボックス同期、変更時のイベントリスナー登録、`Tab` キーナビゲーション配列への追加、設定保存時の即時反映を実装。

### 3.3 バージョンおよびドキュメント（実装開始時に更新）
- 新しい設定項目の追加に伴い、バージョンを `2.14.0` → `2.15.0`（MINOR更新）に更新します（`Cargo.toml`, `package.json`, `tauri.conf.json`, `nsis/installer.nsi`, `docs/DEVELOPMENT.md` の5ファイル）。
- `docs/spec.md`、`docs/USER_GUIDE.md`、`docs/history.md` を更新します。

---

## 4. 検証計画
1. **Rust 単体テスト (`cargo test`)**:
   - `AppSettings` のデフォルト値検証（`auto_indent == true`, `auto_close_brackets == true`）。
   - 既存 `config.json`（キー欠落時）からのデシリアライズ時に `true` になること、および `false` 保存・読み込みが正常に行われることを検証。
2. **フロントエンドビルド検証 (`npm run build`)**:
   - バンドルエラーや構文エラーがないことを確認。
3. **動作検証**:
   - 括弧の補完が「有効」のときに `(` `{` `"` 等が自動補完され、「無効」にすると開き文字1文字のみが入力されること。
   - 自動インデントが「有効」のときに改行でインデントが維持・増加され、「無効」にすると改行時に次行の先頭（0桁目）にカーソルが移動すること。
   - 複数タブを開いてタブを切り替えた際や、アプリ再起動後にも設定が保持・適用されていること。
