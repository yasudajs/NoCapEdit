# 実装計画書: Step 6 WAI-ARIA属性の付与 (v0.1.93)

## 概要
`docs/wip/review_v0.1.87_to_v0.1.92.md` で指摘された 🟡改善 #3（設定ドックの WAI-ARIA 属性未付与）に対応し、支援技術（スクリーンリーダー）対応やモーダルダイアログとしてのアクセシビリティ標準に準拠させます。

---

## 修正内容

### [MODIFY] [index.html](file:///c:/work/NoCapEdit/src/dist/index.html)

#### 1. WAI-ARIA 属性および ID の付与
設定ドック（`#settingsDialog`）に `role="dialog"`、`aria-modal="true"`、`aria-labelledby="settingsDialogTitle"` を付与し、見出しの `<h2>` に `id="settingsDialogTitle"` を付与します。

```diff
     <!-- 設定ダイアログ -->
-    <div id="settingsDialog" class="dialog-overlay hidden">
+    <div id="settingsDialog" class="dialog-overlay hidden" role="dialog" aria-modal="true" aria-labelledby="settingsDialogTitle">
         <div class="dialog-box">
-            <h2 data-i18n="ui.dialog.settings.title">NoCapEdit - 設定</h2>
+            <h2 id="settingsDialogTitle" data-i18n="ui.dialog.settings.title">NoCapEdit - 設定</h2>
```

---

## バージョンについて
- 本リファクタリング（Step 1〜10）は同一バージョン（`0.1.93`）および同一作業ブランチ内で実施するため、バージョン番号の変更はありません。

---

## 検証計画
1. `cargo test` を実行してテストが正常通過することを確認
2. `npm run tauri dev` でアプリを起動
3. 設定ドックの開閉（`Ctrl + ,` / `Esc`）、各種キーボードナビゲーション（`Tab` / `Shift + Tab`）、セレクトボックス操作が通常通り動作することを確認
4. DOM要素に ARIA 属性が正しく設定されていることを確認
