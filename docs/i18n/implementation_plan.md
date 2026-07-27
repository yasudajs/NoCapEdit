# NoCapEdit i18n（多言語化）実装計画

フロントエンドの UI およびロジックにハードコードされている日本語テキストを抽出し、多言語化（i18n）対応を行うための実装計画です。

---

## 1. 設計方針

### 1.1 キー名の命名規則

- **ドット区切りの階層的キー名**を採用する（例: `status.saving`, `dialog.error_title`）。
- 既存の 4 キー（`status_ready_auto`, `status_ready_manual`, `folder_delete_error_not_empty_title`, `folder_delete_error_not_empty_msg`）は、今回の作業でドット区切り形式にリネームし統一する。
  - `status_ready_auto` → `status.ready_auto`
  - `status_ready_manual` → `status.ready_manual`
  - `folder_delete_error_not_empty_title` → `sidebar.error_folder_not_empty_title`
  - `folder_delete_error_not_empty_msg` → `sidebar.error_folder_not_empty_msg`

### 1.2 `t()` 関数のテンプレート変数対応

動的な値を含むメッセージ（ファイル名、エラー内容等）に対応するため、`t()` 関数にテンプレート変数置換機能を追加する。

```js
window.t = function(key, params = {}) {
    let text = DICT[currentLang]?.[key] ?? key;
    for (const [k, v] of Object.entries(params)) {
        text = text.replaceAll(`{${k}}`, v);
    }
    return text;
};
```

辞書側の定義例:
```js
'status.renamed': '{name} に名前変更されました',
'sidebar.confirm_trash': '「{name}」を削除してごみ箱に移動しますか？',
```

呼び出し例:
```js
t('status.renamed', { name: newName })
t('sidebar.confirm_trash', { name: fileName })
```

### 1.3 HTML 静的要素の置換方式

`index.html` 内の静的テキストは、要素に `data-i18n` 属性を付与し、起動時に一括置換するヘルパー関数 `applyTranslations()` を `i18n.js` に実装する。

```js
function applyTranslations() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        el.textContent = t(key);
    });
    document.querySelectorAll('[data-i18n-title]').forEach(el => {
        const key = el.getAttribute('data-i18n-title');
        el.title = t(key);
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        const key = el.getAttribute('data-i18n-placeholder');
        el.placeholder = t(key);
    });
}
```

設定ダイアログは初期化時点で DOM に存在するため、起動時の 1 回の適用で問題ない。

### 1.4 `en` ロケールの準備

`DICT` に空の `en` オブジェクトを用意しておき、将来の英語対応に備える。

```js
const DICT = {
    ja: { /* 全キーを定義 */ },
    en: { /* 将来追加 */ }
};
```

### 1.5 `t()` フォールバック呼び出しの廃止

現在 `sidebar.js` で `window.t ? window.t('key') : 'ハードコード'` のようなフォールバック付き呼び出しが 4 箇所あるが、`i18n.js` は `index.html` で最初に読み込まれるため `window.t` が存在しないケースは発生しない。今回の作業でフォールバック部分を削除し、`t('key')` のみの呼び出しに統一する。

---

## 2. 共通キーの統合計画

同一テキストが複数ファイルで使われている場合、共通のキーを定義して再利用する。

