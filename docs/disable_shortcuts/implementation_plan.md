# [実装計画書] ショートカット無効化の追加（Ctrl+Shift+R, Ctrl+F5, Ctrl+Shift+F5）

仕様書（`docs/spec.md` セクション 4.12）に定義されているブラウザ標準ショートカットの無効化規定に基づき、現在未登録となっているリロード系ショートカットの無効化処理を追加します。

## 変更内容の概要
現在の `src/dist/js/main.js` では、無効化対象として `['F5', 'Ctrl+R', 'Ctrl+P']` のみが登録されています。
これに `Ctrl+Shift+R` および `Ctrl+F5`（および `Ctrl+Shift+F5`）を追加し、不要なページリロードを防ぎます。

## ユーザー確認事項
- **無効化対象のショートカット**:
  `['F5', 'Ctrl+R', 'Ctrl+Shift+R', 'Ctrl+F5', 'Ctrl+Shift+F5', 'Ctrl+P']`

## 変更対象ファイル

### [FrontEnd / ShortCuts]

#### [MODIFY] [main.js](file:///c:/work/NoCapEdit/src/dist/js/main.js)
- `registerShortcut` の対象キーリストに `'Ctrl+Shift+R'`, `'Ctrl+F5'`, `'Ctrl+Shift+F5'` を追加。

## 手動検証計画

### 手動テスト項目
1. `Ctrl + Shift + R` キーを押下し、ページリロードが発生せず画面が維持されることを確認。
2. `Ctrl + F5` キーを押下し、ページリロードが発生せず画面が維持されることを確認。
3. `Ctrl + Shift + F5` キーを押下し、ページリロードが発生せず画面が維持されることを確認。
4. 既存の `F5`, `Ctrl + R`, `Ctrl + P` が引き続き無効化されていることを確認。
5. 通常のエディタ操作（テキスト入力、タブ切り替え、保存など）に影響がないことを確認。
