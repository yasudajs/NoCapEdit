# ウォークスルー: 行番号表示機能 (Line Numbers)

内部バージョン `0.2.24` において、エディタ画面に行番号を表示する機能を追加し、あわせてヘルプ画面（`F1`）のショートカット一覧カテゴリを「表示」などに再整理しました。

---

## 1. 主な変更点

### 1.1 行番号表示機能（折り返しと同様の2層設計）
- **設定画面（右ドック）でのデフォルト管理**:
  - 設定ドック（`Ctrl + ,`）に「行番号の表示」セレクトボックスを追加しました。
  - 選択肢: **「無効（表示しない / デフォルト）」** / **「有効（表示する）」**
  - 設定ファイル（`config.json`）の `line_numbers` に永続化され、アプリ再起動後も状態を保持します。
  - 設定ドックで変更すると、現在アクティブなタブの一時設定およびエディタ表示が即座に更新され、以降に新規作成されるタブの初期値としても適用されます。
- **ショートカット（`Alt + L`）でのタブ個別トグル**:
  - 作業中のアクティブタブに対してのみ、即座に行番号の表示/非表示（ON/OFF）を切り替えます。
  - 他のタブや基本設定には影響せず、タブ個別の状態（`tab.lineNumbers`）として保持されます。
  - タブを切り替えた際も、それぞれのタブの行番号表示状態が正確に復元されます。
- **CodeMirror 6 ガター連携とテーマ連動**:
  - `@codemirror/view` の標準拡張機能 `lineNumbers` を Compartment 経由で管理し、動的に切り替えます。
  - `style.css` にガター専用のCSS変数（`--gutter-bg`, `--gutter-text`, `--gutter-border`, `--gutter-active-text`）を定義し、Dark / Soft Dark / Light の各テーマで美しい配色と視認性を維持します。
  - 行折り返し時は物理行の先頭のみに番号が表示され、ズーム（フォントサイズ変更）や行間変更時も本文行に完全追従します。

### 1.2 ヘルプ画面（`F1`）およびショートカット一覧のカテゴリ再編成
ユーザーが直感的に操作を見つけられるよう、カテゴリ構成を以下の通り再整理しました：
1. **「表示」 (新設)**:
   - `Alt + Z`: 行の折り返し切り替え
   - `Alt + L`: 行番号の表示切り替え
2. **「テキスト編集」**:
   - `Alt + ↑` / `Alt + ↓`: 行の上下移動
   - `Alt + Shift + ↑` / `Alt + Shift + ↓`: 行の上下複製
   - `Alt + Shift + K`: 行の削除
   - `F5`: 現在日時の挿入
   - `Tab` / `Shift + Tab`: インデント挿入・削除
3. **「検索・置換」**:
   - `Ctrl + F`, `Ctrl + H` 等の検索・置換操作
4. **「フォントサイズ・行間」 (従来の「表示・ズーム」から名称変更)**:
   - `Ctrl + +` / `Ctrl + -`: フォントを大きく (拡大) / 小さく (縮小)
   - `Ctrl + Shift + +` / `Ctrl + Shift + -`: 行間を広げる / 狭める
   - `Ctrl + 0`: フォントサイズ・行間のリセット（末尾に配置し整理）

---

## 2. 変更されたファイル一覧

| ファイル | 変更内容 |
|---|---|
| `Cargo.toml` | バージョンを `0.2.24` に更新 |
| `package.json` | バージョンを `0.2.24` に更新 |
| `tauri.conf.json` | バージョンを `0.2.24` に更新 |
| `nsis/installer.nsi` | バージョンを `0.2.24` / `0.2.24.0` に更新 |
| `docs/DEVELOPMENT.md` | ポータブル版ZIPビルドコマンドのバージョンを `0.2.24` に更新 |
| `docs/spec.md` | バージョン更新および行番号表示仕様の追記 |
| `docs/SHORTCUTS.md` | カテゴリ構成の再編成および `Alt + L` の追記 |
| `src/settings.rs` | `AppSettings` および `SettingsResponse` に `line_numbers` フィールド（デフォルト `false`）追加、単体テスト追加 |
| `src/commands.rs` | `get_settings()` で `line_numbers` を返却するよう対応 |
| `src/frontend/style.css` | 各テーマ（Dark / Soft Dark / Light）にガター用CSS変数を定義 |
| `src/frontend/i18n.js` | 行番号設定項目、ヘルプカテゴリ、ショートカットの多言語キー定義 |
| `src/frontend/index.html` | 設定ドック内に行番号セレクトボックス（`#lineNumbersSelectModal`）を追加 |
| `src/frontend/help.html` | カテゴリ再編成（「表示」「テキスト編集」「フォントサイズ・行間」等）および `Alt + L` 追記 |
| `src/frontend/js/state.js` | `appState.lineNumbers` および DOM要素キャッシュ（`elements.lineNumbersSelectModal`）追加 |
| `src/frontend/js/core/settingsManager.js` | `saveApplicationSettings()` の送信ペイロードに `line_numbers` を追加 |
| `src/frontend/js/ui/codemirror.js` | `lineNumbers` 拡張、Compartment、`updateLineNumbers()`、ガタースタイル、JSDoc更新 |
| `src/frontend/js/ui/editor.js` | `applyLineNumbers()` および `toggleLineNumbers()` 実装 |
| `src/frontend/js/ui/shortcuts.js` | `Alt + L` キーハンドラー登録 |
| `src/frontend/js/ui/settings.js` | 設定ドック開閉・保存・キーボードナビゲーション連動 |
| `src/frontend/js/main.js` | 起動時設定ロード・適用、イベントリスナー登録 |
| `src/frontend/js/ui/tabs.js` | タブ新規作成時・切り替え時の行番号状態管理・復元 |
| `src/frontend/js/core/fileSystem.js` | ファイルオープン時の行番号状態初期化 |

---

## 3. 検証結果

- **単体テスト**: `cargo test` にて全4テスト（設定のクランプ、デフォルト値、欠落フォールバック、アトミック保存、連番衝突回避）がすべてパス。
- **ビルドテスト**: `npm run build` および `cargo build` が警告・エラーなく正常完了。
- **仕様確認**:
  - アプリ起動時の初期状態（デフォルトOFF）で行番号が非表示であることを確認。
  - `Alt + L` を押すとアクティブタブに行番号が表示され、再度押すと非表示に戻ることを確認。
  - 複数タブ間での状態保持（タブAがON、タブBがOFF）がタブ切り替え時に正しく復元されることを確認。
  - 設定ドックでのデフォルト変更が `config.json` に永続化され、再起動後も正しく復元されることを確認。
  - 各テーマ（Dark / Soft Dark / Light）でのガター配色がCSS変数により調和していることを確認。
  - `F1` ヘルプ画面で「表示」「テキスト編集」「検索・置換」「フォントサイズ・行間」のカテゴリ構成が綺麗に表示されることを確認。
