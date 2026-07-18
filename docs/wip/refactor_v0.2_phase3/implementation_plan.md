# フェーズ3: ショートカットレジストリの作成

v0.2リファクタリングマスタープランに基づくフェーズ3として、ショートカットキーを一元管理するレジストリを導入します。

## 提案する変更

### src/dist/js/shortcuts.js

#### [NEW] src/dist/js/shortcuts.js
- `shortcuts` 配列によるショートカットの登録管理
- `registerShortcut(combo, handler, options)` 関数のエクスポート
- 入力イベントからキーコンボ文字列を組み立てる処理の実装
- `window.addEventListener('keydown')` のグローバルハンドラの登録と、登録済みショートカットのディスパッチ処理

### src/dist/js/main.js

#### [MODIFY] src/dist/js/main.js
- 既存の `window.addEventListener('keydown')` のグローバルハンドラ（L180-249付近）を削除
- 代わりに、`shortcuts.js` の `registerShortcut` を使用して、以下のショートカットを登録します：
  - F5, Ctrl+R, Ctrl+P の無効化
  - Ctrl+Tab, Ctrl+Shift+Tab (タブ切り替え)
  - Ctrl+Shift+ +, Ctrl+Shift+ -, Ctrl+Shift+ ; 等 (行高さ変更)
  - Ctrl+ +, Ctrl+ -, Ctrl+ = 等 (ズーム変更)
  - Ctrl+S (保存)
  - Ctrl+E (サイドバーフォーカス)
  - Ctrl+N, Ctrl+D (アイテム作成)

> [!NOTE]
> サイドバーに関連するショートカット（Ctrl+E, Ctrl+N, Ctrl+D）は、フェーズ4において `sidebar-integration.js` へ移動する予定です。
> 今回のフェーズ3では `main.js` からグローバルハンドラを削除するため、一時的に `main.js` 内で `registerShortcut` を用いて登録しておきます。

## 検証計画

### 手動テスト
- `Ctrl+S` で保存が機能するか。
- `Ctrl+Tab`, `Ctrl+Shift+Tab` でタブの切り替えができるか。
- `Ctrl++`, `Ctrl+-` 等でズームの拡大・縮小ができるか。
- `Ctrl+Shift++`, `Ctrl+Shift+-` で行間隔の調整ができるか。
- `F5`, `Ctrl+R`, `Ctrl+P` が無効化されており、ブラウザ本来の挙動（リロードや印刷ダイアログ）が発生しないか。
- `Ctrl+E`, `Ctrl+N`, `Ctrl+D` が現状通りサイドバーの操作として機能するか。
