# NoCapEdit v0.1.87 → v0.1.92 コードレビューレポート

**レビュー日**: 2026-08-16  
**対象範囲**: コミット `0ecc1c4`（Ver 0.1.87 マージ）〜 HEAD（Ver 0.1.92）  
**変更規模**: 26ファイル, +461行 / -92行

---

## 変更バージョン一覧

| Ver | 概要 |
|---|---|
| **0.1.88** | 設定画面の操作ヘルプ拡充・操作ヒントフッター表示 |
| **0.1.89** | フォントサイズ・行間の設定画面永続化、一時変更との分離 |
| **0.1.90** | 同名衝突連番の1桁化・上限強化、タブ名表示の統一 |
| **0.1.91** | フォント選択のオンデマンド読み込み・読み込み中表示 |
| **0.1.92** | ヘルプ画面のテーマ連動・リアルタイム同期 |

---

## 総合評価

| 観点 | 評価 | 備考 |
|---|---|---|
| **バグの可能性** | ✅ 極めて良好 | 重大なバグは検出されず |
| **コード品質** | ✅ 極めて良好 | i18n規約・責務分離・後方互換性すべて遵守 |
| **パフォーマンス** | ✅ 大幅に改善 | フォント遅延読み込み、不要なディスクIO削減 |
| **セキュリティ** | ✅ 極めて良好 | XSS対策、ホワイトリスト検証、nullガード徹底 |
| **テスト** | ✅ 良好 | Rustユニットテスト追加（境界条件網羅） |
| **アクセシビリティ** | 🟡 概ね良好 | 軽微な改善余地あり（後述） |

> [!NOTE]
> **重大なバグ（Critical Issue）は検出されませんでした。**  
> 以下の指摘事項はすべて「改善推奨」または「参考」レベルです。

---

## 良かった点（ハイライト）

### バックエンド（Rust）
- **後方互換性の確保**: `AppSettings` の新フィールド（`font_size`, `line_height`）に `#[serde(default)]` を付与し、旧 `config.json` でもパースエラーなしで安全に読み込み可能
- **フェイルセーフの強化**: 同名連番上限を9回に制限し、連続処理暴走時のディスク枯渇を防止
- **網羅的なユニットテスト**: `next_available_file_path` の全境界条件（重複なし / 連番1〜9 / 上限超過エラー）をカバー

### フロントエンド（JS）
- **永続設定と一時変更の明確な分離**: `savedFontSize` / `savedLineHeight`（永続）と `fontSize` / `lineHeight`（一時）を区別し、ズーム操作時のディスクIOを完全排除
- **オンデマンド遅延読み込み**: フォント一覧の取得を起動時から操作時へ遅延し、起動速度を向上
- **マルチウィンドウ通信基盤**: `emit` API ラッパーによるテーマ変更のリアルタイム同期
- **堅牢なエラーハンドリング**: `showPicker()` の `try...catch` 保護、`loadSystemFonts` の `finally` 句によるフラグ解放

### HTML / CSS / i18n
- **i18n規約の厳格な遵守**: 新設テキストはすべて `i18n.js` に集約し `t()` / `data-i18n` 経由で取得
- **セキュリティ**: テーマ値のホワイトリスト検証（`VALID_THEMES`）、`textContent` によるDOM操作（XSS防止）
- **クロスブラウザ対応**: `showPicker()` の機能判定、`-moz-tab-size` の併記

---

## 指摘事項（改善提案）

### 🟡 改善推奨（Warning）

#### 1. ファイル保存のアトミック性（Windows固有）
- **ファイル**: [`commands.rs`](file:///c:/work/NoCapEdit/src/commands.rs) L111-114
- **内容**: `fs::remove_file` → `fs::rename` の2段階操作により、プロセス強制終了時にデータ消失の僅かなリスクがある
- **改善案**: Windows API `MoveFileExW`（`MOVEFILE_REPLACE_EXISTING`）または `atomic_write` クレートの導入

#### 2. 設定値のバリデーション（サニタイズ）
- **ファイル**: [`settings.rs`](file:///c:/work/NoCapEdit/src/settings.rs) L18-36
- **内容**: `config.json` を手動編集して `font_size: 0` 等の異常値を入力した場合、そのまま読み込まれる
- **改善案**: `AppSettings::load()` 時に `clamp(8, 72)` / `clamp(1.0, 3.0)` による範囲制限を適用

#### 3. WAI-ARIA属性の付与
- **ファイル**: [`index.html`](file:///c:/work/NoCapEdit/src/dist/index.html) `#settingsDialog`
- **内容**: 設定ドックに `role="dialog"` / `aria-modal="true"` / `aria-labelledby` が未設定
- **改善案**: 支援技術（スクリーンリーダー）対応の強化

#### 4. i18nキーの重複定義
- **ファイル**: [`i18n.js`](file:///c:/work/NoCapEdit/src/dist/i18n.js)
- **内容**: `settings.font.loading` と `ui.dialog.settings.font.loading` に同一文字列が定義されている
- **改善案**: 片方に統一し、もう一方を削除

---

### 🔵 参考・クリーンアップ（Info）

| # | 対象ファイル | 内容 | 改善案 |
|---|---|---|---|
| 1 | [`commands.rs`](file:///c:/work/NoCapEdit/src/commands.rs) L19 | `&PathBuf` 引数 | Rustの慣用型 `&Path` に変更 |
| 2 | [`commands.rs`](file:///c:/work/NoCapEdit/src/commands.rs) テスト | 手動 `remove_dir_all` | `tempfile::TempDir`（RAII）の利用 |
| 3 | [`index.html`](file:///c:/work/NoCapEdit/src/dist/index.html) | `"20 pt (デフォルト)"` ハードコード | i18n辞書置換への対応 |
| 4 | [`index.html`](file:///c:/work/NoCapEdit/src/dist/index.html) | `class="tab-select"` の汎用クラス | `.settings-select` 等への整理 |
| 5 | [`style.css`](file:///c:/work/NoCapEdit/src/dist/style.css) | テーマ間で同値のCSS変数重複 | 上書き不要な変数の再定義省略 |
| 6 | [`style.css`](file:///c:/work/NoCapEdit/src/dist/style.css) L663-666 | `border` の冗長記述 | `border: none; border-left: ...` に短縮 |
| 7 | [`help.html`](file:///c:/work/NoCapEdit/src/dist/help.html) | カテゴリ見出しが `<div>` | `<h2>` 等の見出し要素でセマンティクス向上 |

---

## まとめ

v0.1.87 以降の5バージョンにわたる変更は、**機能拡張**（設定永続化、フォント遅延読み込み、マルチウィンドウテーマ同期）と**品質改善**（フェイルセーフ強化、パフォーマンス向上、アクセシビリティ）をバランスよく実現しており、全体として**非常に高品質な実装**です。

上記の改善提案は次回以降のリファクタリング時に対応することで、さらに堅牢性・保守性が向上します。
