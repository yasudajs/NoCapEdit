# タスクリスト: タブ幅選択機能およびタブサイズ連動リファクタリング (v0.2.31)

- [x] **フェーズ1: 計画・準備**
  - [x] 実装計画書の作成 (`docs/tab-width-settings/implementation_plan.md`)
  - [x] タスクリストの作成 (`docs/tab-width-settings/task.md`)
  - [x] ユーザーによる実装計画書の承認

--- *(以降はユーザーの「作業開始」指示後に実施)* ---

- [ ] **フェーズ2: 実装作業**
  - [x] 作業用ブランチ作成 (`feature/tab-width-settings`)
  - [x] WIPドキュメントの昇格 (`docs/wip/tab-width-settings/` → `docs/tab-width-settings/`) およびコミット・プッシュ
  - [ ] バージョン番号の更新 (`0.2.30` → `0.2.31`: 5ファイル)
  - [ ] `docs/spec.md` の更新
  - [ ] バックエンド実装 (`src/settings.rs` のデフォルト値・サニタイズ・単体テスト)
  - [ ] フロントエンドUI・多言語化実装 (`src/frontend/index.html`, `src/frontend/i18n.js`)
  - [ ] CodeMirror / エディタ連携実装 (`codemirror.js`, `editor.js`, `settings.js`, `tabs.js`)
  - [ ] 動作確認・自動テスト (`cargo test`, `npm run build`)
  - [ ] ドキュメント更新・作業完了報告
    - [ ] `docs/tab-width-settings/walkthrough.md` の作成
    - [ ] `docs/history.md` に v0.2.31 の履歴を追記
    - [ ] `docs/USER_GUIDE.md` の更新
    - [ ] コミット＆プッシュ
