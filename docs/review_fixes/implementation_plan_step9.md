# 実装計画書: Step 9 テーマ値ホワイトリスト検証追加 🔵

## 概要
[`src/dist/js/help.js`](file:///c:/work/NoCapEdit/src/dist/js/help.js) において、URL クエリパラメータ（`?theme=...`）から取得したテーマ値をそのまま使用して分岐しています。  
防御的プログラミングのベストプラクティスとして、有効なテーマ値のホワイトリスト（`['dark', 'soft-dark', 'light']`）によるバリデーションを追加し、不正な値や未指定時には安全にデフォルトテーマ（`dark`）にフォールバックするようにします（I-2）。また、開発用デバッグログ（`console.log`）を整理します。

## 対象ファイル
- [`src/dist/js/help.js`](file:///c:/work/NoCapEdit/src/dist/js/help.js)

## 修正内容の詳細

### [MODIFY] [help.js](file:///c:/work/NoCapEdit/src/dist/js/help.js)
ホワイトリスト定数 `VALID_THEMES` を導入し、安全にテーマを適用します。

```diff
+const VALID_THEMES = ['dark', 'soft-dark', 'light'];
+
 // 初期化
 document.addEventListener('DOMContentLoaded', () => {
     // 翻訳テキストの適用
     applyI18nToDOM();
 
     // ウィンドウタイトルの設定
     const titleText = t('help.title');
     if (titleText && window.__TAURI__) {
         window.__TAURI__.window.appWindow.setTitle(titleText).catch(console.error);
     }
 
     // テーマの適用
-    console.log("[help.js] window.location.href:", window.location.href);
-    console.log("[help.js] window.location.search:", window.location.search);
     const urlParams = new URLSearchParams(window.location.search);
-    const theme = urlParams.get('theme');
-    console.log("[help.js] URLから取得したtheme:", theme);
+    const themeParam = urlParams.get('theme');
+    const theme = VALID_THEMES.includes(themeParam) ? themeParam : 'dark';
 
     if (theme === 'light') {
         document.body.classList.add('light-theme');
-        console.log("[help.js] light-theme クラスを適用しました");
     } else if (theme === 'soft-dark') {
         document.body.classList.add('soft-dark-theme');
-        console.log("[help.js] soft-dark-theme クラスを適用しました");
-    } else {
-        console.log("[help.js] デフォルトのダークテーマ（クラス付与なし）となります");
     }
 });
```

## 動作確認・検証計画

### 1. ヘルプ画面のテーマ表示確認
- [ ] Dark テーマ時に `F1` キーでヘルプ画面を開き、Dark テーマが正しく適用されることを確認
- [ ] Light テーマ時に `F1` キーでヘルプ画面を開き、Light テーマが正しく適用されることを確認
- [ ] Soft Dark テーマ時に `F1` キーでヘルプ画面を開き、Soft Dark テーマが正しく適用されることを確認

### 2. キーボード操作・閉じる動作確認
- [ ] ヘルプ画面で `Esc` キーを押してヘルプ画面が正常に閉じることを確認