| キー名 | テキスト | 使用ファイル |
|---|---|---|
| `tab.unsaved` | `未保存` | tabs.js, settings.js |
| `tab.unsaved_prefix` | `[未保存` | tabs.js, settings.js |
| `status.saving` | `保存中...` | tabs.js, fileSystem.js |
| `status.saved` | `保存済み` | tabs.js, fileSystem.js |
| `status.editing` | `編集中` | tabs.js, editor.js |
| `status.save_failed` | `保存失敗` | fileSystem.js |
| `status.manual_mode_prefix` | `[手動保存モード] ` | tabs.js |
| `status.manual_save_prefix` | `[手動保存:Ctrl+S] ` | tabs.js, fileSystem.js |
| `dialog.error_title` | `エラー` | index.html, sidebar.js |
| `dialog.confirm_title` | `確認` | sidebar.js |
| `dialog.warning_title` | `警告` | sidebar.js |
| `dialog.button.cancel` | `キャンセル` | index.html |
| `sidebar.loading` | `読み込み中...` | sidebar.js（5箇所） |
| `sidebar.folder_empty` | `フォルダは空です` | sidebar.js（3箇所） |
| `sidebar.error_move_to_self` | `自分自身またはサブフォルダへは移動できません` | sidebar.js（3箇所） |
| `sidebar.moving` | `移動中...` | sidebar.js（3箇所） |
| `sidebar.error_move` | `移動に失敗しました: {error}` | sidebar.js（3箇所） |
| `sidebar.error_delete` | `削除に失敗しました: {error}` | sidebar.js（6箇所） |

---

## 3. ファイルごとの抽出要素一覧

### 3.1 `src/dist/index.html`（43項目）

#### ツールチップ（title 属性）→ `data-i18n-title` で置換

| # | 行 | テキスト | キー名 |
|---|---|---|---|
| 1 | L16 | `エクスプローラ` | `tooltip.explorer` |
| 2 | L27 | `新規タブを作成` | `tooltip.new_tab` |
| 3 | L31 | `設定` | `tooltip.settings` |
| 4 | L90 | `フォントを変更` | `tooltip.change_font` |
| 5 | L96 | `Tabキーの挙動を変更` | `tooltip.change_tab_behavior` |
| 6 | L103 | `保存モードを変更` | `tooltip.change_save_mode` |
| 7 | L109 | `文字数カウント方法を変更` | `tooltip.change_char_count` |
| 8 | L115 | `テーマを変更` | `tooltip.change_theme` |
| 9 | L122 | `動作モードを変更` | `tooltip.change_mode` |

#### テキスト要素・ラベル → `data-i18n` / `data-i18n-placeholder` で置換

| # | 行 | テキスト | 属性 | キー名 |
|---|---|---|---|---|
| 10 | L50 | `ファイル` | text | `sidebar.header_file` |
| 11 | L59 | `入力準備完了` | placeholder | `editor.placeholder` |
| 12 | L64 | `準備中...` | text | `status.initializing` |

#### 設定ダイアログ → `data-i18n` で置換

| # | 行 | テキスト | キー名 |
|---|---|---|---|
| 13 | L75 | `NoCapEdit - 設定` | `settings.dialog_title` |
| 14 | L78 | `アップデート可能です:` | `settings.update_available` |
| 15 | L79 | `リリースノートを開く` | `settings.open_release_notes` |
| 16 | L82 | `ホームフォルダ:` | `settings.home_folder_label` |
| 17 | L87 | `参照...` | `settings.button_browse` |
| 18 | L89 | `フォント:` | `settings.font_label` |
| 19 | L91 | `デフォルト (Monospace)` | `settings.font_default` |
| 20 | L95 | `Tabキーの挙動:` | `settings.tab_behavior_label` |
| 21 | L97 | `タブ文字 (\t)` | `settings.tab_char` |
| 22 | L98 | `スペース 2文字` | `settings.space2` |
| 23 | L99 | `スペース 4文字` | `settings.space4` |
| 24 | L102 | `保存モード:` | `settings.save_mode_label` |
| 25 | L104 | `自動保存（推奨）` | `settings.save_auto` |
| 26 | L105 | `手動保存(Ctrl+Sで保存)` | `settings.save_manual` |
| 27 | L108 | `文字数カウント:` | `settings.char_count_label` |
| 28 | L110 | `改行を含む（デフォルト）` | `settings.char_count_with_newline` |
| 29 | L111 | `文字数のみ（改行を除く）` | `settings.char_count_no_newline` |
| 30 | L114 | `テーマ:` | `settings.theme_label` |
| 31 | L116 | `ダーク` | `settings.theme_dark` |
| 32 | L117 | `ソフトダーク` | `settings.theme_soft_dark` |
| 33 | L118 | `ライト` | `settings.theme_light` |
| 34 | L121 | `動作モード:` | `settings.mode_label` |
| 35 | L123 | `フルモード` | `settings.mode_full` |
| 36 | L124 | `シンプルモード` | `settings.mode_simple` |

