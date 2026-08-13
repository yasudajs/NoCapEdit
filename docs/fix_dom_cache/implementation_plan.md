# `state.js` のDOM要素キャッシュ初期化タイミングの修正計画

リファクタリングレビューで指摘された「4. `state.js` のDOM要素キャッシュの初期化タイミング」を修正します。
モジュールロード時に `document.getElementById` が実行されて無意味な（DOM構築前のため）取得が行われている状態を解消し、初期値の意図を明確にするため明示的に `null` を設定します。

## User Review Required

以下の修正方針をご確認ください。

## Proposed Changes

### Frontend JS

#### [MODIFY] [state.js](file:///c:/work/NoCapEdit/src/dist/js/state.js)
`elements` オブジェクトの定義部分において、各プロパティの初期値を `document.getElementById(...)` から `null` に変更します。
実際のDOM要素取得は、すでに実装されている `initElements()` メソッド内で `DOMContentLoaded` 後に正しく行われるため、アプリケーションの動作には影響を与えずにコードの意図が明確になります。

```diff
 export const elements = {
-    app: document.getElementById('app'),
-    tabsContainer: document.getElementById('tabsContainer'),
-    // ... 以降全てのプロパティについても同様に変更
+    app: null,
+    tabsContainer: null,
+    // ... 以降全てのプロパティを null で初期化
 };
```

## Verification Plan

### Automated Tests
- なし（フロントエンドJSのロジック変更）

### Manual Verification
- アプリを起動し、UIが正常に描画され、タブ操作やエディタ入力などの基本機能が問題なく動作することを確認します（要素の取得失敗による `TypeError: Cannot read properties of null` が発生しないことを確認）。
