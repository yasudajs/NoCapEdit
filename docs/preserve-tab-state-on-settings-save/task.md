# タスクリスト: 設定ドック保存時におけるタブ個別状態の保持 (v0.2.32)

- [x] **フェーズ1: 計画・準備**
  - [x] 実装計画書の作成 (`docs/preserve-tab-state-on-settings-save/implementation_plan.md`)
  - [x] タスクリストの作成 (`docs/preserve-tab-state-on-settings-save/task.md`)
  - [x] ユーザーによる実装計画書の承認

--- *(以降はユーザーの「作業開始」指示後に実施)* ---

- [ ] **フェーズ2: 実装作業**
  - [x] 作業用ブランチ作成 (`fix/preserve-tab-state-on-save`)
  - [x] WIPドキュメントの昇格 (`docs/wip/preserve-tab-state-on-settings-save/` → `docs/preserve-tab-state-on-settings-save/`) およびコミット・プッシュ
  - [x] バージョン番号の更新 (`0.2.31` → `0.2.32`: 5ファイル)
  - [x] `docs/spec.md` の更新
  - [ ] 設定ドック保存処理の差分変更検知の実装 (`src/frontend/js/ui/settings.js`)
  - [ ] タブ幅変更時におけるインデントガイド即時再描画の実装 (`src/frontend/js/ui/codemirror.js`)
  - [ ] 動作確認・自動テスト (`cargo test`, `npm run build`)
  - [ ] ドキュメント更新・作業完了報告
    - [ ] `docs/preserve-tab-state-on-settings-save/walkthrough.md` の作成
    - [ ] `docs/history.md` に v0.2.32 の履歴を追記
    - [ ] コミット＆プッシュ
