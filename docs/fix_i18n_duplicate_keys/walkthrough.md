# ウォークスルー: 多言語辞書（i18n）重複キー修正

## 作業概要
- **バージョン**: `0.2.27`
- **作業ブランチ**: `feature/fix-i18n-duplicate-keys`
- **目的**: 検索（Ctrl+F）および置換（Ctrl+H）ウィンドウで多言語キー名（`ui.find.placeholder`, `ui.find.replace` 等）が表示されてしまう不具合の解消、および多言語辞書内の重複キーの整理。

---

## 修正内容

### 1. `DICT.ja.ui.find` の重複定義ブロックの削除
- **対象ファイル**: [`src/frontend/i18n.js`](file:///d:/antigravity/NoCapEdit/src/frontend/i18n.js)
- **詳細**:
  `ui` オブジェクトの末尾（旧282〜284行目）に重複して追記されていた `find: { replacedCount: "{count} 件を置換しました" }` を削除しました。
  これにより、182〜194行目の完全な `ui.find` 定義（以下）がオブジェクトプロパティの上書きを受けずに正常に有効化されました。
  - `placeholder`: "検索"
  - `replacePlaceholder`: "置換"
  - `matchCase`: "大文字/小文字を区別 (Alt+C)"
  - `prev`: "前を検索 (Shift+Enter)"
  - `next`: "次を検索 (Enter)"
  - `close`: "閉じる (Esc)"
  - `replace`: "置換"
  - `replaceAll`: "すべて置換"
  - `noMatches`: "一致なし"
  - `matchCount`: "{current} / {total}"
  - `replacedCount`: "{count} 件を置換しました"

### 2. `DICT.ja.help.shortcuts.toggleWordWrap` の冗長行の削除
- **対象ファイル**: [`src/frontend/i18n.js`](file:///d:/antigravity/NoCapEdit/src/frontend/i18n.js)
- **詳細**:
  ショートカット一覧定義 `help.shortcuts` 内で重複していた 170行目の `toggleWordWrap: "行の折り返し切り替え",` を削除し、辞書構造をクリーンに整理しました。

---

## 検証結果

### 1. 辞書キーの重複自動検査
- 全構文トークン解析スクリプトによる検査を実施。
- **結果**: 重複キー **0 件**（すべてのスコープで一意であることを確認）。

### 2. HTML / JS 全体での多言語キー整合性検査
- `src/frontend/index.html` および `src/frontend/help.html` の全 `data-i18n*` 属性（計30箇所以上）
- `src/frontend/js/` 配下の全スクリプトの `t('...')` 呼び出し
- **結果**: 未定義（MISSING）キー **0 件**。すべて正常に解決されることを確認。

### 3. ビルドおよびテストの成功
- `npm run build`: 正常終了（Vite によるフロントエンドアセットバンドル成功）
- `cargo check` / `cargo test`: 正常終了（全単体テスト 5件パス）
