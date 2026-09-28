# タスクリスト: ルーラー機能のレビュー指摘対応・品質改善 (Ver 0.2.26)

## フェーズ 1: 検討・計画
- [x] レビュー指摘事項の分析・修正方針の策定
- [x] 実装計画書（`docs/wip/ruler_refinement/implementation_plan.md`）の作成
- [x] 実装計画書レビュー（`plan_review.md`）に基づく計画書の改訂
- [x] ユーザーによる実装計画書の確認・承認

---

## フェーズ 2: 実装作業（ユーザー承認後に開始）

### 準備・バージョン管理
- [x] 作業ブランチ `feature/ruler-refinement` の作成
- [x] ドキュメントを `docs/wip/ruler_refinement/` から `docs/ruler_refinement/` へ移動・コミット・プッシュ
- [x] バージョン番号の更新（`0.2.26` / 5ファイル）
  - [x] `Cargo.toml`
  - [x] `package.json`
  - [x] `tauri.conf.json`
  - [x] `nsis/installer.nsi`
  - [x] `docs/DEVELOPMENT.md`
- [x] 仕様書（`spec.md`）の確認・必要に応じた更新

### コード修正・改善
- [ ] 🔴 **マーカーtitleのi18n化**:
  - [ ] `src/frontend/i18n.js`: `DICT` 内にネストオブジェクト構造で `ruler.marker.tooltip` / `ruler.marker.max_reached` を追加（日・英）
  - [ ] `src/frontend/js/ui/ruler.js`: `t(...)` を使用したツールチップ・警告ログの実装
- [ ] 🟡 **ルーラートラック幅の動的化**:
  - [ ] `src/frontend/js/ui/ruler.js`: `renderRulerTicks()` 内で JS により動的に幅を設定（`Math.ceil(totalCols * charWidth) + 10`）
  - [ ] `src/frontend/style.css`: `.ruler-track` から固定値 `width: 10000px` を削除し `min-width: 100%` を設定
- [ ] 🟡 **CSSマジックナンバー解消**:
  - [ ] `src/frontend/style.css`: `--ruler-height: 26px` の導入と `.ruler-container` / `.ruler-guides-overlay` への適用
- [ ] 🟡 **`applyRuler` 名前の重複解消**:
  - [ ] `src/frontend/js/ui/ruler.js`: `setRulerVisibility` にリネーム
  - [ ] `src/frontend/js/ui/editor.js`: エイリアスインポートの解消と呼び出し箇所の更新
- [ ] 🟢 **フォントファミリー変更時の同期連動**:
  - [ ] `src/frontend/js/ui/theme.js`: `applyFontFamily()` 内で `syncRulerMetrics()` を呼び出し

### 検証・テスト
- [ ] `cargo test` の実行・全パス確認
- [ ] アプリビルド（`npm run build`）
- [ ] マーカーツールチップのi18n表示確認
- [ ] フォントサイズ 72px 時の目盛り描画・スクロール確認
- [ ] CSS変数によるルーラー高さと縦破線の連動確認
- [ ] 等幅フォントファミリー変更時の文字幅追従確認
- [ ] タブ切替時のルーラー状態（ON/OFFおよびマーカー配置）復元確認

### 報告・ドキュメント
- [ ] ウォークスルー（`docs/ruler_refinement/walkthrough.md`）の作成
- [ ] 変更履歴（`docs/history.md`）に Ver 0.2.26 の追記
- [ ] 実装コード・ドキュメントのコミット＆プッシュ
- [ ] ユーザーへの完了報告・確認要請
