# 不可視文字の表示（空白・タブ・改行記号の可視化） 実装計画書

## 1. 概要
ルーラーやインデントガイドの導入に伴い、インデントのズレや全角スペースの混入、行末の改行状況を一目で把握できるようにするため、半角スペース・全角スペース・タブ・改行記号を薄いグレーで可視化する機能を追加する。
設定画面からのグローバル設定に加え、ショートカットキー（`Alt + W`）によるタブ単位の一時トグル切り替えに対応する。

---

## 2. バージョンアップ方針
- **種別**: 新機能追加（MINOR）
- **バージョン**: `v2.10.3` → `v2.11.0`（※実装開始指示を受けた後にバージョン管理5ファイルを更新）

---

## 3. 要件および仕様

### 3.1 可視化対象と表示デザイン
| 対象文字 | 表示形式 | 詳細仕様 |
| :--- | :--- | :--- |
| **半角スペース** (` `) | 中央ドット | 等幅フォントの文字幅を完全に保ったまま、中央に薄いグレーの丸ドットを表示（CSS `radial-gradient`） |
| **全角スペース** (`\u3000`) | 四角記号 (`□`) | 全角1文字分の幅を維持しつつ、中央に薄いグレーの `□` 記号を重ねて表示（CSS疑似要素 `::before`） |
| **タブ文字** (`\t`) | 右矢印 (`→`) | タブ幅（2文字または4文字）の右端に薄いグレーの矢印を表示（CSS疑似要素 `::before`） |
| **改行マーク** (`\n`) | 下折れ矢印 (`↵`) | 各行の末尾に薄いグレーのキャリッジリターン記号 `↵` を表示（CodeMirror 行末 Widget、最終行で改行がない場合は非表示） |

### 3.2 テーマ連動カラー
- 各テーマのCSS変数 `--invisible-char-color` を参照:
  - **Dark**: `rgba(255, 255, 255, 0.30)`
  - **Soft Dark**: `rgba(255, 255, 255, 0.30)`
  - **Light**: `rgba(0, 0, 0, 0.28)`

### 3.3 設定と永続化
- **設定ドック項目**: `不可視文字の表示:`
  - 選択肢: `無効（表示しない）`（デフォルト） / `有効（表示する）`
  - 設定保存: `config.json`（Rust バックエンド経由）に `invisible_characters: bool` として保存・起動時復元
- **ショートカットキー**:
  - `Alt + W`: 現在のタブの不可視文字表示を一時的にトグル（ON/OFF）
- **タブごとの状態管理**:
  - 折り返し、行番号、ルーラー、インデントガイドと同様に、各タブで表示状態を保持し、タブ切り替え時にも復元。

---

## 4. 影響範囲と変更箇所

### 4.1 バックエンド（Rust）
- **`src/settings.rs`**:
  - `AppSettings` 構造体に `pub invisible_characters: bool` を追加（デフォルト `false`）
  - `SettingsResponse` 構造体に `pub invisible_characters: bool` を追加
  - `AppSettings::default()` に初期値設定
  - 単体テスト（デフォルト値・欠落時フォールバック・true時パース）を追加

### 4.2 フロントエンド（UI / 状態管理）
- **`src/frontend/js/core/settingsManager.js`**:
  - `save_settings` 呼び出しペイロードに `invisible_characters: appState.invisibleCharacters` を追加
- **`src/frontend/js/state.js`**:
  - `appState` に `invisibleCharacters: false` を追加
  - `elements` に `invisibleCharactersSelectModal` を追加
- **`src/frontend/index.html`**:
  - 設定ダイアログ内に `invisibleCharactersSelectModal` のセレクトボックスを追加
- **`src/frontend/i18n.js`**:
  - 設定項目ラベル、ツールチップ、ショートカット一覧等の多言語キーを定義
- **`src/frontend/js/ui/settings.js`**:
  - `openSettingsDialog`: セレクトボックスの初期値反映
  - `setupSettingsNavigation`: フォーカストラップの循環リストに追加
  - `saveSettings`: 設定変更時の値取得、現在タブおよびエディタへの適用、設定保存

### 4.3 エディタ・CodeMirror（描画ロジック）
- **`src/frontend/js/ui/codemirror.js`**:
  - `invisibleCharsCompartment` の定義
  - `NewlineWidget`（行末 `↵` 表示用 WidgetType）
  - `invisibleCharactersPlugin`（ViewPlugin）:
    - 可視範囲の各行を走査
    - 行内の半角スペース、全角スペース、タブ文字に `Decoration.mark` を付与
    - 改行が存在する行（`line.number < doc.lines`）の行末に `Decoration.widget` を付与
  - `updateInvisibleCharacters(enable)` 関数の追加
  - `getDefaultExtensions`, `createTabState`, `initCodeMirror` に統合
- **`src/frontend/style.css`**:
  - テーマ変数 `--invisible-char-color` を追加（Dark, Soft Dark, Light）
  - `.cm-invisible-space`, `.cm-invisible-fullwidth`, `.cm-invisible-tab`, `.cm-invisible-newline` のスタイルを定義

### 4.4 エディタ・タブ制御・ショートカット
- **`src/frontend/js/ui/editor.js`**:
  - `applyInvisibleCharacters(enable)` 関数の追加
  - `toggleInvisibleCharacters()` 関数の追加
- **`src/frontend/js/ui/tabs.js`**:
  - 新規タブ生成時に `tab.invisibleCharacters` を保持
  - `switchTab` でタブ個別の不可視文字表示状態を復元・適用
- **`src/frontend/js/ui/shortcuts.js`**:
  - `Alt + W` キーイベントを監視し、`toggleInvisibleCharacters()` を実行

### 4.5 ヘルプ画面・ドキュメント
- **`src/frontend/help.html`**:
  - 「表示」セクションに `Alt + W`（不可視文字の表示切り替え）を追加
- **`docs/SHORTCUTS.md`**:
  - 「表示」セクションに `Alt + W` を追加
- **`docs/USER_GUIDE.md`**:
  - 不可視文字の表示切り替えに関する説明を追加

---

## 5. 検証手順

1. **Rust バックエンドテスト**:
   - `cargo test test_invisible_characters` により、設定構造体のシリアライズ/デシリアライズおよびフォールバック動作を検証
2. **エディタ描画テスト**:
   - 半角スペースが薄いグレーのドットで表示されるか確認
   - 全角スペースが薄いグレーの `□` 記号で表示されるか確認
   - タブ文字が右矢印 `→` で表示されるか確認
   - 各行末に `↵` が表示され、ドキュメント最終行（改行なし）には表示されないことを確認
3. **操作性・整合性テスト**:
   - テキスト選択、コピー＆ペースト、キャレット移動、入力、全角文字入力（IME）が正常に機能するか確認
   - `Alt + W` で現在のタブのみ不可視文字表示が即座にトグルされるか確認
   - 設定画面で「不可視文字の表示」を変更した際、即時反映および次回起動時への保存が行われるか確認
   - 複数タブ間で切り替えた際、各タブのトグル状態が正しく維持されるか確認
4. **テーマテスト**:
   - Dark, Soft Dark, Light の各テーマで視認性が良好か確認
