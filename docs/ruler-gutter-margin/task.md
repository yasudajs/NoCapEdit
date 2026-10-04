# タスクリスト: 行数表示時の境界線余白削除およびルーラー位置整合化

- [x] **フェーズ 1: 実装計画の作成・合意** <!-- id: phase1 -->
  - [x] ユーザー要望のヒアリングおよび余白なしイメージ画像の作成・提示 <!-- id: phase1-image -->
  - [x] 実装計画書（`implementation_plan.md`）の作成 <!-- id: phase1-plan -->
  - [x] ユーザー承認と作業開始指示の受領 <!-- id: phase1-approval -->

- [x] **フェーズ 2: 実装作業の開始準備** <!-- id: phase2-prep -->
  - [x] `master` ブランチから作業用ブランチ（`feature/ruler-gutter-margin`）の作成 <!-- id: phase2-branch -->
  - [x] 作業ドキュメントを `docs/wip/ruler-gutter-margin/` から `docs/ruler-gutter-margin/` へ移動・コミット＆プッシュ <!-- id: phase2-doc-move -->
  - [x] バージョン番号の更新（v2.12.0 → v2.12.1、管理5ファイル） <!-- id: phase2-version -->
  - [x] `spec.md` を最新版に更新 <!-- id: phase2-spec -->

- [x] **フェーズ 3: 実装** <!-- id: phase3-impl -->
  - [x] `src/frontend/style.css` のスタイル定義更新（行数表示時の左余白 0px） <!-- id: phase3-css -->
  - [x] `src/frontend/js/ui/codemirror.js` のテーマ設定およびクラス制御更新 <!-- id: phase3-cm -->
  - [x] `src/frontend/js/ui/ruler.js` のフォールバック計算更新 <!-- id: phase3-ruler -->

- [ ] **フェーズ 4: 検証** <!-- id: phase4-verify -->
  - [ ] 行番号 ON / ルーラー ON 時の表示および境界線・目盛りの一致確認 <!-- id: phase4-verify-on -->
  - [ ] 行番号 OFF / ルーラー ON 時の左余白維持確認 <!-- id: phase4-verify-off -->
  - [ ] 行番号トグル切り替え時の動的追従確認 <!-- id: phase4-verify-toggle -->
  - [ ] ビルド検証（`cargo check` 等） <!-- id: phase4-verify-build -->

- [ ] **フェーズ 5: 完了報告・ドキュメント作成** <!-- id: phase5-report -->
  - [ ] `docs/ruler-gutter-margin/walkthrough.md` の作成 <!-- id: phase5-walkthrough -->
  - [ ] `docs/history.md` に v2.12.1 の変更履歴追記 <!-- id: phase5-history -->
  - [ ] コミット＆プッシュおよびユーザーへの完了報告 <!-- id: phase5-push -->
