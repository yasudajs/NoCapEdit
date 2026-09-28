# タスクリスト: ファイル専用アイコンの導入 (Ver 0.2.22)

- [x] **フェーズ 1: 実装計画の作成・合意**
  - [x] アイコンデザイン案の作成およびユーザー合意（案A採用）
  - [x] 関連付け仕様・対象拡張子の設計合意（データ系・一時ファイル系・プログラミング系追加）
  - [x] 実装計画書（`implementation_plan.md`）およびタスクリスト（`task.md`）の作成・更新
  - [x] ユーザーによる実装計画の承認待ち

- [ ] **フェーズ 2: 実装作業の開始（ユーザーの「作業開始」指示後）**
  - [x] `master` から作業用ブランチ `feature/file-icon` を作成
  - [x] `docs/wip/file-icon/` を `docs/file-icon/` へ移動・コミット＆プッシュ
  - [x] バージョン管理 5 ファイルのバージョン番号を `0.2.22` に更新
    - [x] `Cargo.toml`
    - [x] `package.json`
    - [x] `tauri.conf.json`
    - [x] `nsis/installer.nsi`
    - [x] `docs/DEVELOPMENT.md`
  - [x] `docs/spec.md` にファイルアイコン仕様・レジストリ仕様を追記

- [x] **フェーズ 3: アイコンリソース作成**
  - [x] `icons/document.png`（マスター高解像度 PNG 512x512）の作成
  - [x] `icons/document.ico`（マルチサイズ ICO: 16, 24, 32, 48, 64, 128, 256）の作成

- [x] **フェーズ 4: インストーラー・関連付けの実装**
  - [x] `nsis/installer.nsi` の改修
    - [x] `$INSTDIR\document.ico` のインストール処理追加
    - [x] 共通 ProgID（`NoCapEdit.Document`）および `DefaultIcon` 登録
    - [x] `Applications\NoCapEdit.exe\DefaultIcon` 登録（全関連付けファイルへの自動適用）
    - [x] `Applications\NoCapEdit.exe\SupportedTypes` 登録（Web・プログラミング言語系拡張子含む）
    - [x] 主要拡張子の Capabilities / FileAssociations 登録
    - [x] アンインストール時の `document.ico` 削除・レジストリ削除処理
  - [x] `wix/file-association.wxs` の `DefaultIcon` 指定更新

- [x] **フェーズ 5: ビルド＆動作検証**
  - [x] フロントエンド・バックエンドのビルド確認
  - [x] NSIS インストーラーのビルド確認
  - [x] レジストリ登録・エクスプローラーでのアイコン表示検証（`.txt`, `.csv`, `.html`, `.py` 等）
  - [x] 未知の拡張子を手動関連付けした際のファイルアイコン適用検証
  - [x] アプリアイコン（本体・ショートカット）が丸いアイコンのまま維持されていることの確認

- [x] **フェーズ 6: レビュー準備・完了報告**
  - [x] `docs/file-icon/walkthrough.md`（ウォークスルー）の作成
  - [x] `docs/history.md` に `Ver 0.2.22` の変更履歴を追記
  - [x] コミット＆プッシュおよびユーザーへの確認依頼