#### エラーダイアログ → `data-i18n` で置換

| # | 行 | テキスト | キー名 |
|---|---|---|---|
| 37 | L132 | `エラー` | `dialog.error_title` |
| 38 | L137 | `再試行` | `dialog.button.retry` |
| 39 | L138 | `別名で保存` | `dialog.button.save_as` |
| 40 | L139 | `キャンセル` | `dialog.button.cancel` |

#### コンテキストメニュー → `data-i18n` で置換

| # | 行 | テキスト | キー名 |
|---|---|---|---|
| 41 | L146 | `新規ファイル作成` | `context_menu.new_file` |
| 42 | L147 | `新規フォルダ作成` | `context_menu.new_folder` |
| 43 | L148 | `名前を変更` | `context_menu.rename` |
| 44 | L149 | `削除` | `context_menu.delete` |

---

### 3.2 `src/dist/js/main.js`（3項目）

| # | 行 | テキスト | キー名 | 備考 |
|---|---|---|---|---|
| 1 | L163 | `` `${newName} に名前変更されました` `` | `status.renamed` | テンプレート: `{name} に名前変更されました` |
| 2 | L227 | `'終了処理失敗'` | `status.error_exit` | |
| 3 | L333 | `'初期化エラー'` | `status.error_init` | |

---

### 3.3 `src/dist/js/ui/editor.js`（1項目）

| # | 行 | テキスト | キー名 | 備考 |
|---|---|---|---|---|
| 1 | L78 | `'編集中'` | `status.editing` | tabs.js と共通キー |

---

### 3.4 `src/dist/js/ui/settings.js`（14項目）

| # | 行 | テキスト | キー名 | 備考 |
|---|---|---|---|---|
| 1 | L77 | `'保存先フォルダが見つからないため、再設定してください'` | `settings.hint_folder_missing` | |
| 2 | L78 | `'ここにファイルが保存されます'` | `settings.hint_folder_default` | |
| 3 | L148 | `'ホームフォルダを指定してください'` | `alert.home_folder_required` | |
| 4 | L171 | `'未保存'` | `tab.unsaved` | 共通キー（判定用） |
| 5 | L173 | `'[未保存'` | `tab.unsaved_prefix` | 共通キー（判定用） |
| 6 | L174 | `` `未保存${tab.unsavedNumber}` `` | `tab.unsaved_label` | テンプレート: `未保存{num}` |
| 7 | L195 | `'未保存'` | `tab.unsaved` | 共通キー（判定用） |
| 8 | L197 | `'[未保存'` | `tab.unsaved_prefix` | 共通キー（判定用） |
| 9 | L198 | `` `未保存${tab.unsavedNumber}` `` | `tab.unsaved_label` | テンプレート: `未保存{num}` |
| 10 | L217 | `'設定保存エラー'` | `status.error_save_settings` | |
| 11 | L253 | `'システムフォントを読み込み中...'` | `status.loading_fonts` | |
| 12 | L261 | `'等幅フォント'` | `settings.font_group_mono` | |
| 13 | L264 | `'その他のフォント'` | `settings.font_group_other` | |
| 14 | L290 | `'フォント読み込み失敗'` | `status.error_load_fonts` | |

---

### 3.5 `src/dist/js/ui/tabs.js`（11項目）

