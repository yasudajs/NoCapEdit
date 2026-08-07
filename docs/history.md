# NoCapEdit 改定履歴 (Changelog)

NoCapEdit のバージョンアップおよび仕様変更の履歴です。
新しいバージョンを上に記載しています。

> 過去バージョンの履歴: [v0.2 系](history_v0.2.md) | [v0.1 系](history_v0.1.md)

## 改定履歴一覧

### Ver 0.3.1 | 2026-08-07 | Antigravity
- [Tauri v2 移行] フェーズ0: 事前準備：
  - Tauri CLI v2 (v2.11.4) をインストール（v1.6.6 から更新）
  - v0.2 ブランチから v0.3 ブランチを作成し、作業ブランチ feature/tauri-v2-migration を分岐
  - 現行コードの cargo build 成功およびアプリの正常起動を確認
  - 改定履歴ファイル（history.md）をバージョン系ごとに分割（history_v0.1.md, history_v0.2.md）

---

### Ver 0.3.0 | 2026-08-07 | Antigravity
- [Tauri v2 移行] 移行計画のディスカッションとドキュメント作成：
  - Tauri v1 → v2 移行マスタープラン（migration_plan.md）を策定
  - 追加検討事項（considerations.md）の全4項目を調査・解決し、移行計画に反映
  - プロジェクト構造の Tauri v2 標準レイアウト（src-tauri/）への変更方針を決定
  - NSIS カスタムテンプレートの廃止と v2 デフォルトテンプレート + hooks 方式への移行方針を決定
