# コードレビュー: Ver 0.1.72 〜 0.1.85

Ver 0.1.71（リファクタリング完了）以降、Ver 0.1.85 までの全変更をレビューした結果です。

## レビュー対象バージョン

| バージョン | 主な変更内容 |
|---|---|
| 0.1.72 | タブ閉鎖時フォーカス改善、ARCHITECTURE.md 新設 |
| 0.1.73 | Ctrl+T 新規タブ追加 |
| 0.1.74 | Ctrl+E エクスプローラーで開く |
| 0.1.75 | F1 ヘルプ画面（ショートカット一覧） |
| 0.1.76 | Ctrl+W タブ閉じ、Ctrl+Q 終了 |
| 0.1.77 | 行の上下移動・複製・削除ショートカット |
| 0.1.78 | 行操作の Undo/Redo 完全連動 |
| 0.1.79 | ヘルプ画面最下部余白 |
| 0.1.80 | F5 タイムスタンプ挿入 |
| 0.1.81 | Ctrl+, 設定開閉、Ctrl+0 ズームリセット |
| 0.1.82 | 設定画面キーボード完全操作 |
| 0.1.83 | Alt+Z 行の折り返し切り替え |
| 0.1.84 | Ctrl+F/H 検索・置換機能 |
| 0.1.85 | タブスクロールバー配色改善・横スクロール |

## 変更ファイル (16ファイル, +1,380行)

```
src/dist/js/ui/findReplace.js   [NEW]  +376行
src/dist/js/ui/editor.js               +214行
src/dist/style.css                      +266行
src/dist/js/ui/shortcuts.js             +144行
src/dist/help.html              [NEW]  +140行
src/dist/js/ui/settings.js              +70行
src/dist/i18n.js                        +53行
src/dist/js/help.js             [NEW]  +43行
src/dist/index.html                     +28行
src/dist/js/ui/tabs.js                  +24行
src/dist/js/main.js                     +23行
src/dist/js/state.js                    +15行
tauri.conf.json                         +9行
src/settings.rs                         +8行
src/dist/js/core/settingsManager.js     +3行
src/commands.rs                         +1行
```

---

## レビュー結果サマリー

| 重要度 | 件数 |
|---|---|
| 🔴 Critical（修正推奨） | 2件 |
| 🟡 Warning（改善推奨） | 5件 |
| 🔵 Info（参考情報） | 3件 |

---

## 🔴 Critical（修正推奨）

### C-1. `replaceAll` での `$` 特殊文字の意図しない解釈

> [!CAUTION]
> ユーザーが置換後文字列に `$1`, `$&` 等を入力すると、意図しない文字列に化ける

