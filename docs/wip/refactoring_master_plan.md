# リファクタリングマスタープラン

本ドキュメントは、NoCapEditのソースコード肥大化を防ぎ、将来の保守性・拡張性を向上させるためのリファクタリング全体計画です。
デグレード（機能退行）のリスクを最小限に抑えるため、フェーズおよびステップ単位で安全に段階的な修正を行います。各フェーズ・ステップごとに動作確認（検証）を行い、問題がないことを確認してから次に進む方針とします。

## フェーズ1：Rust バックエンド（`src/main.rs`）のモジュール分割
現在 `main.rs` に集中しているロジックを、責務ごとにモジュール化します。

* **ステップ 1.1：設定管理ロジックの抽出**
  * `src/settings.rs` を新規作成する。
  * `AppSettings`, `SettingsResponse` などの構造体、および設定の `load`, `save`, `config_path` などの実装を `settings.rs` に移動する。
  * `main.rs` から `settings` モジュールを呼び出すように修正する。
* **ステップ 1.2：単一インスタンス制御ロジックの抽出**
  * `src/instance.rs`（または `single_instance.rs`）を新規作成する。
  * `send_to_existing_instance`, `start_instance_listener` などのTCP通信関連の処理を移動する。
* **ステップ 1.3：Tauriコマンドハンドラの抽出**
  * `src/commands.rs` を新規作成する。
  * フロントエンドから呼び出される各種 `#[tauri::command]` 関数（`get_settings`, `save_settings`, `read_text_file` など）および、ファイルI/O補助関数（`next_available_file_path`, `normalize_crlf`）を移動する。
* **ステップ 1.4：`main.rs` の軽量化と結合テスト**
  * `main.rs` をアプリケーションのエントリポイントおよびTauriセットアップ専用にスリム化する。
  * ビルドが成功すること、アプリの起動・ファイルの保存・単一インスタンス制御が正常に動作することを確認する。

## フェーズ2：フロントエンドの冗長コード排除（タイムスタンプ処理）
機能影響が少なく、かつ冗長なコードを共通化します。

* **ステップ 2.1：タイムスタンプ生成関数の共通化**
  * `src/dist/js/utils/helpers.js` に、現在の日時文字列（`YYYYMMDD_HHMMSS`）を生成する `generateTimestamp()` 関数を実装する。
* **ステップ 2.2：`core/fileSystem.js` のリファクタリング**
  * `saveTabIfDirty` および `triggerManualSave` 内部にハードコードされている日付取得・文字列フォーマット処理を、`generateTimestamp()` の呼び出しに置き換える。
  * 手動保存および自動保存時に、ファイル名に正しくタイムスタンプが付与されるか検証する。

## フェーズ3：設定・アップデート関連UIの責務分離（`ui/settings.js`）
`ui/settings.js` から、UI制御以外のロジック（API通信やテーマ適用）を分離します。

* **ステップ 3.1：アップデートチェックロジックの抽出**
  * `src/dist/js/core/updater.js`（または `utils/updater.js`）を新規作成する。
  * `checkNewVersion` 関数とGitHub API呼び出しロジックを移動する。
  * `main.js` または `settings.js` からインポートして正常にアップデート通知が動作するか検証する。
* **ステップ 3.2：テーマおよびフォント適用ロジックの抽出（オプション）**
  * 必要に応じて、`ui/theme.js` を作成し、`applyThemeUI`, `onThemeChange`, `loadSystemFonts` などを移動して `settings.js` を純粋なダイアログUI制御に特化させる。

## フェーズ4：メイン処理とショートカットキー制御の分離（`main.js`）
巨大化している `main.js` を整理し、アプリ初期化コードの可読性を高めます。

* **ステップ 4.1：ショートカットキー処理の抽出**
  * `src/dist/js/ui/shortcuts.js` を新規作成する。
  * `main.js` 内の `window.addEventListener('keydown', ...)` および `window.addEventListener('wheel', ...)` に記述されているショートカット判定処理（Ctrl+S、Ctrl+Tab、拡大・縮小、行間調整など）を移動する。
* **ステップ 4.2：動作検証**
  * アプリ起動後、すべてのキーボードショートカットおよびマウスホイール操作がリファクタリング前と同様に機能するか検証する。

## フェーズ5：ファイルシステムとUIダイアログの疎結合化（将来向け）
* **ステップ 5.1：ダイアログUIの分離**
  * `core/fileSystem.js` に含まれる `showSaveErrorDialog`（エラーダイアログのDOM操作）を、`ui/dialogs.js` などへ分離し、Core層がUIのDOM構造（`elements.errorDialog`等）に直接依存しない設計にする。

---
**運用ルール**
* 本リファクタリング作業中は一つのブランチで作業し、マスタープランで定義したすべてのステップを完了後にmasterにマージします。
* 修正作業は各ステップごとに実装計画を作成し、各ステップごとの作業はクリーンアップまでとします。
* 複数のステップを同時に進めず、1つのステップが完了（クリーンアップまで）してから次のステップに着手することで、デグレードを防ぎます。