| # | 行 | テキスト | キー名 | 備考 |
|---|---|---|---|---|
| 1 | L15 | `'未保存'` | `tab.unsaved` | 共通キー |
| 2 | L49 | `` `[手動保存モード] ${message}` `` | `status.manual_mode_prefix` | テンプレート: `[手動保存モード] {message}` |
| 3 | L67 | `'保存中...'` | `status.saving` | 共通キー |
| 4 | L69 | `'編集中'` | `status.editing` | 共通キー |
| 5 | L71 | `'保存済み'` | `status.saved` | 共通キー |
| 6 | L86 | `'[手動保存:Ctrl+S] '` | `status.manual_save_prefix` | 共通キー |
| 7 | L95 | `'ホームフォルダ未設定'` | `status.error_no_home_folder` | |
| 8 | L109 | `'[未保存'` | `tab.unsaved_prefix` | 共通キー（判定用） |
| 9 | L111 | `` `[未保存${tab.unsavedNumber}] ${newFileName}` `` | `tab.unsaved_title` | テンプレート: `[未保存{num}] {name}` |
| 10 | L131 | `'新規ファイル作成失敗'` | `status.error_create_new_file` | |
| 11 | L192 | `'タブ切替失敗'` | `status.error_switch_tab` | |

---

### 3.6 `src/dist/js/core/fileSystem.js`（20項目）

| # | 行 | テキスト | キー名 | 備考 |
|---|---|---|---|---|
| 1 | L12 | `` `${message}\n\n[OK]でリトライ、[キャンセル]で中止` `` | `dialog.retry_or_cancel` | テンプレート: `{message}\n\n[OK]でリトライ、[キャンセル]で中止` |
| 2 | L49 | `'別名保存ダイアログを利用できません'` | `status.error_save_dialog_unavailable` | |
| 3 | L74 | `'別名で保存済み'` | `status.saved_as` | |
| 4 | L157 | `'空ファイル削除失敗'` | `status.error_delete_empty_file` | |
| 5 | L173 | `'保存中...'` | `status.saving` | 共通キー |
| 6 | L175 | `'保存済み'` | `status.saved` | 共通キー |
| 7 | L180 | `` `保存に失敗しました。\n対象: ${tab.fileName}\n理由: ${error}` `` | `dialog.save_failed_detail` | テンプレート: `保存に失敗しました。\n対象: {name}\n理由: {error}` |
| 8 | L199 | `'処理を中止しました'` | `status.aborted` | |
| 9 | L228 | `'保存中...'` | `status.saving` | 共通キー |
| 10 | L234 | `` `${tab.fileName} を作成` `` | `status.file_created` | テンプレート: `{name} を作成` |
| 11 | L236 | `'保存済み'` | `status.saved` | 共通キー |
| 12 | L243 | `'保存失敗'` | `status.save_failed` | |
| 13 | L264 | `'保存中...'` | `status.saving` | 共通キー |
| 14 | L275 | `'[手動保存:Ctrl+S] '` | `status.manual_save_prefix` | 共通キー |
| 15 | L277 | `` `${tab.fileName} を作成` `` | `status.file_created` | 共通キー・テンプレート |
| 16 | L279 | `'保存済み'` | `status.saved` | 共通キー |
| 17 | L286 | `'保存失敗'` | `status.save_failed` | |
| 18 | L300 | `'ファイルを読み込み中...'` | `status.loading_file` | |
| 19 | L319 | `` `${tab.fileName} を開きました` `` | `status.file_opened` | テンプレート: `{name} を開きました` |
| 20 | L322 | `'ファイル読み込み失敗'` | `status.error_load_file` | |

---

### 3.7 `src/dist/js/ui/sidebar.js`（61項目 → ユニークキー 28）

sidebar.js は同一テキストが多数の箇所で使われているため、共通キーとして統合する。以下はユニークなキーの一覧と、それが使われている全行番号を記載する。

#### D&D / コピー / 切り取り / 貼り付け関連

