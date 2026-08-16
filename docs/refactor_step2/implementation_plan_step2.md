# 実装計画書: Step 2 未使用i18nキーの削除 (v0.1.93)

## 概要
`docs/wip/review_v0.1.87_to_v0.1.92.md` で指摘された 🟡改善 #4（i18nキーの重複定義）に対応し、参照箇所が0件で完全に未使用となっている `ui.dialog.settings.font.loading` を削除して辞書定義を整理します。

---

## 修正内容

### [MODIFY] [i18n.js](file:///c:/work/NoCapEdit/src/dist/i18n.js)

#### 1. 未使用キーの削除
- **参照中のキー**: `settings.font.loading`（L38） — [`src/dist/js/ui/theme.js`](file:///c:/work/NoCapEdit/src/dist/js/ui/theme.js) L39 で `t('settings.font.loading')` として使用中
- **削除対象キー**: `ui.dialog.settings.font.loading`（L194） — 参照箇所0件（完全に未使用）

```diff
                 font: {
                     label: "フォント:",
                     default: "デフォルト (Monospace)",
-                    loading: "フォント読み込み中..."
                 },
```

---

## バージョンについて
- 本リファクタリング（Step 1〜10）は同一バージョン（`0.1.93`）および同一作業ブランチ内で実施するため、バージョン番号の変更はありません。

---

## 検証計画
1. `cargo test` を実行して既存テストが通過することを確認
2. `npm run tauri dev` でアプリを起動
3. 設定画面を開き、フォント選択セレクトボックスをクリックした際に「フォント読み込み中...」が正常に表示されることを確認
4. 開発者ツールのコンソールに未定義キーや実行時エラーが出ていないことを確認
