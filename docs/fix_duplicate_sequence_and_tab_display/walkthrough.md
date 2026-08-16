# 実装完了報告（Walkthrough）：同名衝突連番の1桁化と保存モード別タブ名表示の統一

## 概要
同名ファイル重複時の連番生成処理を1桁（`_1`〜`_9`、上限9回＝1秒間に最大10ファイル）に統一し、手動保存モード・自動保存モードにおいて外部から開いたファイルや一般ファイルを含むすべてのタブ名表示を統一ルールで正しくフォーマットする対応を実施しました。

## 変更内容の詳細

### 1. バックエンド (Rust)
- **[commands.rs](file:///c:/work/NoCapEdit/src/commands.rs)**:
  - `next_available_file_path`:
    - 重複時の連番生成を `format!("{}_{}{}", base, index, FILE_EXTENSION)`（`_1`〜`_9`）に変更しました。
    - 上限チェックを `if index > 9`（上限9、10回目でエラー）に変更し、連続処理暴走時のフェイルセーフを強化しました。
    - `next_available_file_path` に対する単体テスト（`test_next_available_file_path_single_digit_sequence`）を追加しました。

### 2. フロントエンド (JavaScript)
- **[helpers.js](file:///c:/work/NoCapEdit/src/dist/js/utils/helpers.js)**:
  - `AUTO_FILE_REGEX` を `/^\d{8}_\d{6}(?:_\d+)?\.nctx$/` に更新し、1桁連番（`_1`）および後方互換用として過去の2桁連番（`_01`）の両方にマッチするようにしました。
- **[tabs.js](file:///c:/work/NoCapEdit/src/dist/js/ui/tabs.js)**:
  - `formatTabDisplayName`:
    - 日時抽出の正規表現を `(?:_(\d+))?` に更新しました。
    - 手動保存モード（`appState.saveMode === 'manual'`）時の角括弧付与ルールを共通化し、未保存タブ・自動生成日時ファイル・一般ファイル（`aaaa.nctx` → `[aaaa]`、`memo.txt` → `[memo]`）のすべてで統一的に `[ ... ]` が付与されるように改善しました。

### 3. 仕様書・バージョン更新
- **[spec.md](file:///c:/work/NoCapEdit/docs/spec.md)**: 連番仕様（`_1`〜`_9`、上限9）および手動保存モード時のタブ名表示仕様を最新化。
- **バージョン番号**: `0.1.89` → `0.1.90` に更新（`Cargo.toml`, `tauri.conf.json`, `nsis/installer.nsi`, `docs/DEVELOPMENT.md`）。

---

## 検証結果

### 1. 単体テスト (Rust)
- `cargo test` を実行し、`test_next_available_file_path_single_digit_sequence`（重複なし `yyyymmdd_hhmmss.nctx`、1〜9回重複 `_1`〜`_9`、10回重複エラー）がすべて正常に合格することを確認しました。

### 2. タブ名フォーマットロジック検証 (Node.js)
以下のすべてのパターンでテストを実施し、全て **PASS** を確認しました。

| 入力ファイル名 | 保存モード | 期待される表示名 | 結果 |
| :--- | :--- | :--- | :--- |
| `20260720_220219_1.nctx` | 手動保存 (`manual`) | `[2026/07/20 22:02:19-1]` | **PASS** |
| `20260720_220219_1.nctx` | 自動保存 (`auto`) | `2026/07/20 22:02:19-1` | **PASS** |
| `20260709_222843.nctx` | 手動保存 (`manual`) | `[2026/07/09 22:28:43]` | **PASS** |
| `20260709_222843.nctx` | 自動保存 (`auto`) | `2026/07/09 22:28:43` | **PASS** |
| `20260709_222843_01.nctx` | 手動保存 (`manual`) | `[2026/07/09 22:28:43-1]` | **PASS** |
| `20260709_222843_01.nctx` | 自動保存 (`auto`) | `2026/07/09 22:28:43-1` | **PASS** |
| `20260709_222843_9.nctx` | 手動保存 (`manual`) | `[2026/07/09 22:28:43-9]` | **PASS** |
| `20260709_222843_9.nctx` | 自動保存 (`auto`) | `2026/07/09 22:28:43-9` | **PASS** |
| `memo.txt` | 手動保存 (`manual`) | `[memo]` | **PASS** |
| `memo.txt` | 自動保存 (`auto`) | `memo` | **PASS** |
| `aaaa.nctx` | 手動保存 (`manual`) | `[aaaa]` | **PASS** |
| `aaaa.nctx` | 自動保存 (`auto`) | `aaaa` | **PASS** |
| `archive.tar.gz` | 手動保存 (`manual`) | `[archive.tar]` | **PASS** |
| `archive.tar.gz` | 自動保存 (`auto`) | `archive.tar` | **PASS** |
| `.gitignore` | 手動保存 (`manual`) | `[.gitignore]` | **PASS** |
| `.gitignore` | 自動保存 (`auto`) | `.gitignore` | **PASS** |
| `未保存1` | 自動保存 (`auto`) | `未保存1` | **PASS** |
| `[未保存1]` | 手動保存 (`manual`) | `[未保存1]` | **PASS** |
