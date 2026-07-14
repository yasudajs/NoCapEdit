# コンテキストメニューの制限と開発環境での有効化

アプリの操作性とデザインの統一感を高めるため、リリースビルドにおいてWebブラウザ標準の右クリックコンテキストメニュー（印刷、再読み込み、保存など）を無効化します。ただし、開発時のデバッグ（DevToolsの起動など）を容易にするため、デバッグビルド（`cargo tauri dev` 等）時にはコンテキストメニューを有効のまま維持します。

## 変更方針

- **バックエンド（Rust）側**:
  - 現在ビルドされているアプリがデバッグビルド（`cfg!(debug_assertions)`）かどうかを返すTauriコマンド（例: `is_debug`）を追加します。
- **フロントエンド（JS）側**:
  - 起動時に上記コマンドを呼び出し、デバッグビルドではない（リリースビルドである）場合にのみ、グローバルな右クリックイベント（`contextmenu`）を `preventDefault()` で無効化します。

---

## 提案される変更 (Proposed Changes)

### 1. バックエンド (Tauri / Rust)

#### [MODIFY] [main.rs](file:///c:/work/NoCapEdit/src/main.rs)
- 以下のTauriコマンドを定義し、`tauri::Builder` の `invoke_handler` に登録します。

```rust
#[tauri::command]
fn is_debug() -> bool {
    cfg!(debug_assertions)
}
```

---

### 2. フロントエンド (JS)

#### [MODIFY] [main.js](file:///c:/work/NoCapEdit/src/dist/js/main.js)
- アプリ起動時の初期化処理にて、`is_debug` コマンドを呼び出します。
- リリース版（`is_debug` が `false`）の場合は、右クリックメニューを無効化するイベントリスナーを追加します。

```javascript
// 実装イメージ
const { invoke } = window.__TAURI__.tauri;

invoke('is_debug').then((isDebug) => {
  if (!isDebug) {
    document.addEventListener('contextmenu', (e) => {
      e.preventDefault();
    });
  }
});
```

---

## 検証計画 (Verification Plan)

### 手動確認
1. **開発モードでの動作確認**:
   - `cargo tauri dev` で起動し、右クリックメニュー（および開発者ツールの表示）が正常に行えることを確認する。
2. **リリースビルドでの動作確認**:
   - リリース用のビルドを行い（またはダミーでRust側のコマンドが `false` を返すように変更して動作確認し）、右クリックメニューが表示されない（無効化されている）ことを確認する。
