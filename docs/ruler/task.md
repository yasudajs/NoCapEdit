# タスクリスト: ルーラー表示および縦ガイド線機能 (Ver 0.2.25)

## フェーズ 1: 検討・計画
- [x] ルーラー機能の仕様ディスカッション（ショートカット、目盛り、マーカー、破線ガイドスタイル等）
- [x] 実装計画書（`docs/wip/ruler/implementation_plan.md`）の作成
- [x] ユーザーによる実装計画書の確認・承認

---

## フェーズ 2: 実装作業（ユーザー承認後に開始）

### 準備・バージョン管理
- [x] 作業ブランチ `feature/ruler` の作成
- [x] ドキュメントを `docs/wip/ruler/` から `docs/ruler/` へ移動・コミット・プッシュ
- [x] バージョン番号の更新（`0.2.25` / 5ファイル）
  - [x] `Cargo.toml`
  - [x] `package.json`
  - [x] `tauri.conf.json`
  - [x] `nsis/installer.nsi`
  - [x] `docs/DEVELOPMENT.md`
- [x] 仕様書（`spec.md`）の最新化

### バックエンド実装 (Rust)
- [x] `src/settings.rs`: `AppSettings` に `ruler: bool` 追加および単体テスト実装
- [x] `src/commands.rs`: `AppSettingsPayload` に `ruler: bool` 追加
- [x] `cargo test` の実行・全パス確認

### フロントエンド実装
- [ ] `src/frontend/i18n.js`: ルーラー関連の翻訳キー追加（日・英）
- [ ] `src/frontend/index.html`: ルーラーバーコンテナ、設定ドック項目追加
- [ ] `src/frontend/style.css`: ルーラー、目盛り、マーカー、カーソルインジケーター、縦破線ガイド線スタイル追加
- [ ] `src/frontend/help.html`: ヘルプ画面「表示」カテゴリに `Alt + R` 追記
- [ ] `src/frontend/js/state.js`: `appState.ruler` 追加
- [ ] `src/frontend/js/core/settingsManager.js`: 設定保存ペイロードに `ruler` 追加
- [ ] `src/frontend/js/ui/ruler.js`: ルーラー生成・目盛り・マーカー・ガイド線・スクロール同期の新規モジュール作成
- [ ] `src/frontend/js/ui/editor.js`: `applyRuler`, `toggleRuler` 実装およびメトリクス更新連携
- [ ] `src/frontend/js/ui/tabs.js`: タブごとのルーラー表示状態およびマーカー配置の保持・復元
- [ ] `src/frontend/js/ui/shortcuts.js`: `Alt + R` キーバインド登録
- [ ] `src/frontend/js/ui/settings.js`: 設定ドックでのルーラー表示切り替えハンドラ
- [ ] `src/frontend/js/main.js`: 起動時の初期化連携

### 検証・テスト
- [ ] `cargo test` の再実行・パス確認
- [ ] アプリビルド・起動確認
- [ ] ルーラー表示・目盛り・数字配置の確認
- [ ] カーソル追従インジケーターの動作確認
- [ ] マーカー追加・削除（上限10個）および縦破線ガイド線の表示確認
- [ ] ガイド線上でのテキスト編集・選択の動作確認（`pointer-events: none`）
- [ ] 折り返しOFF時の横スクロール連動確認
- [ ] 行番号トグル時の左オフセット同期確認
- [ ] ズーム・フォント変更時の文字幅再計算確認
- [ ] 複数タブ切り替え時の状態保持確認
- [ ] 設定ドックでのデフォルト値永続化・新規タブ反映確認
- [ ] ヘルプ画面のショートカット表示確認

### 報告・ドキュメント
- [ ] ウォークスルー（`docs/ruler/walkthrough.md`）の作成
- [ ] 変更履歴（`docs/history.md`）の最上部に Ver 0.2.25 の追記
- [ ] 実装コード・ドキュメントのコミット＆プッシュ
- [ ] ユーザーへの完了報告・確認要請
