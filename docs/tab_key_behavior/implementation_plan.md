# タブ入力および設定機能の実装計画

エディタ画面でTabキー押下時に他要素へフォーカス移動せず、設定されたインデント（タブ文字またはスペース）を入力できるようにし、さらに複数行インデントやShift+Tabによる逆インデント、および設定の保存に対応します。

## User Review Required

> [!IMPORTANT]
> - 設定ファイルの構造変更: `config.json` に新キー `tab_behavior` を追加するため、古い設定ファイルが存在する場合でもデフォルト値 `"tab"` で自動マイグレーションされるようRust側で設定のデフォルトシリアライズ処理を行います。
> - 設定変更時の保存契機: 他の設定（テーマやフォント）と同様に、ドロップダウンでの変更時に遅延保存 (`saveSettingsDelay`) を行い、バックエンドに保存します。

## Open Questions

現時点で未解決の質問はありません（ご提示いただいた要件に基づき実装します）。

## Proposed Changes

### フロントエンド (HTML / JS / CSS)

#### [MODIFY] [index.html](file:///c:/work/NoCapEdit/src/dist/index.html)
- 設定ダイアログ (`#settingsDialog`) 内に、タブ挙動を設定する `<select id="tabBehaviorSelectModal">` を追加します。

#### [MODIFY] [main.js](file:///c:/work/NoCapEdit/src/dist/main.js)
- `appState` に `tabBehavior` フィールドを追加。
- 初期化関数 `init` で Tauri から取得した設定値を読み込み、ドロップダウンへ反映。
- 設定変更時 (`saveSettings`, `saveSettingsDelay`) に `tabBehaviorSelectModal` の値をバックエンドに送信して保存。
- エディタ要素 (`#editor`) に対し、`keydown` イベントハンドラーを追加。
- Tab押下時にデフォルト動作を `preventDefault()` で抑制し、選択範囲（単一行/複数行）にインデント文字を挿入するロジックを実装。
- Shift+Tab押下時に選択範囲（単一行/複数行）からインデントを1段階削除するロジックを実装。
- 入力変更後に `input` イベントをディスパッチして自動保存やメトリクス更新をトリガー。

---

### バックエンド (Rust)

#### [MODIFY] [main.rs](file:///c:/work/NoCapEdit/src/main.rs)
- `AppSettings` 構造体に `tab_behavior` フィールドを追加。デフォルト値は `"tab"` とする。
- `SettingsResponse` 構造体に `tab_behavior` フィールドを追加。
- `get_settings` コマンドで `tab_behavior` を返却するように修正。
- `save_settings` コマンドの引数に `tab_behavior` を追加し、設定ファイルに書き出せるように修正。

---

## Verification Plan

### Automated Tests
（本プロジェクトには自動テストスイートがない、またはビルドのみ確認するため、手動検証を中心に検証します）
- アプリのビルド確認:
  `cargo build` でビルドが通ることを確認します。

### Manual Verification
1. **設定の変更と永続化**:
   - 歯車マークの設定ボタンをクリック。
   - 「Tabキーの挙動」を「スペース 4文字」に変更し、OKボタンを押下。
   - アプリを再起動し、設定画面で「スペース 4文字」が維持されていることを確認。
   - 設定ファイル `%APPDATA%/NoCapEdit/config.json` を開き、`tab_behavior` が `"space4"` になっていることを確認。
2. **単一行でのインデント動作（Tab）**:
   - 設定を「タブ文字 (\t)」にし、エディタでTabキーを押すと `\t` が入力されることを確認。
   - 設定を「スペース 2文字」にし、Tabキーを押すとスペースが2つ入力されることを確認。
3. **複数行選択でのインデント動作（Tab）**:
   - 複数行のテキストを入力.
   - 複数行を選択した状態でTabキーを押下し、すべての選択行の行頭に設定通りのインデントが追加されることを確認。
4. **逆インデント動作（Shift + Tab）**:
   - インデントがある行で `Shift` + `Tab` を押下し、行頭からインデントが1段階（設定された文字数分）削除されることを確認。
   - 複数行を選択した状態で `Shift` + `Tab` を押下し、すべての選択行の行頭からインデントが削除されることを確認。