- **該当**: [`findReplace.js`](file:///c:/work/NoCapEdit/src/dist/js/ui/findReplace.js#L267-L268)
- **説明**: 大文字/小文字を区別しない全件置換で `fullText.replace(regex, replaceText)` を使用しているが、JavaScript の `String.prototype.replace` は第2引数に `$&`（マッチ文字列自体）や `$1`（キャプチャグループ）等の特殊パターンを解釈する。ユーザーが `$100` を置換後文字列に入力すると予期しない結果になる。

```diff
 // 修正案: 関数を渡すことで $パターン解釈を回避
- newFullText = fullText.replace(regex, replaceText);
+ newFullText = fullText.replace(regex, () => replaceText);
```

---

### C-2. `applyEditorTextWithUndo` での `input` イベント二重発火

> [!CAUTION]
> `execCommand('insertText')` 成功時に `input` イベントが2回発火し、自動保存タイマーリセットや `renderTabs` が不要に2回実行される

- **該当**: [`editor.js`](file:///c:/work/NoCapEdit/src/dist/js/ui/editor.js#L188-L206)
- **説明**: `document.execCommand('insertText')` が成功するとブラウザが自動的に `input` イベントを発火する。その後 L205 で `dispatchEvent(new Event('input'))` を手動発火しているため、`onEditorInput` が **2回連続実行** される。これにより不要な `renderTabs` と `updateEditorMetrics` の重複実行、自動保存タイマーの無駄なリセットが発生する。

```diff
 // 修正案: execCommand 失敗時のフォールバックでのみ手動発火
     if (!document.execCommand('insertText', false, replacementText)) {
         elements.editor.setRangeText(replacementText, replaceStart, replaceEnd, 'end');
+        // フォールバック時はブラウザがinputイベントを発火しないため手動発火
+        elements.editor.dispatchEvent(new Event('input'));
     }
 
     if (newSelectionStart !== undefined && newSelectionEnd !== undefined) {
         elements.editor.setSelectionRange(newSelectionStart, newSelectionEnd);
     }
 
-    // 自動保存やステータス表示を連動
-    elements.editor.dispatchEvent(new Event('input'));
+    // execCommand 成功時はブラウザが自動的に input イベントを発火するため
+    // ここでの手動発火は不要（二重発火を防止）
```

---

## 🟡 Warning（改善推奨）

### W-1. ショートカットキーの到達不能コード（Dead Code）

- **該当**: [`shortcuts.js`](file:///c:/work/NoCapEdit/src/dist/js/ui/shortcuts.js#L142-L154)
- **説明**: L142 の `if (e.shiftKey)` ブロックで `Shift` 押下時は行間変更を実行し `return` で抜ける。しかし L154 のズーム拡大条件式に `(e.code === 'Semicolon' && e.shiftKey)` が含まれており、この条件は**絶対に到達しない**。実害は無いが、コードの意図が不明確になっている。

```diff
 // 修正案: 到達不能な条件を削除
- if (e.key === '+' || e.key === '=' || e.key === ';' || e.code === 'NumpadAdd' || e.code === 'Equal' || (e.code === 'Semicolon' && e.shiftKey)) {
+ if (e.key === '+' || e.key === '=' || e.key === ';' || e.code === 'NumpadAdd' || e.code === 'Equal') {
```

---

### W-2. 検索バー表示中のエディタ入力パフォーマンス

- **該当**: [`findReplace.js`](file:///c:/work/NoCapEdit/src/dist/js/ui/findReplace.js#L295-L299)
- **説明**: 検索ウィジェット表示中は、`input` イベント（1キーストロークごと）で `updateMatches` + `renderHighlights`（DOM全体再構築を含む）が同期的に実行される。大きなファイルで多数マッチがある場合、入力がカクつく可能性がある。

```diff
 // 改善案: デバウンスの導入
+ let findDebounceTimer;
  elements.editor.addEventListener('input', () => {
      if (isFindWidgetOpen()) {
-         updateMatches(false);
+         clearTimeout(findDebounceTimer);
+         findDebounceTimer = setTimeout(() => {
+             updateMatches(false);
+         }, 200);
      }
  });
```

---

### W-3. Shift+Tab アンインデント時のカーソル位置ズレの可能性

- **該当**: [`editor.js`](file:///c:/work/NoCapEdit/src/dist/js/ui/editor.js#L289-L296)
- **説明**: 複数行選択で Shift+Tab を押した際、`newSelectionEnd` を `end - totalRemovedCount` で計算している。選択終了位置（`end`）が行頭付近にあり、その行からインデントが削除されなかった場合、`totalRemovedCount` は他の行から削除された分を含むため、カーソルが行頭より手前に行きすぎる可能性がある。`Math.max(startLinePos, ...)` で最低限はガードされているが、中間行で問題が出るエッジケースが残る。

---

### W-4. 設定画面の `handleWordWrapChange` でアクティブエディタの null チェック不足

- **該当**: [`settings.js`](file:///c:/work/NoCapEdit/src/dist/js/ui/settings.js#L169-L176)
- **説明**: `saveSettings()` 内で `applyWordWrap(wordWrap)` を呼び出しているが、全タブが閉じられた状態では `elements.editor` が存在しない可能性がある。`applyWordWrap` 内部で `if (!elements.editor) return;` のガードがあるため**致命的ではない**が、`currentTab.wordWrap = wordWrap` の手前で `currentTab` 存在チェックが行われている設計は適切。

---

### W-5. ハイライト色のハードコーディング

- **該当**: [`style.css`](file:///c:/work/NoCapEdit/src/dist/style.css) (複数箇所)
- **説明**: 検索ハイライトやフォーカスアウトラインの色（`rgba(56, 189, 248, 0.45)` 等）が直接ハードコードされている。テーマ追加・変更時に個別修正が必要になり、保守性が低い。

---

## 🔵 Info（参考情報）

### I-1. `document.execCommand` の非推奨 API 使用

- **該当**: [`editor.js`](file:///c:/work/NoCapEdit/src/dist/js/ui/editor.js#L195)
- **説明**: `document.execCommand('insertText')` はW3C的に deprecated だが、`textarea` でのUndo連携を実現する**事実上唯一の方法**。Tauri v1 (WebView2) では正常動作する。将来の WebView バージョンアップ時に注意が必要。コード内にリスクコメントの追記を推奨。

### I-2. ヘルプ画面のテーマ値ホワイトリスト検証

- **該当**: [`help.js`](file:///c:/work/NoCapEdit/src/dist/js/help.js)
- **説明**: URL クエリパラメータからテーマ値を無検証で使用している。Tauri のローカルコンテキストでは実質的なセキュリティリスクは低いが、防御的プログラミングとして `['dark', 'soft-dark', 'light']` のホワイトリスト検証を入れると堅牢になる。

### I-3. `tauri.conf.json` のセキュリティ設定

- **該当**: [`tauri.conf.json`](file:///c:/work/NoCapEdit/tauri.conf.json#L40-L57)
- **説明**: `shell.open` が `"^.*$"`（全許可）、`security.csp` が `null`（無効）になっている。ローカルアプリとしてはリスクは限定的だが、ベストプラクティスとしては制限的な設定が望ましい。ただし、これは Ver 0.1.71 以前からの既存設定であり、今回のレビュー範囲での変更ではない。

---

## 総合評価

### 良い点 ✅
- **ショートカット管理**: 一貫したパターンで追加されており、衝突なし
- **Undo/Redo 統合**: `applyEditorTextWithUndo` による一元管理は優れた設計
- **i18n 対応**: 新規テキストはすべて `t()` 関数経由で管理されている
- **モジュール分離**: 各機能が適切なモジュールに配置、循環参照なし
- **アクセシビリティ**: 設定画面のキーボード操作が包括的に実装されている
- **XSS 対策**: `escapeHtml` によるサニタイジングが適切に実施されている
- **テーマ一貫性**: CSS 変数による3テーマ対応が適切に維持されている
- **行操作**: `moveLine` / `duplicateLine` / `deleteLine` のカーソル計算が数学的に正確

### 改善推奨事項の優先度

| 優先度 | 項目 | 影響 |
|---|---|---|
| **高** | C-1: replaceAll の $パターン | ユーザーデータ破壊リスク |
| **高** | C-2: input イベント二重発火 | パフォーマンス・意図しない副作用 |
| **中** | W-1: Dead Code 除去 | コード可読性 |
| **中** | W-2: 検索デバウンス | 大ファイル時のパフォーマンス |
| **低** | W-3: アンインデントカーソル | エッジケースのみ |
| **低** | W-5: CSS ハードコード | 将来の保守性 |
