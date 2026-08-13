# `i18n.js` グローバル関数汚染解消の修正計画

リファクタリングレビューで指摘された「10. `i18n.js` での `window.t()` のグローバル関数登録」を修正します。
現在 `window.t` および `window.applyI18nToDOM` という形でグローバル空間を汚染しているため、これを ES モジュール の `export` / `import` の仕組みに置き換え、各モジュールで明示的にインポートして利用するモダンな構成に変更します。

## User Review Required

以下の修正方針をご確認ください。

## Proposed Changes

### Frontend HTML

#### [MODIFY] [index.html](file:///c:/work/NoCapEdit/src/dist/index.html)
`i18n.js` をグローバルスクリプトとして読み込んでいる `<script src="i18n.js"></script>` を削除します。（今後は `main.js` 等からモジュールとして読み込まれます）

### Frontend JS

#### [MODIFY] [i18n.js](file:///c:/work/NoCapEdit/src/dist/i18n.js)
`window.t` および `window.applyI18nToDOM` への代入を廃止し、`export function t(...)` および `export function applyI18nToDOM()` としてエクスポートします。

#### [MODIFY] 各モジュールファイル
以下の各ファイルにおいて、`window.t` の使用箇所を `t` に置き換え、ファイルの先頭で `i18n.js` からインポートするように変更します。

- **[main.js](file:///c:/work/NoCapEdit/src/dist/js/main.js)**
  - `import { t, applyI18nToDOM } from '../i18n.js';` を追加。
- **[fileSystem.js](file:///c:/work/NoCapEdit/src/dist/js/core/fileSystem.js)**
  - `import { t } from '../../i18n.js';` を追加。
- **[settings.js](file:///c:/work/NoCapEdit/src/dist/js/ui/settings.js)**
  - `import { t } from '../../i18n.js';` を追加。
- **[theme.js](file:///c:/work/NoCapEdit/src/dist/js/ui/theme.js)**
  - `import { t } from '../../i18n.js';` を追加。

## 追加修正: 初期化停止バグの解消

### 問題の状況と原因
先の修正後にアプリを起動すると、エディタ画面が「準備中...」のまま新規タブが表示されない不具合が発生しました。
原因は、`src/dist/js/ui/tabs.js` と `src/dist/js/ui/editor.js` の2ファイルにて、これまでグローバルに存在していた `t('...')` を直接呼び出していた箇所が残っていたためです。
これらは `window.t` という明示的な呼び出し方ではなかったため前回の置換処理から漏れており、ESモジュール化によってグローバルから `t` が消滅したことで未定義エラー (`ReferenceError: t is not defined`) となり、アプリの初期化が停止していました。

### 修正案
以下の2ファイルにおいて、`i18n.js` からの `import` 文を追加します。

- **[tabs.js](file:///c:/work/NoCapEdit/src/dist/js/ui/tabs.js)**
  - `import { t } from '../../i18n.js';` を追加。
- **[editor.js](file:///c:/work/NoCapEdit/src/dist/js/ui/editor.js)**
  - `import { t } from '../../i18n.js';` を追加。

## Verification Plan

### Automated Tests
- なし

### Manual Verification
- アプリを起動し、初期化が正常に完了して新規タブが開くこと、エラーが表示されずUIの翻訳が正しく反映されることを確認します。
