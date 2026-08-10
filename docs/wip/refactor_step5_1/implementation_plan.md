# [リファクタリング] ステップ 5.1：ダイアログUIの分離

本計画は、「リファクタリングマスタープラン」のフェーズ5のステップ5.1「ダイアログUIの分離」を実施するための実装計画です。

現在、ファイル保存等のコアロジックを担う `src/dist/js/core/fileSystem.js` 内に、エラーダイアログのDOMを直接操作する関数 (`showSaveErrorDialog`) が存在しています。
この状態は、コアロジック層（Core）がUI層（DOM）の構造（`elements.errorDialog`等）に密結合していることを意味します。これを解消するため、専用のダイアログ制御モジュールを新設し、関心の分離を図ります。

## ユーザー承認必須事項

> [!IMPORTANT]
> - 本ステップでは、既存のエラーダイアログの挙動（メッセージの表示、Retry/Save As/Cancelの選択）は変更せず、コードの配置場所のみを移動します。
> 
> 本計画の内容に問題がないかご確認いただき、承認の指示（「作業開始」等）をお願いいたします。

## 提案する変更内容

### ダイアログ制御モジュールの新設

#### [NEW] [`src/dist/js/ui/dialogs.js`](file:///c:/work/NoCapEdit/src/dist/js/ui/dialogs.js)
新規ファイルを作成し、以下の関数を定義します。
- `showSaveErrorDialog(message)`
  - `fileSystem.js` からこの関数を移動します。
  - 依存する `elements` (`state.js`) をインポートし、DOMの操作（クラスの着脱、テキストの設定、イベントリスナーの登録・解除）を行います。

### 依存関係の修正

#### [MODIFY] [`src/dist/js/core/fileSystem.js`](file:///c:/work/NoCapEdit/src/dist/js/core/fileSystem.js)
- `showSaveErrorDialog` の実装を削除します。
- ファイルの先頭で `import { showSaveErrorDialog } from '../ui/dialogs.js';` を追加し、保存エラー発生時にはこのモジュールを呼び出す形に変更します。

## 検証計画

### 自動検証
- Rustビルド（`cargo check`）が正常に完了すること。

### 手動検証
本修正適用後、以下の動作確認を実施します。
1. ファイル保存時に意図的なエラーを発生させるか、正常動作下でもダイアログ関連の呼び出しパスが壊れていないかを確認します。（ユーザー側で動作確認をお願いします）
