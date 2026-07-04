# 独自拡張子 `.nctx` の採用とOS関連付けの実装

NoCapEdit専用のテキストファイル拡張子として `.nctx` (NoCap Text) を採用し、OSとの統合（ダブルクリックで起動してファイルを開く）を実現します。
また、将来的なマークダウン対応を見据え、`.ncmd` (NoCap Markdown) へスムーズに拡張できるような設計とします。

## 変更内容の概要

### 1. デフォルト拡張子の変更 (Rust)
- 新規ファイル自動生成時の拡張子を `.txt` から `.nctx` に変更。
- 対象ファイル: `src/main.rs` の `next_available_file_path`

### 2. ダイアログのフィルタ設定 (JS)
- 保存および開く際のダイアログで、`.nctx` をデフォルトとしつつ、既存 of `.txt` も選択できるようにする。
- 対象ファイル: `src/dist/main.js` のダイアログ関連処理

### 3. OSファイル関連付け (Tauri)
- WiXフラグメント `wix/file-association.wxs` を作成し、`.nctx` および `.ncmd` のレジストリ関連付けを定義。
- `tauri.conf.json` にフラグメントパスとコンポーネント参照を追加し、MSIインストーラービルド時に自動登録されるようにする。
- 対象ファイル: `tauri.conf.json`, `wix/file-association.wxs`

### 4. ダブルクリック起動サポート (Rust / JS)
- OSからファイルをダブルクリックして起動した際、渡された引数（ファイルパス）を取得する仕組みを追加。
- 起動時に引数からファイルを開くようフロントエンド側で初期化処理を修正。
- 対象ファイル: `src/main.rs`, `src/dist/main.js`

---

## 提案される変更

### Rust バックエンド

#### [MODIFY] [main.rs](file:///c:/work/NoCapEdit/src/main.rs)
- オートファイルのデフォルト拡張子を `.nctx` に変更。
- アプリ起動時の引数（ファイルパス）を取得するTauriコマンド `get_launch_file` を追加。

### フロントエンド

#### [MODIFY] [main.js](file:///c:/work/NoCapEdit/src/dist/main.js)
- ファイル選択・保存ダイアログのフィルターに `nctx` および `txt` を追加。
- 起動時に `get_launch_file` コマンドを呼び出し、引数があればそのファイルを開く処理を実装。

### Tauri設定・インストーラー

#### [MODIFY] [tauri.conf.json](file:///c:/work/NoCapEdit/tauri.conf.json)
- `tauri.bundle.windows.wix` に `fragmentPaths` と `componentRefs` を追加し、フラグメントを有効化。

#### [NEW] [file-association.wxs](file:///c:/work/NoCapEdit/wix/file-association.wxs)
- `.nctx` および `.ncmd` の拡張子を `PathToExecutable` (アプリの実行ファイル) に関連付ける WiX フラグメント。

---

## 検証計画

### ビルド確認
- `cargo check` および `cargo build` でコンパイルエラーがないことを確認。

### 手動テスト
- アプリを起動し、新規ファイル作成時に `.nctx` 拡張子で生成されるか確認。
- ダイアログで `.nctx` と `.txt` のフィルタが表示されるか確認。
- ビルドした実行ファイルに対し、コマンドラインから `.nctx` ファイルを引数として渡して起動し、そのファイルが正しくタブで開くことを検証。
