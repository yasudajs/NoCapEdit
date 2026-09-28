# タスクリスト: 複数行選択時における行頭左側余白の選択色描画解消

## フェーズ 1: 実装計画の作成・合意 【現在地】
- [x] 原因調査と修正方針の検討
- [x] 実装計画書 (`docs/wip/fix-multiline-selection-padding/implementation_plan.md`) の作成
- [x] タスクリスト (`docs/wip/fix-multiline-selection-padding/task.md`) の作成
- [x] ユーザーへの計画提示および承認の受領

---

## フェーズ 2: 実装作業の準備（※ユーザー承認・作業開始指示後に着手）
- [x] 作業ブランチの作成 (`fix-multiline-selection-padding`)
- [x] ドキュメントの配置移動 (`docs/wip/fix-multiline-selection-padding/` -> `docs/fix-multiline-selection-padding/`)
- [x] バージョン番号の更新（`0.2.28` -> `0.2.29`、5ファイル一括）
  - [x] `Cargo.toml`
  - [x] `package.json`
  - [x] `tauri.conf.json`
  - [x] `nsis/installer.nsi`
  - [x] `docs/DEVELOPMENT.md`
- [x] `docs/spec.md` の更新

---

## フェーズ 3: 実装作業
- [x] `src/frontend/style.css` の更新（`.cm-content`, `.cm-line` の padding 設定）
- [x] `src/frontend/js/ui/codemirror.js` の更新（`baseTheme` の padding 設定）
- [x] `src/frontend/js/ui/ruler.js` の補強（`getGutterOffset` フォールバック計算の安全対策）

---

## フェーズ 4: 動作検証
- [x] 複数行選択時の描画検証（行頭余白の選択色非表示、左端揃い、右端余白の確認）
- [x] 行番号表示ON/OFF時の選択描画検証
- [x] ルーラー目盛り・縦ガイド線・カーソル位置の整合性検証
- [x] ビルド検証 (`npm run build`, `cargo check`, `cargo test`)

---

## フェーズ 5: 完了報告・クリーンアップ準備
- [x] ウォークスルー (`docs/fix-multiline-selection-padding/walkthrough.md`) の作成
- [x] 変更履歴 (`docs/history.md`) の更新
- [x] コミット＆プッシュの実施
- [ ] ユーザーへの結果報告とマージ・クリーンアップ指示の確認
