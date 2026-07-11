# Soft Dark テーマの追加

カラーモードに「ソフトダーク」（グレーベースの柔らかいダークテーマ）を追加した。
あわせて、設定ドック内のテーマ切り替えUIを、現在のトグルボタンからドロップダウンに変更し、他の設定項目と統一した。

## 変更の概要

| 項目 | 変更前 | 変更後 |
|---|---|---|
| テーマ種別 | Dark / Light（2択） | ダーク / ソフトダーク / ライト（3択） |
| 切り替えUI | ボタントグル（🌙 テーマ切り替え） | ドロップダウン（他設定と統一） |
| 内部キー | `dark` / `light` | `dark` / `soft-dark` / `light` |

---

## 実装内容

### style.css

- `:root` のコメントを「Dark テーマ」に修正
- `body.soft-dark-theme { }` ブロックを新規追加（最終確定カラーパレット）

  | 変数 | 値 | 用途 |
  |---|---|---|
  | `--bg-primary` | `#282C33` | エディタ背景（Zedから実測） |
  | `--bg-secondary` | `#2F343E` | タブバー・ステータスバー背景（Zedから実測） |
  | `--bg-tertiary` | `#2d2d2d` | 非アクティブタブ・ホバー背景 |
  | `--text-primary` | `#d4d4d4` | メインテキスト |
  | `--text-secondary` | `#888888` | サブテキスト |
  | `--accent` | `#5a9fd4` | アクセント色（Dark テーマと同一） |
  | `--accent-hover` | `#7cb3db` | アクセントホバー（同上） |
  | `--border` | `#3a3a3a` | ボーダー |
  | `--status-success` | `#4ec9b0` | 成功ステータス色（同上） |
  | `--status-error` | `#f48771` | エラーステータス色（同上） |

- `.theme-toggle-btn` および `.dialog-box .theme-toggle-btn` スタイルを削除

---

### index.html

- 設定ダイアログ内の `<button id="themeToggleModal">` を `<select id="themeSelectModal">` に置き換え
- 表示名はカタカナ（ダーク / ソフトダーク / ライト）を採用し、一般向けの分かりやすさを優先

```html
<label for="themeSelectModal">テーマ:</label>
<select id="themeSelectModal" class="tab-select" title="テーマを変更">
    <option value="dark">ダーク</option>
    <option value="soft-dark">ソフトダーク</option>
    <option value="light">ライト</option>
</select>
```

---

### main.js

1. **`elements` オブジェクト**: `themeToggleModal` を `themeSelectModal` に変更
2. **`applyThemeUI(theme)` 関数**: テーマを3択に対応
   - 全テーマクラスを一度リセット（`light-theme`、`soft-dark-theme` を除去）してから適用
   - ドロップダウンの選択値を現在のテーマに同期
3. **`toggleTheme()` 関数**: 削除し `onThemeChange(newTheme)` 関数（`change` イベント版）に置き換え
4. **`setupUIEventListeners()`**: `click` リスナーを `change` リスナーに変更

---

### Rust（変更なし）

- `apply_theme()` の `let is_dark = theme != "light";` という判定により、`soft-dark` は自動的に `is_dark = true` として扱われる
- Windowsタイトルバーは OS の制約上、ダーク系とライト系の2値制御のみ可能なため、ダークとソフトダークのタイトルバー色は同一

---

### Cargo.toml

- バージョンを `0.1.31` → `0.1.32` にインクリメント

---

## Verification Plan（完了）

### 動作確認（手動）
- [x] ダーク / ソフトダーク / ライト の3テーマが設定ドックのドロップダウンで選択できる
- [x] 各テーマ切り替え時にエディタ・タブバー・ステータスバーの色が即座に反映される
- [x] ダーク・ソフトダークでタイトルバーがダーク色になる
- [x] ライトでタイトルバーがライト色になる
- [x] アプリ再起動後、前回設定したテーマが復元される
- [x] `config.json` にテーマが `soft-dark` として保存される
- [x] ソフトダークのカラーパレットが Zed 風のグレー感を持つ
