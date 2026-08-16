# 実装計画書: Step 5 help.html カテゴリ見出しのセマンティクス改善 (v0.1.93)

## 概要
`docs/wip/review_v0.1.87_to_v0.1.92.md` で指摘された 🔵参考 #7（`help.html` 内のショートカットカテゴリ見出しが汎用 `<div>` 要素となっている）に対応し、文書構造に適した `<h2>` 要素に変更してHTMLのセマンティクスおよびアクセシビリティ（スクリーンリーダーの目次・ランドマーク認識等）を向上させます。

---

## 修正内容

### [MODIFY] [help.html](file:///c:/work/NoCapEdit/src/dist/help.html)

#### 1. 見出し要素の変更（5箇所）
以下の5箇所の `<div class="category">` を `<h2 class="category">` に変更します。
1. L57: `テキスト編集`
2. L87: `ファイル・タブ操作`
3. L108: `表示・ズーム`
4. L126: `設定画面の操作`
5. L147: `その他`

```diff
-    <div class="category" data-i18n="help.categories.edit">テキスト編集</div>
+    <h2 class="category" data-i18n="help.categories.edit">テキスト編集</h2>
```

#### 2. `<style>` 内の `.category` スタイル調整
`h2` のブラウザデフォルトスタイル（左右マージン等）の影響を防ぎ、既存の見た目を完全に維持するため、スタイルを明示します。

```diff
         .category {
             font-weight: bold;
-            margin-top: 28px;
-            margin-bottom: 14px;
+            margin: 28px 0 14px 0;
             color: var(--accent, #4daafc);
             font-size: 16px;
         }
```

---

## バージョンについて
- 本リファクタリング（Step 1〜10）は同一バージョン（`0.1.93`）および同一作業ブランチ内で実施するため、バージョン番号の変更はありません。

---

## 検証計画
1. `cargo test` を実行してテストが正常通過することを確認
2. `npm run tauri dev` でアプリを起動し、`F1` キーでヘルプ画面を開く
3. 5つのカテゴリ見出し（テキスト編集、ファイル・タブ操作、表示・ズーム、設定画面の操作、その他）の外観（フォントサイズ、余白、文字色）が変更前と全く同一であることを確認
4. 3テーマ（Dark / Soft Dark / Light）すべてで表示を確認
