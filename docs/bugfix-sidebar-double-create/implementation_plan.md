# Sidebar Double Creation Bug Fix (Step 5-1-3)

ファイルツリー上のフォルダ項目にフォーカスがある状態で `Ctrl+D` (または `Ctrl+N`) を押下した際、イベントが `window` までバブリングすることで `createItemGlobally` と重複して実行され、フォルダが二重に作成されてしまう（かつ入力状態にならない）不具合を修正します。

## 提案する変更内容

### UI コンポーネント (JavaScript)

#### [MODIFY] [sidebar.js](file:///c:/work/NoCapEdit/src/dist/js/ui/sidebar.js)
`sidebar.js` の `itemDiv` に対する `keydown` イベントリスナー ([sidebar.js#L518-L560](file:///c:/work/NoCapEdit/src/dist/js/ui/sidebar.js#L518-L560)) において、自身で処理（`preventDefault()` を呼ぶもの）するショートカットキー処理時に `e.stopPropagation()` を追加します。
これにより、イベントが親要素や `window` までバブリングするのをブロックし、二重実行を防ぎます。

具体的には、以下のキー入力処理時に `e.stopPropagation()` を呼び出します。
- `Ctrl+N` (新規ファイル作成)
- `Ctrl+D` (新規フォルダ作成)
- `Ctrl+C` (コピー)
- `Ctrl+X` (切り取り)
- `Ctrl+V` (貼り付け)
- `F2` (名前変更)
- `Delete` / `Shift+Delete` (削除) ※ [sidebar.js#L411-L439](file:///c:/work/NoCapEdit/src/dist/js/ui/sidebar.js#L411-L439) の処理部分
- `ArrowDown` / `ArrowUp` / `ArrowRight` / `ArrowLeft` (ツリー移動)
- `Enter` / `Escape` (決定 / キャンセル)

ツリー項目自身がキーイベントを消費してフォーカスや選択を処理するため、これら全ての操作でバブリングを止めるのが安全です。

---

## 検証計画

### 手動検証手順（テスト項目）
実装完了後、以下の手動テストを行い、不具合が解消されたことと、他の操作に影響がないことを確認します。

1. **二重作成バグの解消確認**
   - ファイルツリー上にディレクトリがない状態で、`Ctrl+D` を押下してディレクトリ `aaa` を作成。
   - `aaa` にフォーカスがある状態で、再び `Ctrl+D` を押下する。
   - **期待値**: 「新しいフォルダ」が1つだけインライン編集状態（入力待ち）で作成されること。二重に作成（「新しいフォルダ」と「新しいフォルダ_01」）されないこと。
2. **新規ファイルのバグ解消確認 (Ctrl+N)**
   - 同様に `aaa` にフォーカスがある状態で `Ctrl+N` を押下する。
   - **期待値**: 「名称未設定.nctx」が1つだけインライン編集状態で作成されること。
3. **キーボードナビゲーションの動作確認**
   - 矢印キー（上下）での項目移動、矢印キー（左右）でのフォルダ展開・折りたたみが正常に機能すること。
   - `Esc` キーでエディタにフォーカスが戻ること。
   - `F2` キーでインライン名前変更が開始され、`Enter` で確定、`Esc` でキャンセルできること。
   - `Ctrl+C`, `Ctrl+X`, `Ctrl+V` によるコピペ・移動が正常に機能すること。
