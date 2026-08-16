# リファクタリング マスタープラン（v0.1.92 レビュー指摘事項対応）

**作成日**: 2026-08-16  
**ベースライン**: v0.1.92（コミット `46423fe`）  
**参照**: [review_v0.1.87_to_v0.1.92.md](file:///c:/work/NoCapEdit/docs/wip/review_v0.1.87_to_v0.1.92.md)

---

## 方針

- レビューで検出された **改善推奨4件 + 参考7件 = 計11件** を対処する
- **リスクの低い順**に10ステップで進め、各ステップで独立してビルド・検証を行う
- ステップ間の依存関係を排除し、途中で中断しても品質が低下しない構成とする
- 各ステップは **1バージョンの内部インクリメント** とし、小変更は統合可能とする

---

## ステップ一覧（リスク順）

| Step | リスク | 対象領域 | 概要 | レビュー分類 |
|---|---|---|---|---|
| 1 | 🟢 ゼロ | CSS | CSS変数重複の削除 + border短縮 | 🔵参考 #5, #6 |
| 2 | 🟢 ゼロ | i18n | 未使用i18nキーの削除 | 🟡改善 #4 |
| 3 | 🟢 ゼロ | HTML + i18n | `(デフォルト)` ハードコードのi18n化 | 🔵参考 #3 |
| 4 | 🟢 ゼロ | HTML + CSS | CSSクラス名 `tab-select` → `settings-select` | 🔵参考 #4 |
| 5 | 🟢 低 | HTML + CSS | help.html カテゴリ見出しのセマンティクス改善 | 🔵参考 #7 |
| 6 | 🟢 低 | HTML | WAI-ARIA属性の付与 | 🟡改善 #3 |
| 7 | 🟡 中 | Rust | `&PathBuf` → `&Path` 引数型の慣用化 | 🔵参考 #1 |
| 8 | 🟡 中 | Rust + TOML | テストのRAIIパターン化（`tempfile` 導入） | 🔵参考 #2 |
| 9 | 🟡 中 | Rust | 設定値のバリデーション（`clamp`） | 🟡改善 #2 |
| 10 | 🔴 高 | Rust | ファイル保存のアトミック性改善 | 🟡改善 #1 |

---

## Step 1: CSS変数重複の削除 + border短縮記述

> **リスク**: 🟢 ゼロ（スタイルのみ、ロジック変更なし）

### 対象ファイル
- [`style.css`](file:///c:/work/NoCapEdit/src/dist/style.css)

### 修正内容

#### 1-A. テーマ間で同値のCSS変数重複を削除
`:root`（L24-30）で定義されている以下の変数は、`body.light-theme`（L54-60）と `body.soft-dark-theme`（L79-85）でも**全く同じ値**で再定義されている。`:root` のみに残し、テーマ側の再定義を削除する。

削除対象の変数（3テーマで同値）:
```css
--search-match-bg: rgba(234, 179, 8, 0.38);
--search-match-border: rgba(234, 179, 8, 0.6);
--search-current-bg: rgba(56, 189, 248, 0.45);
--search-current-border: rgba(14, 165, 233, 0.8);
--editor-selection-bg: rgba(56, 189, 248, 0.3);
--focus-outline: #0ea5e9;
--tab-scrollbar-track: transparent;
```

#### 1-B. border記述の短縮
`#settingsDialog .dialog-box`（L663-666）の冗長な border 記述を短縮する。

```diff
-    border-left: 1px solid var(--border);
-    border-top: none;
-    border-bottom: none;
-    border-right: none;
+    border: none;
+    border-left: 1px solid var(--border);
```

### 検証方法
- `npm run tauri dev` で起動
- 3テーマ（Dark / Soft Dark / Light）すべてに切り替え、以下を目視確認:
  - 検索ハイライト色
  - フォーカスアウトライン色
  - 設定ドックの左ボーダー
  - タブスクロールバーの配色

---

## Step 2: 未使用i18nキーの削除

> **リスク**: 🟢 ゼロ（参照箇所0件のキーを削除するのみ）

### 対象ファイル
- [`i18n.js`](file:///c:/work/NoCapEdit/src/dist/i18n.js)

### 修正内容
`ui.dialog.settings.font.loading`（L194）を削除する。

- **残す方**: `settings.font.loading`（L38） — [`theme.js`](file:///c:/work/NoCapEdit/src/dist/js/ui/theme.js) L39 で参照中
- **削除する方**: `ui.dialog.settings.font.loading`（L194） — **参照箇所0件**（完全に未使用）

```diff
                 font: {
                     label: "フォント:",
                     default: "デフォルト (Monospace)",
-                    loading: "フォント読み込み中..."
                 },
```

### 検証方法
- `npm run tauri dev` で起動
- 設定画面 → フォントセレクトボックスをクリック → 「フォント読み込み中...」が表示されることを確認
- ブラウザコンソールにエラーが出ていないことを確認

---

## Step 3: `(デフォルト)` ハードコードのi18n化

> **リスク**: 🟢 ゼロ（表示テキストの置換のみ）

### 対象ファイル
- [`index.html`](file:///c:/work/NoCapEdit/src/dist/index.html)（L106, L128）
- [`i18n.js`](file:///c:/work/NoCapEdit/src/dist/i18n.js)

### 修正内容

#### 3-A. i18n辞書にキーを追加
```javascript
// i18n.js の ui.dialog.settings 配下に追加
fontSize: {
    // 既存の label, tooltip はそのまま
    defaultLabel: "(デフォルト)"  // 新規追加
},
lineHeight: {
    // 既存の label, tooltip はそのまま
    defaultLabel: "(デフォルト)"  // 新規追加
}
```

#### 3-B. index.htmlのハードコード箇所を `data-i18n` に変更
```diff
 <!-- L106: フォントサイズのデフォルト option -->
-<option value="20" selected>20 pt (デフォルト)</option>
+<option value="20" selected data-i18n="ui.dialog.settings.fontSize.defaultLabel">20 pt (デフォルト)</option>
```
```diff
 <!-- L128: 行間のデフォルト option -->
-<option value="1.5" selected>1.5 (デフォルト)</option>
+<option value="1.5" selected data-i18n="ui.dialog.settings.lineHeight.defaultLabel">1.5 (デフォルト)</option>
```

> [!NOTE]
> `data-i18n` による置換後のテキストに `20 pt` や `1.5` の数値部分も含める必要がある。
> テンプレート変数（`{value} pt ({default})`）を使用するか、現在の `applyI18nToDOM()` の挙動に合わせて実装方法を検討する。

### 検証方法
- `npm run tauri dev` で起動
- 設定画面を開き、フォントサイズと行間のドロップダウンにデフォルト表記が表示されることを確認

---

## Step 4: CSSクラス名 `tab-select` → `settings-select`

> **リスク**: 🟢 ゼロ（クラス名の一括リネームのみ）

### 対象ファイル
- [`index.html`](file:///c:/work/NoCapEdit/src/dist/index.html)（7箇所）
- [`style.css`](file:///c:/work/NoCapEdit/src/dist/style.css)

### 修正内容
設定ダイアログ内の `<select>` 要素に使われている `class="tab-select"` を、セマンティクスに合った `class="settings-select"` にリネームする。

#### 対象要素（index.html 内の7箇所）:
1. L93: `#fontSizeSelectModal`
2. L122: `#lineHeightSelectModal`
3. L141: `#tabBehaviorSelectModal`
4. L148: `#saveModeSelectModal`
5. L154: `#charCountModeSelectModal`
6. L160: `#wordWrapSelectModal`
7. L166: `#themeSelectModal`

#### style.css:
`.tab-select` セレクタをすべて `.settings-select` にリネーム。

> [!IMPORTANT]
> `tab-select` が設定ダイアログ以外の場所（タブバー等）でも使用されていないか、事前に `grep` で網羅的に確認すること。
> JS側で `querySelector('.tab-select')` 等によるクラス名参照がないかも確認すること。

### 検証方法
- `npm run tauri dev` で起動
- 設定画面を開き、全セレクトボックス（フォントサイズ / 行間 / タブ動作 / 保存モード / 文字数カウント / 折り返し / テーマ）の外観と動作を確認
- キーボード操作（Tab移動、↑↓選択）が正常に動作することを確認

---

## Step 5: help.html カテゴリ見出しのセマンティクス改善

> **リスク**: 🟢 低（HTMLタグ変更 + CSS調整）

### 対象ファイル
- [`help.html`](file:///c:/work/NoCapEdit/src/dist/help.html)（L57, L87, L108, L126, L147）
- [`help.html`](file:///c:/work/NoCapEdit/src/dist/help.html) 内の `<style>` セクション

### 修正内容
カテゴリ見出しの `<div class="category">` を `<h2 class="category">` に変更する。

```diff
-<div class="category" data-i18n="help.categories.edit">テキスト編集</div>
+<h2 class="category" data-i18n="help.categories.edit">テキスト編集</h2>
```

5箇所すべて同様に変更。`<style>` 内の `.category` セレクタはタグに依存しないクラスセレクタのためCSS修正は不要（`h2` のブラウザデフォルトスタイルが干渉する場合のみ `margin` / `font-size` を調整）。

### 検証方法
- `npm run tauri dev` → `F1` でヘルプ画面を開く
- カテゴリ見出しの外観（文字サイズ、余白、色）が変更前と同一であることを確認
- 3テーマすべてで確認

---

## Step 6: WAI-ARIA属性の付与

> **リスク**: 🟢 低（HTML属性の追加のみ、ロジック変更なし）

### 対象ファイル
- [`index.html`](file:///c:/work/NoCapEdit/src/dist/index.html)（L71: `#settingsDialog`）

### 修正内容
```diff
-<div id="settingsDialog" class="dialog-overlay hidden">
+<div id="settingsDialog" class="dialog-overlay hidden" role="dialog" aria-modal="true" aria-label="設定">
```

> [!NOTE]
> `aria-label` は静的テキストとするか、`aria-labelledby` で設定ダイアログ内の見出し要素を参照する方式とするか検討。
> 設定ドックの見出し要素（もしあれば）の `id` を使用して `aria-labelledby` で参照する方が望ましい。

### 検証方法
- `npm run tauri dev` で起動
- 設定画面の開閉（`Ctrl + ,`）、キーボード操作（Tab / Esc）が正常に動作することを確認
- `aria-modal="true"` により、設定ドック外への意図しないフォーカス移動が起きないことを確認

---

## Step 7: `&PathBuf` → `&Path` 引数型の慣用化

> **リスク**: 🟡 中（Rust型シグネチャの変更、コンパイルエラーで検知可能）

### 対象ファイル
- [`commands.rs`](file:///c:/work/NoCapEdit/src/commands.rs)（L19）

### 修正内容
```diff
+use std::path::Path;
 
-fn next_available_file_path(home_folder: &PathBuf, timestamp: &str) -> Result<(String, PathBuf), String> {
+fn next_available_file_path(home_folder: &Path, timestamp: &str) -> Result<(String, PathBuf), String> {
```

呼び出し元が `&PathBuf` を渡している場合、`&Path` への自動Derefが効くため呼び出し側の修正は不要。

### 検証方法
```bash
cargo build
cargo test
```
- コンパイルエラーが出ないこと
- 全テストがパスすること

---

## Step 8: テストのRAIIパターン化（`tempfile` 導入）

> **リスク**: 🟡 中（dev-dependency追加 + テストコード修正）

### 対象ファイル
- [`Cargo.toml`](file:///c:/work/NoCapEdit/Cargo.toml)
- [`commands.rs`](file:///c:/work/NoCapEdit/src/commands.rs)（テストモジュール L179-L208）

### 修正内容

#### 8-A. dev-dependencies に `tempfile` を追加
```diff
+[dev-dependencies]
+tempfile = "3"
```

#### 8-B. テストコードをRAIIパターンに修正
```diff
+use tempfile::TempDir;
+
 #[test]
 fn test_next_available_file_path_single_digit_sequence() {
-    let temp_dir = std::env::temp_dir().join(format!("nocapedit_test_{}", uuid::Uuid::new_v4()));
-    fs::create_dir_all(&temp_dir).unwrap();
+    let temp_dir = TempDir::new().unwrap();
+    let temp_path = temp_dir.path();
     // ... テスト処理内の temp_dir 参照を temp_path に置換 ...
-    // 後始末
-    let _ = fs::remove_dir_all(&temp_dir);
+    // TempDir のドロップ時に自動クリーンアップされるため手動削除は不要
 }
```

### 検証方法
```bash
cargo test
```
- 全テストがパスすること
- テスト失敗時（意図的に `assert!` を壊して確認）にも一時ディレクトリが残らないことを確認

---

## Step 9: 設定値のバリデーション（`clamp`）

> **リスク**: 🟡 中（設定読み込みロジックの変更）

### 対象ファイル
- [`settings.rs`](file:///c:/work/NoCapEdit/src/settings.rs)

### 修正内容
`AppSettings::load()` の返却前に、`font_size` と `line_height` の範囲を制限する。

```diff
 pub fn load() -> Self {
-    if let Ok(content) = fs::read_to_string(Self::config_path()) {
-        if let Ok(settings) = serde_json::from_str(&content) {
-            return settings;
+    let mut settings = if let Ok(content) = fs::read_to_string(Self::config_path()) {
+        if let Ok(s) = serde_json::from_str(&content) {
+            s
+        } else {
+            Self::default()
         }
-    }
-    Self::default()
+    } else {
+        Self::default()
+    };
+
+    // 異常値防止: フロントエンドの入力範囲と一致させる
+    settings.font_size = settings.font_size.clamp(8, 72);
+    settings.line_height = settings.line_height.clamp(1.0, 3.0);
+
+    settings
 }
```

### 検証方法
```bash
cargo build
cargo test
```
- 正常な `config.json` で起動し、設定が正しく読み込まれること
- `config.json` を手動で `"font_size": 0` や `"font_size": 999` に変更して起動し、それぞれ 8 / 72 にクランプされることを確認
- `"line_height": 0.1` → 1.0、`"line_height": 10.0` → 3.0 にクランプされることを確認

---

## Step 10: ファイル保存のアトミック性改善

> **リスク**: 🔴 高（ファイル保存コアロジックの変更）

### 対象ファイル
- [`commands.rs`](file:///c:/work/NoCapEdit/src/commands.rs)（L111-L117: `save_text_file`）

### 修正内容
現行の `fs::remove_file` → `fs::rename` の2段階操作を、1ステップでアトミックに上書きする方式に変更する。

#### 方式A: Windows API `MoveFileExW` の直接利用
```rust
#[cfg(target_os = "windows")]
fn atomic_rename(from: &Path, to: &Path) -> std::io::Result<()> {
    use std::os::windows::ffi::OsStrExt;
    use winapi::um::winbase::{MoveFileExW, MOVEFILE_REPLACE_EXISTING};
    // ... Windows API呼び出し ...
}

#[cfg(not(target_os = "windows"))]
fn atomic_rename(from: &Path, to: &Path) -> std::io::Result<()> {
    fs::rename(from, to)
}
```

#### 方式B: `tempfile` クレートの `persist` を活用（Step 8 で導入済み前提）
```rust
use tempfile::NamedTempFile;

pub fn save_text_file(file_path: PathBuf, content: String) -> Result<(), String> {
    let parent = file_path.parent()...;
    fs::create_dir_all(parent)...;
    let normalized = normalize_crlf(&content);

    let mut tmp = NamedTempFile::new_in(parent).map_err(|e| e.to_string())?;
    std::io::Write::write_all(&mut tmp, normalized.as_bytes()).map_err(|e| e.to_string())?;
    tmp.persist(&file_path).map_err(|e| e.to_string())?;

    Ok(())
}
```

> [!WARNING]
> **方式選定時の注意点**:
> - 方式B（`tempfile::persist`）は内部で `MoveFileExW` を使用しており、Windows でもアトミックに動作する
> - ただし、`tempfile` を本番コード（非テスト）の依存に昇格させる必要がある（Step 8 では `dev-dependencies` のみ）
> - 方式Aは外部クレート不要だが、`winapi` クレートの追加が必要となり、`unsafe` コードが発生する
> - **推奨**: 方式B（`tempfile::persist`）を採用し、`tempfile` を `[dependencies]` に移動

### 検証方法
```bash
cargo build
cargo test
```
- 通常の保存動作（新規作成、上書き）が正常に動作すること
- 大量テキストの保存が問題なく完了すること
- 保存中に `.tmp` ファイルが残存しないことを確認

---

## 全体の進行ルール

1. **各ステップは独立して実施・検証**する。ステップ間の前提依存は Step 8 → Step 10 のみ。
2. **各ステップの開始時に `git status` で未コミット変更がないことを確認**する。
3. 各ステップ完了後にコミット＆プッシュし、次のステップに進む。
4. **Step 1〜6**（CSS/HTML/i18n）は小変更のため、**2〜3ステップを1バージョンに統合**してよい。
5. **Step 7〜10**（Rust）は各ステップを個別バージョンとし、`cargo build` + `cargo test` を必ず実行する。
6. Step 10 は方式選定を含むため、実装前に個別の実装計画書を作成する。
