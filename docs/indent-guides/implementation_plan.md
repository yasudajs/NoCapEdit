# 実装計画書: インデントガイド（インデント補助線）機能

## 1. 概要
VS Code等のエディタと同様に、テキスト内のTab文字やインデントスペースによって生じる階層に合わせて、薄い縦の補助線（インデントガイドライン）を表示する機能を追加する。
これにより、ブロック構造やネストの深さが視覚的に把握しやすくなる。

## 2. 決定した仕様
1. **ガイド線の表示挙動**:
   - **インデント判定**: `Tab`（`\t`）文字および設定（`tabBehavior`）に応じたスペースインデント（2文字/4文字等）に対応。
   - **空行の扱い**: 前後の行がインデントされている間の空行（改行のみの行）にも、ガイド線が途切れずに自然に繋がるように補間描画。
   - **線のスタイル**: テーマ（Dark / Soft Dark / Light）に合わせて邪魔にならない薄い1pxの実線（半透明カラー）を表示。フォントサイズ変更（ズーム）や行間変更時も正確に追従。
2. **設定画面（右ドック `Ctrl + ,`）**:
   - 項目名: 「インデントガイドの表示」
   - 選択肢: 「無効（表示しない）」 / 「有効（表示する）」
   - **初期値: 「無効（デフォルト）」**（※ユーザー合意事項）
   - 設定は `config.json` に永続化され、アプリ再起動後も保持される。
3. **キーボードショートカット**:
   - **`Alt + I`**: 作業中のアクティブタブに対してのみ、即座にインデントガイドの表示/非表示（ON/OFF）をトグルする（※ユーザー合意事項）。
   - 他のタブや基本設定には影響せず、タブ個別の状態として保持される（行番号 `Alt + L` やルーラー `Alt + R` と同様）。
4. **多言語対応 (i18n)**:
   - 表示文言（設定項目名、選択肢、ヘルプ説明等）はすべて `src/frontend/i18n.js` にキーを定義し、ハードコードしない。

---

## 3. 実装方針と影響範囲

### 3.1 バージョン番号の更新（内部バージョン 0.2.30）
プロジェクト規定に基づき、以下の5ファイルをセットで更新する。
- `Cargo.toml` (`version = "0.2.30"`)
- `package.json` (`"version": "0.2.30"`)
- `tauri.conf.json` (`"version": "0.2.30"`)
- `nsis/installer.nsi` (`!define VERSION "0.2.30"`, `!define VERSIONWITHBUILD "0.2.30.0"`)
- `docs/DEVELOPMENT.md` (ZIPファイル名例: `v0.2.30`)

### 3.2 バックエンド (Rust)
- `src/settings.rs`:
  - `AppSettings` 構造体に `indent_guides: bool` フィールドを追加（`#[serde(default = "default_indent_guides")]`、デフォルト値: `false`）。

### 3.3 フロントエンド (JavaScript / HTML / CSS)
- **状態管理**:
  - `src/frontend/js/state.js`:
    - `appState` に `indentGuides: false` を追加。
    - 各タブオブジェクトに `indentGuides`（個別状態）を保持可能にする。
  - `src/frontend/js/core/settingsManager.js`:
    - `saveApplicationSettings()` の保存対象に `indent_guides` を追加。
- **CodeMirror 6 拡張 (`src/frontend/js/ui/codemirror.js`)**:
  - インデントガイド用の動的 `Compartment`（`indentGuidesCompartment`）を定義。
  - 可視行のインデントレベル（Tabおよびスペース数）を走査し、各階層位置にガイド線を描画する `ViewPlugin`（インデントガイド拡張）を実装。
  - 空行の補間判定（前後のインデント深さを参照）。
  - `updateIndentGuides(enable)` 関数を提供し、動的に切り替え可能にする。
- **エディタ連携 (`src/frontend/js/ui/editor.js`)**:
  - `applyIndentGuides(enable)`: エディタへインデントガイド設定を適用。
  - `toggleIndentGuides()`: アクティブタブのインデントガイド表示をトグル。
- **ショートカット (`src/frontend/js/ui/shortcuts.js`)**:
  - `Alt + I` キー押下時に `toggleIndentGuides()` を呼び出すハンドラを追加。
- **設定画面 (`src/frontend/index.html`, `src/frontend/js/ui/settings.js`)**:
  - 設定ドック内に「インデントガイドの表示」セレクトボックスを追加。
  - 設定の読み込み・変更・即時反映処理を接続。
- **スタイル定義 (`src/frontend/style.css`)**:
  - ガイド線の色変数（`--indent-guide-color` など）を各テーマ（Dark / Soft Dark / Light）ごとに定義。
  - ガイド線要素のスタイル定義（`pointer-events: none`、破綻のない幅・配置）。
- **多言語対応 (`src/frontend/i18n.js`)**:
  - `settings.indentGuides`（タイトル・オプション）、`shortcuts`（ヘルプ用説明）等を追加。
- **ヘルプ画面 (`src/frontend/help.html`)**:
  - ショートカット一覧に `Alt + I`（インデントガイドの表示/非表示）を追加。

### 3.4 ドキュメント更新
- `docs/spec.md`: 新機能仕様（設定項目、動作、ショートカット）を追記。
- `docs/SHORTCUTS.md`: `Alt + I` を追記。
- `docs/USER_GUIDE.md`: 設定および使い方の解説を追記。
- `docs/history.md`: バージョン `0.2.30` の改定履歴を追記。
- `docs/indent-guides/walkthrough.md`: 検証結果と変更概要の記録。

---

## 4. 検証・テスト手順
1. **インデント表示テスト**:
   - `Tab` キーで入力されたインデント行に薄い縦線が表示されるか。
   - スペース2文字・スペース4文字でインデントされた行にも設定通り縦線が表示されるか。
   - 複数段のネスト（階層2, 階層3...）で、それぞれの段に縦線が表示されるか。
   - インデントされたブロック間の「空行」にも自然に線が連続して表示されるか。
2. **切り替え & ショートカットテスト**:
   - 設定画面（`Ctrl + ,`）から有効/無効を切り替え、即座に反映されるか。
   - 設定を閉じてアプリを再起動した際、設定が維持されているか。
   - `Alt + I` でアクティブタブのみ一時的に表示/非表示がトグルできるか。
   - 複数タブ間で、タブごとに独立して状態が保持されているか。
3. **表示追従テスト**:
   - `Ctrl + マウスホイール` によるフォントサイズ拡大・縮小時も、線の位置が文字幅・インデント幅に正確に追従するか。
   - テーマ切り替え（Dark / Soft Dark / Light）で、それぞれのテーマに調和した色で表示されるか。
   - 行番号表示（`Alt + L`）やルーラー表示（`Alt + R`）と同時に有効化してもレイアウト崩れが起きないか。
4. **ビルドテスト**:
   - `npm run build` がエラーなく正常終了すること。
   - `cargo check` が警告・エラーなくパスすること。
