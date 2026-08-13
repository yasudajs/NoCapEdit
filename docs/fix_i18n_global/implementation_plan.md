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

## Verification Plan

### Automated Tests
- なし（フロントエンドJSのリファクタリング）

### Manual Verification
- アプリを起動し、初期化時や設定画面でのテキスト表示、ファイル保存時のステータスバー等にエラーが出ず、正常に日本語文字列が表示されることを確認します。
