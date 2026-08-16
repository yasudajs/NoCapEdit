# 設定画面のキーボード操作に関するヘルプ拡充および操作ヒント表示 実装計画書

## 概要
NoCapEdit では設定画面（`Ctrl + ,`）においてキーボードのみ（Tab、↑↓、Space、Escなど）で全項目の移動・変更・ダイアログ操作が完結する設計になっていますが、現状のヘルプ画面にはその操作方法が案内されておらず、キーボード操作の利便性が十分に伝わっていません。

本改修では以下の2点を実施し、キーボード操作のアクセシビリティおよび認知性を向上させます。
1. **ヘルプ画面（`help.html`）の拡充**: 「設定画面の操作」カテゴリを新設し、一連のキー操作一覧を掲載。あわせてヘルプ画面を開く `F1` キーも追加。
2. **設定画面（`index.html`）への常時固定操作ヒント追加**: 設定ドックの最下部にスクロールに影響されない操作ヒントフッターを設置。

---

## ユーザー確認事項
- ヘルプ画面の一覧構成および設定画面フッターの文言・スタイルについて、提案通りの方針で進めます。
- バージョン番号は `0.1.87` から `0.1.88` へ更新予定です。

---

## 変更対象ファイルと詳細

### 1. `src/dist/i18n.js` (多言語辞書)
- ヘルプ画面用および設定ダイアログ用に追加するテキストを定義します。
  - `help.categories.settings`: `"設定画面の操作"`
  - `help.shortcuts.openHelp`: `"ヘルプ画面を開く"`
  - `help.shortcuts.settingsToggle`: `"設定画面の開閉"`
  - `help.shortcuts.settingsFocusNext`: `"設定項目の移動 (次へ)"`
  - `help.shortcuts.settingsFocusPrev`: `"設定項目の移動 (前へ)"`
  - `help.shortcuts.settingsSelect`: `"設定値の選択・変更"`
  - `help.shortcuts.settingsBrowse`: `"フォルダ選択ダイアログを開く"`
  - `help.shortcuts.settingsClose`: `"設定を閉じてエディタに戻る"`
  - `ui.dialog.settings.footerHint`: `"💡 Tab: 項目移動 │ ↑↓: 選択 │ Space: 実行 │ Esc: 閉じる"`

### 2. `src/dist/help.html` (ヘルプ・ショートカット一覧)
- 「設定画面の操作」カテゴリを新設し、キーボード操作一覧を追加。
- 「その他」カテゴリに `F1`（ヘルプ画面を開く）を追加。
- グリッドのキーバッジ表示（`.shortcut-key`）を活用して統一感のあるレイアウトにします。

### 3. `src/dist/index.html` (メイン画面・設定ドック)
- `#settingsDialog .dialog-box` 内の `.dialog-content`（スクロールエリア）直下に、固定フッター要素 `<div class="settings-footer" data-i18n="ui.dialog.settings.footerHint"></div>` を追加。

### 4. `src/dist/style.css` (スタイル定義)
- `.settings-footer` のスタイルを追加:
  - 上部ボーダー（`border-top: 1px solid var(--border)`）
  - 控えめな文字色（`color: var(--text-secondary)`）
  - 小型フォント（`font-size: 11px`）
  - Flexboxでの中央揃え、固定高さ／縮小防止（`flex-shrink: 0`）

---

## 実装手順（承認後のフェーズ2）

1. 作業ブランチ `feature/settings-keyboard-help` を `master` から作成
2. `docs/wip/settings_keyboard_help/` のドキュメントを `docs/settings_keyboard_help/` へ移動しコミット
3. バージョン管理4ファイル（`Cargo.toml`, `tauri.conf.json`, `nsis/installer.nsi`, `docs/DEVELOPMENT.md`）のバージョンを `0.1.88` に更新
4. `spec.md` の更新
5. ソースコードの改修（`i18n.js`, `help.html`, `index.html`, `style.css`）
6. ビルド・動作検証（ヘルプ画面の表示、設定ドックのフッター固定表示、スクロール時の見え方確認）
7. `walkthrough.md` の作成および `docs/history.md` への更新履歴追記
8. コミット＆プッシュおよびユーザー確認

---

## 検証計画
- `npm run tauri dev` またはブラウザ/Tauri環境でアプリを起動。
- `F1` キーでヘルプ画面が起動し、新設された「設定画面の操作」カテゴリおよび各ショートカットが正常に多言語適用されて表示されているか確認。
- `Ctrl + ,` で設定ドックを開き、最下部に操作ヒントが常時固定で表示されていることを確認。
- 設定項目をスクロールしてもフッターが固定されたままであることを確認。
- 実際にキーボード操作（Tab / Shift+Tab / ↑↓ / Space / Esc）が案内通りスムーズに行えることを確認。
