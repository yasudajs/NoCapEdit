# NoCapEdit 改定履歴 (Changelog) - v0.2系

NoCapEdit v0.2系のバージョンアップおよび仕様変更の履歴です。
新しいバージョンを上に記載しています。

> [!NOTE]
> Ver 0.1系の改定履歴については、[Ver 0.1系 改定履歴 (history_v0.1.md)](history_v0.1.md) を参照してください。

---

## 改定履歴一覧

### Ver 0.2.1 | 2026-08-23 | yasudajs
- **CodeMirror移行 Step 1: Vite環境構築とディレクトリ移動**
  - **フロントエンドソースの移動**: 従来の `src/dist/` 配下のソースコード全般を `src/frontend/` に移動し、ソースとビルド成果物の分離を実施
  - **ビルドツール（Vite）の導入**: プロジェクトルートに `package.json` および `vite.config.js` を新規作成し、Vite による高速なバンドル・開発サーバー環境を構築
  - **Tauri連携設定の更新**: `tauri.conf.json` の `beforeBuildCommand` を `npm run build`、`beforeDevCommand` を `npm run dev`、`devPath` を `http://localhost:1420` に更新
  - **マルチページビルド対応**: `vite.config.js` にて `index.html` および `help.html` の両方をバンドル対象に設定
  - **Git管理対象の最適化**: `.gitignore` にビルド成果物（`/src/dist/`）および npm 依存関係（`/node_modules/`）を追加

---

### Ver 0.2.0 | 2026-08-23 | yasudajs
- **v0.2系開発開始・事前準備**
  - **ベースブランチの整備**: `master` よりクリーンな `v0.2` ブランチを再作成し、旧v0.2ブランチを `archive/v0.2-sidebar-explorer` にアーカイブ退避
  - **CodeMirror (v6) 移行計画の策定**: 事前ディスカッションに基づき、Vite導入・ディレクトリ構成・検索置換方針・7ステップ構成・機能優先度を定めた実装計画書（`docs/codemirror-migration/implementation_plan.md`）を作成
  - **仕様書の更新**: `docs/spec.md` の対象バージョンを0.2.x系に更新し、開発技術（Vite, CodeMirror）および検索・置換の仕様改定を反映
  - **内部バージョンの更新**: バージョン管理4ファイル（`Cargo.toml` 等）を `0.2.0` に更新
