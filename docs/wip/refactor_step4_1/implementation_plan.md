# [リファクタリング] ステップ 4.1：ショートカットキー処理の抽出

本計画は、「リファクタリングマスタープラン」のフェーズ4のステップ4.1「ショートカットキー処理の抽出」を実施するための実装計画です。

現在、`src/dist/js/main.js` の `setupUIEventListeners` 関数内には、ウィンドウ全体に対するキーボードイベント（`keydown`）やマウスホイールイベント（`wheel`）のショートカット処理が直接記述されており、ファイルが肥大化する原因となっています。
これらを新設する `src/dist/js/ui/shortcuts.js` に `setupKeyboardShortcuts` 関数として切り出し、初期化コードの可読性を向上させます。

## ユーザー承認必須事項

> [!IMPORTANT]
> - 本ステップでは、既存のショートカットキーの挙動やロジックそのものは変更せず、コードの配置場所のみを移動します。
> - エディタ内の文字入力に関するキーイベント（Tabキーのインターセプト等）はエディタ固有の処理であるため、今回の `shortcuts.js`（グローバルショートカット）には含めず、引き続き `editor.js` 側で管理する方針とします。
> 
> 本計画の内容に問題がないかご確認いただき、承認の指示（「作業開始」等）をお願いいたします。

## 提案する変更内容

### ショートカットキー処理の分離

#### [NEW] [`src/dist/js/ui/shortcuts.js`](file:///c:/work/NoCapEdit/src/dist/js/ui/shortcuts.js)
新規ファイルを作成し、以下の関数を定義します。
- `setupKeyboardShortcuts()`
  - `window.addEventListener('wheel', ...)` の処理（Ctrl+ホイールでの拡大縮小、Ctrl+Shift+ホイールでの行間調整）を移動します。
  - `window.addEventListener('keydown', ...)` の処理（F5/Ctrl+Rの禁止、Ctrl+Tabでのタブ切り替え、Ctrl+Sでの保存、ショートカットキーでの拡大縮小・行間調整）を移動します。
※ 必要な依存関数（`switchTabByOffset`, `increaseLineHeight`, `decreaseLineHeight`, `zoomIn`, `zoomOut`, `triggerManualSave`）は各モジュールからインポートします。

#### [MODIFY] [`src/dist/js/main.js`](file:///c:/work/NoCapEdit/src/dist/js/main.js)
- `setupUIEventListeners` 関数内に直接書かれていた `window.addEventListener('wheel', ...)` と `window.addEventListener('keydown', ...)` のブロックを削除します。
- 代わりに、ファイルの先頭で `import { setupKeyboardShortcuts } from './ui/shortcuts.js';` を追加し、削除した場所で `setupKeyboardShortcuts();` を呼び出します。
- 使われなくなったインポート（例: `switchTabByOffset`, `triggerManualSave` など、`main.js` で他に使われていなければ）を整理します。

## 検証計画

### 手動検証
本修正適用後、以下の動作確認を実施します。
1. アプリケーションを起動し、エラーが発生しないこと。
2. 以下のショートカットが従来通り機能すること。
   - Ctrl + マウスホイール上/下でフォントサイズが拡大/縮小されること。
   - Ctrl + Shift + マウスホイール上/下で行間が拡大/縮小されること。
   - Ctrl + `+` / `-` キーでフォントサイズが拡大/縮小されること。
   - Ctrl + Shift + `+` / `-` キーで行間が拡大/縮小されること。
   - Ctrl + S で手動保存が実行されること。
   - Ctrl + Tab / Ctrl + Shift + Tab でタブが切り替わること。
   - F5 や Ctrl + R による意図しないリロードが防がれていること。
