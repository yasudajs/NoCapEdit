# コンテキストメニューの制限と開発環境での有効化 (v0.2)

アプリの操作性とデザインの統一感を高めるため、リリースビルドにおいてWebブラウザ標準の右クリックコンテキストメニュー（印刷、再読み込み、保存など）を無効化します。ただし、開発時のデバッグ（DevToolsの起動など）を容易にするため、デバッグビルド（`cargo tauri dev` 等）時にはコンテキストメニューを有効のまま維持します。

## 変更方針

- **バックエンド（Rust）側**:
  - `master` からのマージにより、デバッグビルド（`cfg!(debug_assertions)`）かどうかを返すTauriコマンド `is_debug` はすでに実装・登録済みです（追加の変更はありません）。
- **フロントエンド（JS）側**:
  - 起動時に上記コマンドを呼び出し、デバッグビルドではない（リリースビルドである）場合にのみ、グローバルな右クリックイベント（`contextmenu`）を `preventDefault()` で無効化します。

---

## 提案される変更 (Proposed Changes)

### 1. バックエンド (Tauri / Rust)
*   **[src/main.rs](file:///c:/work/NoCapEdit/src/main.rs)**
    *   すでにマージにより `is_debug` は定義・登録されており、追加の変更はありません。

---

### 2. フロントエンド (JS)

#### [MODIFY] [main.js](file:///c:/work/NoCapEdit/src/dist/js/main.js)
- `init()` 関数の初期化処理にて、`is_debug` コマンドを呼び出します。
- リリース版（`is_debug` が `false`）の場合は、右クリックメニューを無効化するイベントリスナーを追加します。

```javascript
        // コンテキストメニュー制限の適用
        const isDebug = await invoke('is_debug');
        if (!isDebug) {
            document.addEventListener('contextmenu', (e) => {
                e.preventDefault();
            });
        }
```

---

## 検証計画 (Verification Plan)

### 自動テスト
- 現在、Tauriやフロントエンド全体の統合自動テストは無いため、手動検証を行います。

### 手動確認
1. **開発モードでの動作確認**:
   - `cargo tauri dev` で起動し、右クリックメニュー（および開発者ツールの表示）が正常に行えることを確認する。
2. **リリースビルドでの動作確認**:
   - 一時的にRust側の `is_debug` が `false` を返すように変更してデバッグ起動するか、または `cargo tauri build` でビルドして、右クリックメニューが表示されない（無効化されている）ことを確認する。
