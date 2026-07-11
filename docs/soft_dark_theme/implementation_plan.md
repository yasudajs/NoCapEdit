# Soft Dark テーマの追加

カラーモードに「Soft Dark」（グレーベースの柔らかいダークテーマ）を追加する。
あわせて、設定ドック内のテーマ切り替えUIを、現在のトグルボタンからドロップダウンに変更し、他の設定項目と統一する。

## 変更の概要

| 項目 | 現状 | 変更後 |
|---|---|---|
| テーマ種別 | Dark / Light（2択） | Dark / Soft Dark / Light（3択） |
| 切り替えUI | ボタントグル（🌙 テーマ切り替え） | ドロップダウン（他設定と統一） |
| 内部キー | `dark` / `light` | `dark` / `soft-dark` / `light` |

---

## Proposed Changes

### CSS（テーマカラーパレット追加）

#### [MODIFY] style.css

- `:root` のコメントを「Dark テーマ」に修正（現在は「ダークモード (完全な黒ベース)」）
- `body.soft-dark-theme { }` ブロックを新規追加（Zed風グレーパレット）
  - `--bg-primary: #1e1e2e`（エディタ背景・メインの暗いグレー）
  - `--bg-secondary: #1a1a28`（タブバー・ステータスバー背景）
  - `--bg-tertiary: #2a2a3e`（非アクティブタブ・ホバー背景）
  - `--text-primary: #e8e8f0`（メインテキスト）
  - `--text-secondary: #8888a0`（サブテキスト）
  - `--accent: #5a9fd4`（アクセント色、現行Darkと同一）
  - `--accent-hover: #7cb3db`（アクセントホバー、同上）
  - `--border: #363650`（ボーダー）
  - `--status-success: #4ec9b0`（成功色、同上）
  - `--status-error: #f48771`（エラー色、同上）
- `.theme-toggle-btn` スタイル（トグルボタン専用）を削除し、テーマ選択は `.tab-select` と共通のセレクトスタイルで対応

---

### HTML（テーマ選択UIの変更）

#### [MODIFY] index.html

- 設定ダイアログ内の `<button id="themeToggleModal">` を `<select id="themeSelectModal">` に置き換える

```html
<label for="themeSelectModal">テーマ:</label>
<select id="themeSelectModal" class="tab-select" title="テーマを変更">
    <option value="dark">Dark</option>
    <option value="soft-dark">Soft Dark</option>
    <option value="light">Light</option>
</select>
```

---

### JavaScript（テーマロジックの変更）

#### [MODIFY] main.js

1. **`elements` オブジェクト**: `themeToggleModal` を `themeSelectModal` に変更
2. **`applyThemeUI(theme)` 関数**: テーマを3択に対応させる
   - `body.light-theme`、`body.soft-dark-theme` のクラス付け外しで制御
   - ドロップダウンの選択値を現在のテーマに同期
3. **`toggleTheme()` 関数**: 削除し、`onThemeChange()` 関数（`change` イベント版）に置き換え
4. **`setupUIEventListeners()`**: `themeToggleModal` の `click` リスナーを `themeSelectModal` の `change` リスナーに変更
5. **初期化時 (`init`)**: `applyThemeUI()` 呼び出し時にドロップダウンの初期値も正しくセットされるよう対応

---

### Rust（変更なし）

#### main.rs

変更不要。現在の `let is_dark = theme != "light";` という判定で `soft-dark` も自動的に `is_dark = true` となるため、コード変更なし。

---

## Verification Plan

### 動作確認（手動）
- [ ] Dark / Soft Dark / Light の3テーマが設定ドックのドロップダウンで選択できる
- [ ] 各テーマ切り替え時にエディタ・タブバー・ステータスバーの色が即座に反映される
- [ ] Dark テーマ・Soft Dark テーマでタイトルバーがダーク色になる
- [ ] Light テーマでタイトルバーがライト色になる
- [ ] アプリ再起動後、前回設定したテーマが復元される
- [ ] `config.json` にテーマが `soft-dark` として保存される
- [ ] Soft Dark のカラーパレットが Zed 風のグレー感を持つ

### バージョン
- 変更後: `0.1.32`（インクリメント）
