# ウォークスルー: インデントガイド（縦の補助線）表示機能の実装

## 1. 作業概要
VS Code等のモダンエディタと同様に、テキスト内のTab文字やスペースインデントによる階層深さに応じて、薄い縦の補助線（インデントガイドライン）を表示する機能を実装しました。
設定画面（右ドック）からの永続設定、およびショートカットキー（`Alt + I`）による作業中タブの即座な一時切り替えに対応しています。

---

## 2. 実装された機能詳細

### ① インデント階層に応じた縦補助線の自動描画
- **Tab / スペース両対応**:
  - `Tab` 文字（`\t`）および設定（`tabBehavior`）に応じたスペースインデント（2文字/4文字等）を正確に認識し、インデント階層ごとに1pxの薄い縦実線を描画します。
- **空行のインデント補間**:
  - ブロック内や関数内に存在する空行（改行のみの行）に対しても前後のインデント深さを走査・補間し、VS Code同様にガイド線が途切れずに自然に繋がります。
- **テーマ連動と文字追従**:
  - 各テーマ（Dark / Soft Dark / Light）に合わせて邪魔にならない半透明色（`--indent-guide-color`）を設定。
  - 等幅フォント環境において、`Ctrl + マウスホイール` によるフォントサイズ変更（ズーム）や行間変更時もCSS（`ch` 単位）により完全追従します。
  - テキスト選択やカーソル移動を阻害しないようクリックイベントは無効化（`pointer-events: none`）されています。

### ② 設定画面（右ドック `Ctrl + ,`）
- **項目名**: 「インデントガイドの表示」
- **選択肢**: 「無効（表示しない）」 / 「有効（表示する）」
- **初期設定**: **無効（デフォルト）**
- 設定は `config.json`（Rust側 `AppSettings`）に保存され、アプリ再起動後も状態を維持します。

### ③ キーボードショートカット (`Alt + I`)
- 作業中のアクティブタブに対してのみ、即座にインデントガイドの表示/非表示（ON/OFF）をトグルします。
- 行番号（`Alt + L`）やルーラー（`Alt + R`）と同様に、他のタブや基本設定には影響せず、タブ個別の状態として保持されます。

---

## 3. 変更ファイル一覧

| カテゴリ | ファイル | 変更内容 |
|---|---|---|
| **バージョン管理** | `Cargo.toml`, `package.json`, `tauri.conf.json`, `nsis/installer.nsi`, `docs/DEVELOPMENT.md` | バージョン番号を `0.2.30`（NSISは `0.2.30.0`）に一括更新 |
| **バックエンド (Rust)** | `src/settings.rs`, `src/commands.rs` | `AppSettings` および `SettingsResponse` に `indent_guides: bool` を追加、単体テスト追加 |
| **フロントエンド状態** | `src/frontend/js/state.js`, `src/frontend/js/core/settingsManager.js` | `appState` / `elements` に `indentGuides` を追加、設定保存ペイロード連携 |
| **多言語対応** | `src/frontend/i18n.js` | 設定ラベル、選択肢、ツールチップ、ヘルプ説明キーを追加 |
| **CodeMirror 6 拡張** | `src/frontend/js/ui/codemirror.js` | インデント解析、空行補間、`IndentGuideWidget`、`indentGuidesPlugin`、`indentGuidesCompartment`、`updateIndentGuides` を実装 |
| **エディタ・タブ連携** | `src/frontend/js/ui/editor.js`, `src/frontend/js/ui/tabs.js`, `src/frontend/js/core/fileSystem.js` | `applyIndentGuides` / `toggleIndentGuides` 実装、タブ生成・切り替え時の状態復元 |
| **ショートカット** | `src/frontend/js/ui/shortcuts.js` | `Alt + I` キーハンドラを追加 |
| **設定画面 UI** | `src/frontend/index.html`, `src/frontend/js/ui/settings.js`, `src/frontend/js/main.js` | 設定ドックへのセレクトボックス追加、フォーカストラップ対応、イベント接続 |
| **スタイル定義** | `src/frontend/style.css` | 各テーマ向け変数（`--indent-guide-color`）およびガイド線スタイルルール追加 |
| **ヘルプ・ドキュメント** | `src/frontend/help.html`, `docs/SHORTCUTS.md`, `docs/USER_GUIDE.md`, `docs/spec.md`, `docs/history.md` | 各種操作説明、仕様書、改定履歴の更新 |

---

## 4. 検証結果

1. **Rust バックエンドテスト**:
   - `cargo test`: 新設した `test_indent_guides_default_and_deserialize` を含む全6件のテストがパス（`ok. 6 passed; 0 failed`）。
2. **フロントエンドビルド**:
   - `npm run build`: Vite ビルドがエラーなく正常完了（`built in 15.51s`）。
3. **Rust コンパイルチェック**:
   - `cargo check`: 警告・エラーなくパス。
4. **インデント計算ロジック単体検証**:
   - 4スペースインデント、タブ文字インデント、2スペースインデント、空行補間処理のすべてが正常に動作することを確認（`ALL INDENT GUIDE LOGIC TESTS PASSED!`）。
