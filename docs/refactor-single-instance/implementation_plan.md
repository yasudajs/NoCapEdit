# 3-1. TCPポートハードコードの廃止と単一インスタンス管理の堅牢化

現在 NoCapEdit は、2つ目のインスタンス起動時にプライマリインスタンスへファイルパスを伝達するため、固定のTCPポート（`49423`）を使用して通信を行っています。
この方式は、他のアプリケーションによるポート占有や、クラッシュ後のポート未解放によって、アプリケーション自体が起動できなくなるリスクがあります。
本実装では、公式プラグイン `tauri-plugin-single-instance` を導入し、OSネイティブのプロセス間通信機構に置き換えることで、堅牢な単一インスタンス管理を実現します。

## User Review Required
特にありません（事前のディスカッションにて方針合意済み）。

## Open Questions
特にありません。

## Proposed Changes

### Backend (Rust)

#### [MODIFY] [Cargo.toml](file:///c:/work/NoCapEdit/Cargo.toml)
- `tauri-plugin-single-instance` (v0.1.x系などの Tauri v1 対応版) を依存関係に追加。

#### [MODIFY] [constants.rs](file:///c:/work/NoCapEdit/src/constants.rs)
- `SINGLE_INSTANCE_PORT` および `SINGLE_INSTANCE_HOST` の定義を削除。

#### [MODIFY] [main.rs](file:///c:/work/NoCapEdit/src/main.rs)
- 自前のTCPサーバー（`start_instance_listener`）とTCPクライアント通信（`send_to_existing_instance`）関数を削除。
- main関数の起動時における `TcpListener::bind` によるプライマリ/セカンダリ判定処理を削除。
- `tauri-plugin-single-instance` プラグインをTauriビルダーに登録 (`.plugin(tauri_plugin_single_instance::init(...))`)。
- プラグインのコールバッククロージャ（`on_second_instance`的役割）内で以下の処理を実装：
  - 2つ目のインスタンスが起動された際、引数（`argv`）から開こうとしたファイルのパスを抽出する。`argv` の先頭（実行ファイルパス）等を除外し、有効なファイルパスが存在する場合のみ取得する。
  - プライマリウィンドウ (`app.get_window("main")`) を取得し、前面に表示 (`unminimize()`, `set_focus()`) させる。
  - 有効なファイルパスが存在した場合は、既存の `single-instance-file` イベントをエミットしてフロントエンドへ伝達する。

### Frontend (Javascript)
- フロントエンド側の受け取り処理（`single-instance-file` のリスナー等）はそのまま活かせるため、変更不要。

## Verification Plan

### Automated Tests
- `cargo check` および `cargo build` を実行し、コンパイルエラーがないことを確認する。

### Manual Verification
- ユーザーによる手動テストとして以下を依頼する。
  - アプリを起動し、正常に立ち上がることを確認する。
  - 1つ目が起動している状態で、ターミナルから `NoCapEdit.exe C:\path\to\test.nctx` のように引数付きで2つ目のインスタンスを起動する。
  - 2つ目のウィンドウが表示されず即座に終了し、1つ目のウィンドウが最前面にフォーカスされ、指定したファイルが新しいタブで開かれることを確認する。
  - 1つ目が起動している状態で、引数なしで2つ目を起動した際、単に1つ目のウィンドウがフォーカスされることを確認する。
