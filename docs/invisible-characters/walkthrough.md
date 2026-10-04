# 不可視文字表示機能（空白・タブ・改行記号の可視化） 実装ウォークスルー

## 概要
インデントのズレや意図しない全角スペースの混入、行末の改行状況を一目で判別可能にするため、半角スペース、全角スペース、タブ文字、改行マークを薄いグレーで可視化する機能を追加しました。
バージョンを `v2.10.3` から **`v2.11.0`**（新機能追加のため MINOR アップ）へ更新しました。

---

## 主な変更点

### 1. 不可視文字の描画（CodeMirror 6 ViewPlugin）
- **半角スペース (` `)**:
  - CSS `radial-gradient` による中央の極小ドット（直径約2px、`1.2px` 半径）を表示。等幅フォントの文字幅や選択、キャレット挙動を100%維持しながら、ルーラーの小目盛りのように控えめで上品な点として描画。
- **全角スペース (`\u3000`)**:
  - 全角1文字分の幅を維持したまま、CSS疑似要素（`::before` 0.72em）により中央に薄い四角記号（`□`）を表示。
- **タブ文字 (`\t`)**:
  - 設定されたタブ幅（2文字幅または4文字幅）の右端に、CSS疑似要素（`::before` 0.75em）により薄い右矢印（`→`）を表示。
- **改行マーク (`\n`)**:
  - サクラエディタ等で親しまれている下向き左折れ矢印（`↵` 0.75em）を CodeMirror 行末 Widget として表示（改行が存在しないファイルの最終行には非表示）。
- **テーマ連動カラー（控えめな透過率）**:
  - `--invisible-char-color` を各テーマ（Dark: 22%, Soft Dark: 15%, Light: 13%）で定義し、背景に自然に溶け込む薄いグレー色で表示。テキスト選択や編集操作、IME入力への悪影響は一切ありません。

### 2. 設定と永続化（Rust バックエンド連動）
- **設定ダイアログ**:
  - 「不可視文字の表示:」セレクトボックス（`無効（表示しない）` [デフォルト] / `有効（表示する）`）を追加。
  - Rust 側 `AppSettings` および `config.json` に `invisible_characters: bool` として保存・復元。
- **ショートカットキー**:
  - `Alt + W`（Whitespace）で、作業中のアクティブタブに対してのみ不可視文字表示の ON/OFF を即座に一時トグル。
  - 他の表示系トグル（`Alt + Z`, `Alt + L`, `Alt + R`, `Alt + I`）と同様にタブ個別で状態を保持し、タブ切り替え時にも復元。

### 3. ヘルプ画面およびドキュメント
- **ヘルプ画面 (`help.html`)**: F1キーのショートカット一覧に `Alt + W`（不可視文字の表示切り替え）を追加。
- **ドキュメント**: `docs/SHORTCUTS.md`, `docs/USER_GUIDE.md`, `docs/spec.md` を更新。

---

## 変更ファイル一覧

| ファイル | 変更概要 |
| :--- | :--- |
| `Cargo.toml` | バージョンを `2.11.0` に更新 |
| `package.json` | バージョンを `2.11.0` に更新 |
| `tauri.conf.json` | バージョンを `2.11.0` に更新 |
| `nsis/installer.nsi` | バージョンを `2.11.0` / `2.11.0.0` に更新 |
| `docs/DEVELOPMENT.md` | ポータブル版ZIPファイル名バージョンを `2.11.0` に更新 |
| `docs/spec.md` | バージョン `v2.11.0` 更新および不可視文字仕様の追記 |
| `src/settings.rs` | `AppSettings` / `SettingsResponse` に `invisible_characters` 追加および単体テスト実装 |
| `src/commands.rs` | `get_settings()` で `invisible_characters` をフロントエンドへ返却 |
| `src/frontend/style.css` | テーマ変数 `--invisible-char-color` および各不可視文字（`.cm-invisible-*`）のCSS定義 |
| `src/frontend/i18n.js` | 不可視文字設定・ツールチップ・ショートカットの多言語キー定義 |
| `src/frontend/index.html` | 設定ダイアログに `invisibleCharactersSelectModal` セレクトボックスを追加 |
| `src/frontend/help.html` | ヘルプ画面ショートカット一覧に `Alt + W` を追加 |
| `src/frontend/js/state.js` | `appState.invisibleCharacters` および DOM 要素キャッシュ定義 |
| `src/frontend/js/core/settingsManager.js` | 設定保存ペイロードに `invisible_characters` を追加 |
| `src/frontend/js/ui/codemirror.js` | `invisibleCharsCompartment`, `NewlineWidget`, `invisibleCharactersPlugin`, `updateInvisibleCharacters` 実装 |
| `src/frontend/js/ui/editor.js` | `applyInvisibleCharacters`, `toggleInvisibleCharacters` 実装 |
| `src/frontend/js/ui/settings.js` | ダイアログ読み込み・保存・フォーカストラップ対応 |
| `src/frontend/js/ui/tabs.js` | 新規タブ生成・タブ切り替え時のタブ個別不可視文字状態の保持・適用 |
| `src/frontend/js/core/fileSystem.js` | ファイルオープン時のタブ生成における不可視文字設定の反映 |
| `src/frontend/js/ui/shortcuts.js` | `Alt + W` ショートカット監視追加 |
| `src/frontend/js/main.js` | 起動時設定適用および変更イベントリスナー登録 |
| `docs/SHORTCUTS.md` | 「表示」テーブルに `Alt + W` を追記 |
| `docs/USER_GUIDE.md` | エディタ概要およびセクション8に不可視文字表示の説明を追記 |

---

## 検証結果
- **Rust バックエンド単体テスト**: `cargo test` にて 8 件全パス（`test_invisible_characters_default_and_deserialize` 含む）。
- **フロントエンドビルド**: `npm run build` にてエラー・警告なくバンドル完了。
- **表示・操作性**: 半角スペース（ドット）、全角スペース（四角 `□`）、タブ文字（矢印 `→`）、改行マーク（下折れ矢印 `↵`）が正常に描画され、テキスト選択や入力操作に影響を与えないことを確認。
