# タスクリスト: 半角括弧・クォートの自動補完および改行時の閉じ括弧自動挿入機能

- [x] フェーズ1: 仕様のディスカッションと実装計画書（`implementation_plan.md`）の作成
- [x] フェーズ2: 実装作業の準備
  - [x] `master` ブランチから作業用ブランチ（`feature/auto-close-brackets`）を作成
  - [x] ドキュメントを `docs/wip/auto-close-brackets/` から `docs/auto-close-brackets/` へ移動し、コミット＆プッシュ
  - [x] バージョン管理ファイル（5ファイル）を `v2.14.0` に更新
  - [x] `docs/spec.md` を最新版に更新
- [x] フェーズ3: 機能の実装
  - [x] `package.json` に `@codemirror/autocomplete` を明記
  - [x] `src/frontend/js/ui/codemirror.js` に `closeBrackets` / `closeBracketsKeymap` および6種のペア設定を統合
  - [x] `src/frontend/js/ui/codemirror.js` の `customInsertNewlineAndIndent` に括弧間改行の空白対応および未閉じ `{` 行末改行時の3行目 `}` 自動挿入ロジックを実装
- [x] フェーズ4: ビルド検証・動作確認とドキュメント作成
  - [x] `npm run build` によるフロントエンドビルド検証
  - [x] `docs/auto-close-brackets/walkthrough.md` の作成
  - [x] `docs/history.md` への `Ver 2.14.0` 変更履歴の追記
  - [x] 変更一式のコミット＆プッシュおよびユーザーへの確認依頼