| # | キー名 | テキスト | 使用行 |
|---|---|---|---|
| 1 | `sidebar.error_move_to_self` | `自分自身またはサブフォルダへは移動できません` | L329, L739, L925 |
| 2 | `sidebar.error_copy_to_self` | `自分自身またはサブフォルダへはコピーできません` | L771 |
| 3 | `sidebar.moving` | `移動中...` | L339, L744, L935 |
| 4 | `sidebar.moved_to_root` | `ルートへ移動しました` | L347, L941 |
| 5 | `sidebar.moved_to` | `{source} を {target} へ移動しました` | L347, L943 |
| 6 | `sidebar.moved` | `移動しました` | L755 |
| 7 | `sidebar.moved_to_folder` | `{target} へ移動しました` | L757 |
| 8 | `sidebar.move_completed` | `移動が完了しました` | L763 |
| 9 | `sidebar.error_move` | `移動に失敗しました: {error}` | L350, L766, L946 |
| 10 | `sidebar.copied` | `{name} をコピーしました` | L708 |
| 11 | `sidebar.cut` | `{name} を切り取りました` | L718 |
| 12 | `sidebar.no_clipboard` | `コピーまたは切り取りされたファイル/フォルダがありません` | L724 |
| 13 | `sidebar.pasting` | `貼り付け中...` | L776 |
| 14 | `sidebar.pasted_to_root` | `コピーしました` | L787 |
| 15 | `sidebar.pasted_to` | `{target} へコピーしました` | L789 |
| 16 | `sidebar.paste_completed` | `貼り付けが完了しました` | L794 |
| 17 | `sidebar.error_copy` | `コピーに失敗しました: {error}` | L797 |

#### ツリー表示関連

| # | キー名 | テキスト | 使用行 |
|---|---|---|---|
| 18 | `sidebar.tree_error` | `読み込みエラー: {error}` | L374 |
| 19 | `sidebar.folder_empty` | `フォルダは空です` | L390, L396, L1232 |
| 20 | `sidebar.loading` | `読み込み中...` | L536, L963, L1098, L1728, L1768 |

#### 新規作成・名前変更関連

| # | キー名 | テキスト | 使用行 |
|---|---|---|---|
| 21 | `sidebar.default_folder_name` | `新しいフォルダ` | L1124 |
| 22 | `sidebar.default_file_name` | `名称未設定` | L1124 |
| 23 | `sidebar.error_create` | `作成に失敗しました: {error}` | L1215, L1217 |
| 24 | `sidebar.error_rename` | `名前変更に失敗しました: {error}` | L1379, L1381 |

#### 削除関連

| # | キー名 | テキスト | 使用行 |
|---|---|---|---|
| 25 | `sidebar.confirm_trash` | `「{name}」を削除してごみ箱に移動しますか？` | L1430, L1434 |
| 26 | `sidebar.confirm_permanent_delete` | `「{name}」をごみ箱に入れず、完全に削除しますか？\n※この操作は取り消せません。` | L1554, L1558 |
| 27 | `sidebar.permanently_deleted` | `完全に削除しました` | L1646 |
| 28 | `sidebar.error_delete` | `削除に失敗しました: {error}` | L1487, L1511, L1539, L1541, L1617, L1641, L1666 |

#### 既存キーのリネーム（フォールバック廃止）

| # | 旧キー名 | 新キー名 | 使用行 |
|---|---|---|---|
| 29 | `folder_delete_error_not_empty_title` | `sidebar.error_folder_not_empty_title` | L1521, L1649 |
| 30 | `folder_delete_error_not_empty_msg` | `sidebar.error_folder_not_empty_msg` | L1522, L1650 |

#### ダイアログのタイトル（共通キー）

sidebar.js 内の Tauri `dialog.message()` で使われるタイトル `'エラー'` (L1215, L1379, L1539) は `dialog.error_title` を再利用。`'確認'` (L1431) は `dialog.confirm_title`、`'警告'` (L1555) は `dialog.warning_title` を使用。

---

### 3.8 対象外ファイル

| ファイル | 理由 |
|---|---|
| `tauri.js` | 日本語テキストはコメント内のみ |
| `shortcuts.js` | 日本語テキストはコメントと `console.warn()` 内のみ |
| `state.js` | 日本語テキストはコメント内のみ |
| `helpers.js` | 日本語テキストなし |
| `sidebar-integration.js` | 日本語テキストはコメント内のみ |

