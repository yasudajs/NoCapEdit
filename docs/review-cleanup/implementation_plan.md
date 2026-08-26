# レビュー指摘事項のクリーンアップ実装計画

## 概要

v0.2.0〜v0.2.11 の CodeMirror (v6) 移行作業のレビューで発見された5つの改善候補を、個別に1ステップずつ対応する。
いずれも軽微な修正であり、機能的な変更は伴わない（リファクタリング・ドキュメント修正のみ）。

バージョンは **v0.2.12**（5ステップ統合）として扱う。

---

## Step 1: `spec.md` の将来候補リスト更新

### 背景
[spec.md §5.1](file:///c:/work/NoCapEdit/docs/spec.md#L284-L291) の「将来の拡張候補」に「検索・置換機能」が残っているが、v0.2.6 および v0.2.10 で検索・置換機能は完全に実装済み。

### 変更内容

#### [MODIFY] [spec.md](file:///c:/work/NoCapEdit/docs/spec.md)
- §5.1「将来の拡張候補」リスト（L289）から「検索・置換機能」の行を削除する

### 変更前
```markdown
### 5.1 将来の拡張候補
- 既存ファイルを開く機能
- 最近使ったファイル一覧（履歴）
- タブ一覧ポップアップ
- 検索・置換機能          ← 削除対象
- Markdown向け表示の拡張
- CLI版との連携
```

### 変更後
```markdown
### 5.1 将来の拡張候補
- 既存ファイルを開く機能
- 最近使ったファイル一覧（履歴）
- タブ一覧ポップアップ
- Markdown向け表示の拡張
- CLI版との連携
```

---

## Step 2: `searchKeymap` の未使用 import 削除

### 背景
[codemirror.js L11](file:///c:/work/NoCapEdit/src/frontend/js/ui/codemirror.js#L11) で `searchKeymap` を `@codemirror/search` から import しているが、`getDefaultExtensions()` 内の `keymap.of([...])` には含まれておらず、他のどの箇所でも使用されていない。
`search({ top: true })` 拡張が自動的にキーマップを登録するため、機能的に問題は発生していないが、未使用 import として整理する。

### 変更内容

#### [MODIFY] [codemirror.js](file:///c:/work/NoCapEdit/src/frontend/js/ui/codemirror.js)
- L11 の import 文から `searchKeymap` を削除する

### 変更前
```javascript
import { search, searchKeymap, highlightSelectionMatches, openSearchPanel, closeSearchPanel } from '@codemirror/search';
```

### 変更後
```javascript
import { search, highlightSelectionMatches, openSearchPanel, closeSearchPanel } from '@codemirror/search';
```

> [!NOTE]
> Step 3 で `openSearchPanel` / `closeSearchPanel` も削除候補となるが、確認結果次第のため本ステップでは保留する。

---

## Step 3: `openSearch()` / `closeSearch()` のデッドコード削除

### 背景
[codemirror.js L298-L311](file:///c:/work/NoCapEdit/src/frontend/js/ui/codemirror.js#L295-L311) に `openSearch()` / `closeSearch()` 関数が定義されている。これらは v0.2.6 で `@codemirror/search` のデフォルト検索パネルを導入した際に追加された CodeMirror 公式パネルの開閉ラッパーだが、v0.2.10 でカスタム検索UI（`findReplace.js`）に完全移行した結果、どこからも呼び出されていない。

`grep` での調査結果:
- `openSearch` — 定義箇所（codemirror.js L298）のみ、呼び出し元なし
- `closeSearch` — 定義箇所（codemirror.js L307）のみ、呼び出し元なし

### 変更内容

#### [MODIFY] [codemirror.js](file:///c:/work/NoCapEdit/src/frontend/js/ui/codemirror.js)
1. `openSearch()` 関数（L295-L302）を削除
2. `closeSearch()` 関数（L304-L311）を削除
3. L11 の import 文から `openSearchPanel`, `closeSearchPanel` を削除（Step 2 で `searchKeymap` 削除済みの前提）

### 変更前（import）
```javascript
import { search, highlightSelectionMatches, openSearchPanel, closeSearchPanel } from '@codemirror/search';
```

### 変更後（import）
```javascript
import { search, highlightSelectionMatches } from '@codemirror/search';
```

### 削除対象の関数
```javascript
/**
 * 検索パネルを開く
 */
export function openSearch() {
    if (editorView) {
        openSearchPanel(editorView);
    }
}

/**
 * 検索パネルを閉じる
 */
export function closeSearch() {
    if (editorView) {
        closeSearchPanel(editorView);
    }
}
```

---

## Step 4: `getCursorMetrics` のパフォーマンス最適化

### 背景
[codemirror.js getCursorMetrics()](file:///c:/work/NoCapEdit/src/frontend/js/ui/codemirror.js#L432-L481) が呼び出しのたびに `doc.toString()` でドキュメント全文を文字列化している。この関数はキー入力やカーソル移動のたびに呼ばれるため、大きなドキュメントではパフォーマンスが低下する可能性がある。

CodeMirror 6 の `Text` クラスは `doc.length` で O(1) にドキュメント長を取得可能であり、`doc.sliceString()` で必要な部分のみ取得できる。

### 変更内容

#### [MODIFY] [codemirror.js](file:///c:/work/NoCapEdit/src/frontend/js/ui/codemirror.js)
- `getCursorMetrics()` を最適化し、`doc.toString()` の呼び出しを排除する

### 変更前（該当部分）
```javascript
const fullText = doc.toString();
const docLength = doc.length;
const isSelected = !mainSel.empty;

let totalChars = fullText.length;
let selectedChars = 0;

if (charCountMode === 'no_newline') {
    const newlineCount = (fullText.match(/[\r\n]/g) || []).length;
    totalChars = fullText.length - newlineCount;

    if (isSelected) {
        const selectedText = fullText.substring(mainSel.from, mainSel.to);
        const selNewlines = (selectedText.match(/[\r\n]/g) || []).length;
        selectedChars = selectedText.length - selNewlines;
    }
} else {
    if (isSelected) {
        selectedChars = mainSel.to - mainSel.from;
    }
}
```

### 変更後（最適化版）
```javascript
const docLength = doc.length;
const isSelected = !mainSel.empty;

let totalChars = docLength;
let selectedChars = 0;

if (charCountMode === 'no_newline') {
    // doc.iterLines() でドキュメント全文を文字列化せず改行数を算出
    let lineCount = 0;
    const iter = doc.iter();
    while (!iter.done) {
        // iter.next() が返す各チャンクの改行文字をカウント
        const chunk = iter.next().value;
        if (chunk === undefined) break;
        const matches = chunk.match(/[\r\n]/g);
        if (matches) lineCount += matches.length;
    }
    totalChars = docLength - lineCount;

    if (isSelected) {
        const selectedText = doc.sliceString(mainSel.from, mainSel.to);
        const selNewlines = (selectedText.match(/[\r\n]/g) || []).length;
        selectedChars = selectedText.length - selNewlines;
    }
} else {
    if (isSelected) {
        selectedChars = mainSel.to - mainSel.from;
    }
}
```

> [!IMPORTANT]
> `with_newline` モード（デフォルト）では `doc.length` のみで O(1) 完結するため、最も頻繁に使用されるケースで大きな改善が得られる。
> `no_newline` モード時は改行カウントのためにイテレーションが必要だが、`doc.toString()` による巨大な一時文字列の生成を回避できる。

---

## Step 5: `tauri-plugin-single-instance` の Git 依存に関するドキュメント注記

### 背景
[Cargo.toml L17](file:///c:/work/NoCapEdit/Cargo.toml#L17) で `tauri-plugin-single-instance` が Git URL 参照（`branch = "v1"`）となっている。Tauri v1 系では crates.io に公式リリースがないため現時点ではこの指定が唯一の手段であり、**コード修正は不要**。
ただし、将来的な Tauri v2 移行時にレジストリ版への切り替えが必要であることをドキュメントに明記しておく。

### 変更内容

#### [MODIFY] [ARCHITECTURE.md](file:///c:/work/NoCapEdit/docs/ARCHITECTURE.md)
- §2.1 バックエンド解説の `main.rs` 説明に、`tauri-plugin-single-instance` が Git ブランチ参照であること、および Tauri v2 移行時の切り替え推奨を注記として追記する

### 追記内容（案）
```markdown
> [!NOTE]
> `tauri-plugin-single-instance` は Tauri v1 向けの crates.io パッケージが存在しないため、Git リポジトリの `v1` ブランチから直接参照しています（`Cargo.toml` 参照）。将来的に Tauri v2 へ移行する際は、crates.io に公開されている v2 向けのレジストリ版（`tauri-plugin-single-instance = "2"`）に切り替えてください。
```

---

## 検証計画

各ステップの修正後に以下を実行して動作に影響がないことを確認する。

### ビルド検証
```bash
npm run build          # Vite フロントエンドビルド
cargo check            # Rust コンパイルチェック
cargo build            # デバッグビルド
```

### 機能検証（Step 4 のみ）
- ステータスバーのカーソル位置（Ln, Col）・文字数表示が正しく動作すること
- 範囲選択時に選択文字数が正しく表示されること
- 文字数カウント設定（改行含む/改行除く）の切り替えが正しく動作すること

---

## バージョン情報
- **対象バージョン**: v0.2.12
- **変更種別**: リファクタリング・ドキュメント修正（機能変更なし）
- **ブランチ**: `v0.2` から作業ブランチを作成
