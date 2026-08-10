# [リファクタリング] ステップ 3.3：テーマおよびフォント適用ロジックの抽出

本計画は、「リファクタリングマスタープラン」のフェーズ3のステップ3.3「テーマおよびフォント適用ロジックの抽出」を実施するための実装計画です。

ステップ3.2で設定保存の基盤 (`settingsManager.js`) が整ったため、本ステップでは `ui/settings.js` に残っているテーマとフォントの適用ロジックを `ui/theme.js` に分離し、`settings.js` を純粋なダイアログ制御とイベントハンドリングに特化させます。

## ユーザー承認必須事項

> [!IMPORTANT]
> 循環参照を完全に防止するため、DOMイベントのハンドラである `onThemeChange` と `onFontFamilyChange` は「設定ダイアログでのユーザー操作イベント」として `settings.js` に残し、そこから `theme.js` の純粋な適用ロジックを呼び出す設計とします。
> 
> 本計画の内容に問題がないかご確認いただき、承認の指示（「作業開始」等）をお願いいたします。

## 提案する変更内容

### テーマおよびフォント適用ロジックの分離

#### [NEW] [`src/dist/js/ui/theme.js`](file:///c:/work/NoCapEdit/src/dist/js/ui/theme.js)
新規ファイルを作成し、以下の純粋な適用・読み込みロジックを移動します。
- `applyThemeUI(theme)` : bodyタグへのクラス付与とセレクトボックスへの値反映
- `applyFontFamily()` : CSSカスタムプロパティ(`--editor-font-family`)の更新
- `loadSystemFonts()` : バックエンドからのシステムフォント一覧取得とDOMの構築
※ 依存モジュール (`appState`, `elements`, `DEFAULT_MONOSPACE_FONTS`, `invoke`, `updateStatus`, `ensureTauriApi` など) をインポートします。

#### [MODIFY] [`src/dist/js/ui/settings.js`](file:///c:/work/NoCapEdit/src/dist/js/ui/settings.js)
- `applyThemeUI`, `applyFontFamily`, `loadSystemFonts` の実装を削除し、`./theme.js` からインポートするように変更します。
- イベントハンドラである `onThemeChange` と `onFontFamilyChange` は引き続き `settings.js` に残し、インポートした適用ロジックを呼び出すようにします。

#### [MODIFY] [`src/dist/js/main.js`](file:///c:/work/NoCapEdit/src/dist/js/main.js)
- 初期化時などに使用されている `applyThemeUI` や `loadSystemFonts` のインポート元を `./ui/settings.js` から `./ui/theme.js` に変更します。

## 検証計画

### 手動検証
本修正適用後、以下の動作確認を実施します。
1. アプリケーションをビルド・起動し、起動時に前回保存されたテーマおよびフォントが正常に適用されること。
2. 設定ダイアログを開き、「テーマ」を切り替えた際に、画面のテーマが即座に反映され、エラーが発生しないこと。
3. 「フォント」の設定において、システムフォントのリストが正常にロードされること。
4. 選択したフォントがエディタ画面に即座に反映されること。
