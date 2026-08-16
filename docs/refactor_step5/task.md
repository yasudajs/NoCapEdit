# タスク: Step 5 help.html カテゴリ見出しのセマンティクス改善

## フェーズ 1: 計画と合意 <!-- id: 0 -->
- [x] レビュー指摘事項と対象コード（`src/dist/help.html`）の確認 <!-- id: 1 -->
- [x] 実装計画書（`implementation_plan_step5.md`）の作成とユーザー合意 <!-- id: 2 -->

## フェーズ 2: 実装準備（ユーザー承認後） <!-- id: 3 -->
- [x] `docs/wip/refactor_step5/` を `docs/refactor_step5/` に移動・コミット <!-- id: 4 -->

## フェーズ 3: 実装作業 <!-- id: 5 -->
- [ ] `src/dist/help.html` 内の5箇所の `<div class="category">` を `<h2 class="category">` に変更 <!-- id: 6 -->
- [ ] `src/dist/help.html` 内の `<style>` で `.category` のスタイル定義（マージン等）を確認・調整 <!-- id: 7 -->

## フェーズ 4: 検証・報告 <!-- id: 8 -->
- [ ] `npm run tauri dev` → `F1` でヘルプ画面を開き、各テーマで見出しのスタイル・配置・テキストが崩れていないことを確認 <!-- id: 9 -->
- [ ] `docs/refactor_step5/walkthrough.md` の作成 <!-- id: 10 -->
- [ ] `docs/history.md` への変更履歴追記 <!-- id: 11 -->
- [ ] コミット＆プッシュおよびユーザー確認 <!-- id: 12 -->
