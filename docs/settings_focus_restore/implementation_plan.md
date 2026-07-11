# 設定画面閉じた後のカーソル位置復元 実装計画

設定画面（settingsDialog）を開いて閉じた際、エディタ（textarea）に自動的にフォーカスが戻り、開く直前のカーソル位置（およびスクロール位置）が復元されるようにします。これにより、ユーザーは設定を変更した後すぐに文字入力を再開できます。

## ユーザーレビュー

> [!NOTE]
> 本変更はフロントエンドのスクリプト（`main.js`）のみに閉じており、Rust側の修正やHTML/CSSの構造変更はありません。既存のエディタ動作に対する影響リスクは極めて低いです。

## オープンな質問

特になし。

## 提案する変更

### フロントエンド (`src/dist/main.js`)

#### [MODIFY] [main.js](file:///c:/work/NoCapEdit/src/dist/main.js)

1. **カーソル状態保持用の変数を追加**
   - 設定画面を開く前のエディタの状態を保持するため、ファイルグローバル（または適切なスコープ）に `savedEditorCursor` 変数を定義します。
   ```javascript
   let savedEditorCursor = null;
   ```

2. **`openSettingsDialog` 関数の修正 (L499付近)**
   - 設定画面を開く直前に、エディタ要素が存在することを確認した上で、カーソル位置（`selectionStart`, `selectionEnd`）とスクロール位置（`scrollTop`）を保存します。
   ```javascript
   // 設定画面を開く前にカーソル位置を保存
   if (elements.editor) {
       savedEditorCursor = {
           selectionStart: elements.editor.selectionStart || 0,
           selectionEnd: elements.editor.selectionEnd || 0,
           scrollTop: elements.editor.scrollTop || 0,
       };
   }
   ```

3. **`closeSettingsDialog` 関数の修正 (L491付近)**
   - 設定画面を閉じる際、保存されたカーソル状態がある場合にそれを適用し、エディタにフォーカスを戻します。処理後は `savedEditorCursor` を `null` にクリアします。
   ```javascript
   // エディタにフォーカスを戻し、カーソル位置を復元
   if (savedEditorCursor !== null && elements.editor) {
       elements.editor.focus();
       elements.editor.selectionStart = savedEditorCursor.selectionStart;
       elements.editor.selectionEnd = savedEditorCursor.selectionEnd;
       elements.editor.scrollTop = savedEditorCursor.scrollTop;
       savedEditorCursor = null;
   }
   ```

---

## 検証計画

### 自動テスト
- 現在、フロントエンドのJavaScriptに対する自動ユニットテスト環境は構築されていないため、手動検証で網羅的にテストを行います。

### 手動検証
1. **基本的なカーソル復元テスト**:
   - エディタに適当な文字（例: `Hello World`）を入力する。
   - `World` の直前（6文字目）にカーソルを配置する。
   - 歯車ボタンをクリックして設定画面を開く。
   - 歯車ボタンを再クリックして設定画面を閉じる。
   - **確認事項**: エディタに自動でフォーカスが戻り、カーソルが `World` の直前で点滅していること。

2. **テキスト選択状態の復元テスト**:
   - `World` という単語を選択状態（ハイライト）にする。
   - 設定画面を開く。
   - 設定画面の外側（オーバーレイ背景）をクリックして閉じる。
   - **確認事項**: エディタに自動でフォーカスが戻り、`World` の選択状態が維持されていること。

3. **スクロール位置の復元テスト**:
   - エディタに複数行（画面外にスクロールする程度）のテキストを入力する。
   - 下方までスクロールし、特定の行にカーソルを置く。
   - 設定画面を開く。
   - 設定画面を閉じる。
   - **確認事項**: スクロール位置がずれることなく、元の行にカーソルが復元されていること。
