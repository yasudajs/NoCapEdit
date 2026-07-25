# JSイベントリスナーの肥大化解消（Tabキー処理の抽出）実装計画書

`src/dist/js/main.js` の `setupUIEventListeners` に直接記述されているTabキー（インデント/アンインデント）の処理を `src/dist/js/ui/editor.js` の専用関数へ抽出し、`main.js` の肥大化解消と保守性・可読性の向上を図ります。

## ユーザーレビュー要否

- **ディスカッション完了**: 関数名 `handleEditorTabKey(e)` の採用、`editor.js` への配置、および既存挙動の100%維持方針について事前に合意を形成済みです。
- **動作仕様の変更**: なし（完全なリファクタリング）。

## 変更内容

### 1. バージョン先行更新
- [MODIFY] [Cargo.toml](file:///c:/work/NoCapEdit/Cargo.toml)
- [MODIFY] [tauri.conf.json](file:///c:/work/NoCapEdit/tauri.conf.json)
- [MODIFY] [nsis/installer.nsi](file:///c:/work/NoCapEdit/nsis/installer.nsi)
- [MODIFY] [DEVELOPMENT.md](file:///c:/work/NoCapEdit/docs/DEVELOPMENT.md)
  - 内部バージョンを `0.2.39` から `0.2.40` へ先行更新。

---

### 2. フロントエンド機能の抽出と整理

#### [MODIFY] [editor.js](file:///c:/work/NoCapEdit/src/dist/js/ui/editor.js)
- インデント文字取得用のモジュール非公開ヘルパー関数 `getIndentString()` を追加。
- Tabキー押下時のキーボードイベントハンドラー `export function handleEditorTabKey(e)` を追加。
  - `e.key === 'Tab'` 判定、`e.ctrlKey || e.altKey` のスキップ判定。
  - 単一行／複数行のインデント（Tab）およびアンインデント（Shift+Tab）処理。
  - 処理後の `elements.editor.dispatchEvent(new Event('input'))` の発行。

#### [MODIFY] [main.js](file:///c:/work/NoCapEdit/src/dist/js/main.js)
- `handleEditorTabKey` を `./ui/editor.js` から import。
- `setupUIEventListeners()` 内の肥大化していた Tabキーイベントリスナー（約85行）を `elements.editor.addEventListener('keydown', handleEditorTabKey);` へ置き換え。

---

## 検証計画

### 自動検証
- ビルド・型チェックスクリプト等の実行確認。

### 手動検証 (ユーザーテスト依頼項目)
1. **単一行インデント**: エディタ上で Tab キーを押下し、設定に応じたインデント（スペース2/スペース4/タブ）が挿入されること。
2. **単一行アンインデント**: インデントされた行で Shift+Tab を押下し、インデントが削除されること。
3. **複数行インデント**: 複数行を選択した状態で Tab キーを押下し、全選択行にインデントが加算されること。
4. **複数行アンインデント**: 複数行を選択した状態で Shift+Tab を押下し、全選択行のインデントが減算されること。
5. **設定連動**: 設定ダイアログで「Tabキーの挙動」を変更した際、インデント文字が正しく切り替わること。
6. **ショートカット干渉防止**: `Ctrl + Tab`（タブ切り替え）や `Alt` を含むショートカットの動作が阻害されないこと。
7. **ステータス連動**: Tabキー操作直後に、未保存インジケータ（`*`）および文字数/行数等のステータスバー表示が正しく更新されること。
