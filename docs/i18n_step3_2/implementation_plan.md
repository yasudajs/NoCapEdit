# [Phase 3] Step 3.2: `index.html` の多言語化対応

## 概要 (Goal Description)
`docs/wip/i18n_refactor/master_plan.md` の Phase 3 / Step 3.2 に基づき、`src/dist/index.html` に直接記述されている設定モーダルやツールチップ（title属性）などの日本語テキストを多言語化します。

## 対応方針（宣言的アプローチ）
HTMLの各要素に `id` を振って JS 側から個別に更新するのは冗長になるため、HTML 側にカスタムデータ属性（`data-i18n` や `data-i18n-title`）を付与し、初期化時に JS から一括で翻訳を適用する**宣言的なアプローチ**を採用します。

## User Review Required
以下の設計で進めてよろしいでしょうか？問題がなければ、引き続き作業用ブランチにて実装作業を開始します。

## Proposed Changes

### [MODIFY] [i18n.js](file:///c:/work/NoCapEdit/src/dist/i18n.js)
1. `DICT.ja` 内に HTML 用の静的テキストキー（例: `ui.tooltip.*`, `settings.title`, `settings.update.*`, `dialog.error.*` など）を多数追加します。
2. HTML 内の `data-i18n` 属性を走査して一括適用するヘルパー関数 `window.applyI18nToDOM = function() { ... }` を追加します。

### [MODIFY] [index.html](file:///c:/work/NoCapEdit/src/dist/index.html)
日本語テキストを含むすべてのタグに `data-i18n="キー名"` 属性を追加します。
また、`title="設定"` などのツールチップ属性は `data-i18n-title="キー名"` に置き換えます。
*(※ 開発時の視認性確保のため、HTML上の日本語テキスト（プレースホルダー）自体は残しますが、JSの実行によって多言語化テキストで上書きされます)*

### [MODIFY] [main.js](file:///c:/work/NoCapEdit/src/dist/js/main.js)
アプリの起動シーケンスの初期段階（`document.addEventListener('DOMContentLoaded', ...)` 内など）で `window.applyI18nToDOM()` を呼び出し、DOM 全体への翻訳適用処理を発火させます。

## Verification Plan
1. アプリを起動し、設定ダイアログ（歯車アイコン）を開く。
2. 全てのラベル（テーマ、フォント、保存モードなど）やセレクトボックスの選択肢が正しく日本語で表示されていること（`data-i18n` で上書き適用されていること）を確認する。
3. 歯車アイコンやタブ追加ボタン（＋）にマウスをホバーし、ツールチップ（title属性）が正しく表示されることを確認する。
