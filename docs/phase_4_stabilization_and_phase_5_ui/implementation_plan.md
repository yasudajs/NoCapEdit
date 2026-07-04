# Phase 4 の安定化および Phase 5 の実装計画

本計画では、すでに初期実装されている Phase 4（自動保存・終了時フロー）の堅牢性を高めるための修正と、Phase 5（保存失敗時の通知UIやデザイン調整）の実装を行います。

## User Review Required

> [!IMPORTANT]
> **保存の排他制御の追加**
> 非同期での自動保存処理中にタブを切り替えたり、アプリを終了しようとしたりすると、同一ファイルへの書き込み（`save_text_file`）が重複して走り、ファイルロックの競合や保存失敗エラーが発生する可能性があります。
> これを防ぐため、タブごとに保存処理中を示す `isSaving` フラグを導入し、保存処理が完了するまで次の保存が走らないようにロック制御を行います。

> [!TIP]
> **トースト通知の自前実装**
> 既存の計画書では外部ライブラリ（iziToast）の導入が検討されていましたが、プレーンな JavaScript / CSS 構成のシンプルさを維持するため、自前で軽量なトースト通知コンポーネント（CSSアニメーション付き）を実装することを提案します。これにより、外部依存を増やさずに済みます。

## Proposed Changes

### フロントエンド (HTML / CSS / JavaScript)

---

#### [MODIFY] [main.js](file:///c:/work/NoCapEdit/src/dist/main.js)
- タブオブジェクト初期化時に `isSaving: false` を追加。
- `saveTabIfDirty` および `persistTabWithRecovery` 内で `isSaving` を使用した排他制御ロックを実装。
- 保存処理完了時・失敗時にトースト通知を呼び出す `showToast(message, type)` 関数を実装。
- エラーハンドリング時、ダイアログ表示の整合性を担保するようリファクタ。

#### [MODIFY] [index.html](file:///c:/work/NoCapEdit/src/dist/index.html)
- トースト通知を表示するためのコンテナ要素を追加。
  ```html
  <div id="toastContainer" class="toast-container"></div>
  ```

#### [MODIFY] [style.css](file:///c:/work/NoCapEdit/src/dist/style.css)
- トースト表示およびアニメーション用スタイルを追加。
- ステータスバーやタブ部分の軽微なUI調整。

## Verification Plan

### Manual Verification
1. **自動保存の検証**:
   - 文字を入力し、3秒後にステータスバーが「保存済み」になり、トーストが表示されることを確認。
2. **保存の排他制御テスト**:
   - 文字を連続で入力しながら高速にタブを切り替えた際、エラーやデッドロックが起きず安全に保存されることを確認。
3. **トースト通知テスト**:
   - 保存時やエラー発生時に、トーストがスライドインし数秒後にフェードアウトすることを確認。
4. **終了時フローの確認**:
   - 未保存タブがある状態でアプリを閉じたとき、正常に保存またはリカバリーダイアログが表示されることを確認。
