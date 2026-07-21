# タイムスタンプ生成ロジックの共通化 (フェーズ1-1)

本実装計画書は、マスタープランのフェーズ1-1に基づき、フロントエンドにおけるタイムスタンプ生成処理の共通化を行うための手順を定義します。

## 背景と目的
現在 `src/dist/js/core/fileSystem.js` 内で初回保存時と手動保存時の2箇所において、現在時刻から `yyyyMMdd_HHmmss` 形式の文字列を生成するロジックが重複しています。
この処理を汎用ユーティリティ関数として `src/dist/js/utils/helpers.js` へ抽出し、コードのDRY（Don't Repeat Yourself）原則を遵守するとともに、将来の再利用性と可読性を向上させます。

## Proposed Changes

### フロントエンドユーティリティ

#### [MODIFY] [helpers.js](file:///c:/work/NoCapEdit/src/dist/js/utils/helpers.js)
- `generateTimestamp()` 関数を新規追加し、`yyyyMMdd_HHmmss` フォーマットの文字列を返すように実装します。

### ファイルシステム制御

#### [MODIFY] [fileSystem.js](file:///c:/work/NoCapEdit/src/dist/js/core/fileSystem.js)
- 106行目付近 (`saveTabContent`) のタイムスタンプ生成処理を削除し、`helpers.js` の `generateTimestamp()` の呼び出しに置き換えます。
- 275行目付近 (`triggerManualSave`) のタイムスタンプ生成処理を削除し、同様に置き換えます。

## Verification Plan

### Manual Verification
1. アプリケーションを起動し、新規タブでテキストを入力する。
2. 初回保存（Ctrl+S またはメニューから保存）を実行し、作成されたファイル名が現在のタイムスタンプ (`yyyyMMdd_HHmmss.nctx`) になっているか確認する。
3. エディタの設定等から手動保存（別名で保存）を実行し、同様に正しいタイムスタンプでファイルが保存されるか確認する。