---

## 4. キー数の集計

| カテゴリ | ユニークキー数 |
|---|---|
| `tooltip.*` | 9 |
| `sidebar.*`（header含む） | 31 |
| `editor.*` | 1 |
| `status.*` | 22 |
| `settings.*` | 27 |
| `dialog.*` | 7 |
| `context_menu.*` | 4 |
| `tab.*` | 4 |
| `alert.*` | 1 |
| **合計** | **106** |

※コード上の出現箇所は 153 箇所だが、共通キーの統合により定義するキー数は 106。

---

## 5. 実装フェーズ

### フェーズ1: `i18n.js` の拡張と基盤準備
- [x] `t()` 関数にテンプレート変数置換機能を追加する。
- [x] `applyTranslations()` ヘルパー関数を実装する。
- [x] 上記リストの全 106 キーを `DICT.ja` に一括登録する。
- [x] 空の `DICT.en` オブジェクトを追加する。
- [x] 既存の 4 キーをドット区切りにリネームする（旧キー名はエイリアスとして残存、フェーズ3で削除予定）。

### フェーズ2: `index.html` の置換（43項目）
- [x] リストに基づき `index.html` の要素に `data-i18n` / `data-i18n-title` / `data-i18n-placeholder` 属性を付与する。
- [x] `main.js` の初期化処理で `applyTranslations()` を呼び出す。

### フェーズ3: JS ファイルの逐次置換

作業量に応じてサブフェーズに分割する。

#### フェーズ3a: `main.js` + `editor.js`（4項目）
- [ ] `main.js` のハードコード文字列を `t()` 呼び出しに置換する。
- [ ] `editor.js` のハードコード文字列を `t()` 呼び出しに置換する。

#### フェーズ3b: `tabs.js`（11項目）
- [ ] 「未保存」関連のテンプレート処理を含むハードコード文字列を `t()` 呼び出しに置換する。

#### フェーズ3c: `settings.js`（14項目）
- [ ] フォントグループラベル、ヒントテキスト等のハードコード文字列を `t()` 呼び出しに置換する。
- [ ] 既存の `t()` 呼び出し（`status_ready_auto` 等）を新キー名に更新する。

#### フェーズ3d: `fileSystem.js`（20項目）
- [ ] リトライダイアログのテンプレート処理を含むハードコード文字列を `t()` 呼び出しに置換する。
- [ ] 既存の `t()` 呼び出しを新キー名に更新する。

#### フェーズ3e: `sidebar.js`（61項目 → 28 ユニークキー）
- [ ] D&D 関連のハードコード文字列を `t()` 呼び出しに置換する。
- [ ] コピー/切り取り/貼り付け関連のハードコード文字列を `t()` 呼び出しに置換する。
- [ ] ツリー表示関連のハードコード文字列を `t()` 呼び出しに置換する。
- [ ] 新規作成・名前変更関連のハードコード文字列を `t()` 呼び出しに置換する。
- [ ] 削除関連のハードコード文字列を `t()` 呼び出しに置換する。
- [ ] 既存の `t()` フォールバック呼び出し（4箇所）をシンプルな `t()` 呼び出しに統一する。

### フェーズ4: テストとクリーンアップ
- [ ] 画面上のすべての日本語表示が正常に行われるか確認する。
- [ ] 未翻訳（キー名がそのまま表示される等）がないか確認する。
- [ ] テスト項目を `task.md` に記載し、ユーザーに手動テストを依頼する。

---

## 6. 確認事項（すべて確定済み）

- ✅ キー名の命名規則 → ドット区切り統一、既存4キーもリネームする
- ✅ `t()` 関数のテンプレート変数方式 → `{name}` 形式を採用
- ✅ フェーズの分割粒度 → 現在の粒度（フェーズ1～4、フェーズ3はサブフェーズ5分割）で確定
