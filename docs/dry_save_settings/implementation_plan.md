# 実装計画書: 設定保存処理のDRY化（共通化・構造体化）およびバージョン更新

Tauriの `save_settings` コマンドとその呼び出し（JavaScript側）について、パラメータの個別列挙を廃止し、設定構造体を直接やり取りするDRYな設計に改修します。これにより、今後の設定追加時の追随漏れを防止します。また、本改修に伴いバージョンを `0.1.31` に更新します。

## Proposed Changes

### バージョン情報更新

#### [MODIFY] [Cargo.toml](file:///c:/work/NoCapEdit/Cargo.toml)
- パッケージの `version` を `"0.1.30"` から `"0.1.31"` に更新します。

#### [MODIFY] [tauri.conf.json](file:///c:/work/NoCapEdit/tauri.conf.json)
- `package.version` を `"0.1.30"` から `"0.1.31"` に更新します。

#### [MODIFY] [installer.nsi](file:///c:/work/NoCapEdit/nsis/installer.nsi)
- `VERSION` マクロの定義を `"0.1.30"` から `"0.1.31"` に更新します。
- `VERSIONWITHBUILD` マクロの定義を `"0.1.30.0"` から `"0.1.31.0"` に更新します。

#### [MODIFY] [DEVELOPMENT.md](file:///c:/work/NoCapEdit/docs/DEVELOPMENT.md)
- ポータブル版ビルド手順で記載されている zip 圧縮コマンド例の中のバージョン表記を `0.1.31` に更新します。

#### [MODIFY] [history.md](file:///c:/work/NoCapEdit/docs/history.md)
- `Ver 0.1.31` のセクションを最上部に追加し、本日の日付と改修内容（設定保存処理のDRY化による不具合再発防止）を記載します。

---

### Rust バックエンド

#### [MODIFY] [main.rs](file:///c:/work/NoCapEdit/src/main.rs)
- `save_settings` 関数のパラメータを個別の引数の羅列から、設定全体を表す `settings: AppSettings` 構造体に一本化します。
- `AppSettings` 構造体はすでに `serde::Deserialize` を実装しているため、Tauriが自動的にJS側のオブジェクトから変換します。

```rust
// 変更後イメージ
#[tauri::command]
fn save_settings(
    settings: AppSettings,
) -> Result<(), String> {
    // ディレクトリ作成
    fs::create_dir_all(&settings.home_folder).map_err(|e| e.to_string())?;
    // 保存処理の実行
    settings.save().map_err(|e| e.to_string())
}
```

---

### フロントエンド

#### [MODIFY] [main.js](file:///c:/work/NoCapEdit/src/dist/main.js)
- 現在、設定を保存するために `save_settings` コマンドを呼び出している3つの箇所をリファクタリングします。
- 新たに共通の非同期関数 `saveApplicationSettings()` を定義し、設定情報を1つのオブジェクト（`settings` キーを持つオブジェクト）にまとめてRust側に渡すようにします。

```javascript
// 新設する共通関数イメージ
async function saveApplicationSettings() {
    try {
        await invoke('save_settings', {
            settings: {
                homeFolder: appState.homeFolder,
                theme: appState.theme,
                fontSize: appState.fontSize,
                fontFamily: appState.fontFamily,
                lineHeight: appState.lineHeight,
                tabBehavior: appState.tabBehavior,
                saveMode: appState.saveMode,
                charCountMode: appState.charCountMode
            }
        });
    } catch (error) {
        console.error('Failed to save settings:', error);
    }
}
```

- 以下の3箇所について、直接 `invoke` を行っていた部分を `saveApplicationSettings()` の呼び出しに置換します。
  1. **設定ダイアログ保存時 (L585付近)**: 値を `appState` に同期させたあと、`saveApplicationSettings()` を呼び出す。
  2. **テーマ切り替え時 (L687付近)**: `appState.theme` を更新後、`saveApplicationSettings()` を呼び出す。
  3. **遅延保存時 (L1395付近)**: `saveApplicationSettings()` を呼び出す。

---

## Verification Plan

### Automated Tests
- 本プロジェクトには設定保存に関する自動テスト（ユニットテスト）がないため、ビルドが通ることを `cargo build` で検証します。

### Manual Verification
1. **アプリのビルド**:
   - `npm run dev` または `cargo tauri dev` にて起動可能か確認する。
   - アプリケーションが起動した際、タイトルバーのバージョン表記が `[ Ver 0.1.31 ]` になっていることを確認する。
2. **設定画面からの変更保存のテスト**:
   - 設定画面（右ドック）を開き、フォントサイズ、フォントファミリー、インデント設定、保存モード等を変更し、変更が即時保存・反映されるかテストする。
3. **テーマ切り替えの永続化テスト**:
   - テーマを「ダーク」から「ライト」に切り替え、一度アプリを閉じて再起動する。
   - 再起動後にライトモードのまま起動すること、設定ファイルのjsonで `"theme": "light"` となっていることを確認する。
4. **自動保存の動作テスト**:
   - 文字入力をして3秒経過した際に、ステータスバーが「保存中...」→「保存済み」に変わり、ファイルに変更が保存されることをテストする。
