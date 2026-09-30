# 空白行におけるインデントガイド表示不具合の修正 実装計画書

## 1. 概要
インデントガイド表示（`Alt + I`）において、空白行（スペースやタブのみ、または完全な空行）の前後のインデント深さが異なる際、インデントガイドの縦線が途切れてしまう不具合を修正する。
VS Code（Monaco Editor）のインデントガイド算出ロジックを採用し、ブロック開始直後の空行（上端）やブロック終了直前の空行（下端）でもブロック内部のインデントガイドラインを正しく継続して描画できるようにする。

---

## 2. 不具合の原因と修正方針

### 2.1 原因の分析
現在、[`src/frontend/js/ui/codemirror.js`](file:///d:/antigravity/NoCapEdit/src/frontend/js/ui/codemirror.js) の `resolveBlankLineIndent` 関数では、空白行のインデント深さを以下のように決定しています：

```javascript
// 現状のコード（src/frontend/js/ui/codemirror.js）
if (prevLevel > 0 && nextLevel > 0) {
    return Math.min(prevLevel, nextLevel);
}
return Math.max(prevLevel, nextLevel);
```

このため、前後の非空行のインデント深さが異なる場合、常に小さい方のインデント深さ（`Math.min`）が採用されていました。
- **ブロック開始直後（例: メソッド定義直後の空行）**: 直前の行（深さ1）と直後の行（深さ2）の間で `Math.min(1, 2) = 1` となり、2段目のガイド（4ch位置）が表示されず上端が欠落する。
- **ブロック終了直前（例: メソッド閉じ括弧直前の空行）**: 直前の行（深さ2）と直後の行（深さ1）の間で `Math.min(2, 1) = 1` となり、2段目のガイド（4ch位置）が表示されず下端が欠落する。

### 2.2 VS Codeの算出ロジックと修正方針
VS Code（Monaco Editor）の `GuidesTextModelPart._getIndentLevelForWhitespaceLine` では、空白行のインデント深さをブロック構造に基づき以下のように判定しています：

```typescript
// VS Code (microsoft/vscode) のロジック参照
if (aboveContentLineIndent === -1 || belowContentLineIndent === -1) {
    return 0; // ファイル先頭または末尾
} else if (aboveContentLineIndent < belowContentLineIndent) {
    // 上の行で新しいブロックが開始された直後の領域
    return 1 + Math.floor(aboveContentLineIndent / indentSize);
} else if (aboveContentLineIndent === belowContentLineIndent) {
    // 同一ブロック内
    return Math.ceil(belowContentLineIndent / indentSize);
} else {
    // 下の行でブロックが終了する直前の領域
    return 1 + Math.floor(belowContentLineIndent / indentSize);
}
```

これを NoCapEdit のインデントガイドロジックに適用します：
1. **`prevLevel < nextLevel`（上の行より下の行のインデントが深い場合）**:
   上の行で新しいブロック（スコープ）が開始された直後の空白行とみなし、直前行の深さ + 1（`prevLevel + 1`）を採用。
   → メソッド開始直後の空行で 2段目のガイド（4ch位置）が表示される。
2. **`prevLevel > nextLevel`（上の行より下の行のインデントが浅い場合）**:
   下の行でブロックが閉じる直前の空白行とみなし、直後行の深さ + 1（`nextLevel + 1`）を採用。
   → メソッド終了直前の空行で 2段目のガイド（4ch位置）が表示される。
3. **`prevLevel === nextLevel`（上下の深さが同じ場合）**:
   同一ブロック内の空白行として、そのまま `prevLevel` を採用。
4. **`prevLevel === -1 || nextLevel === -1`（ファイル先頭または末尾）**:
   0 を採用。

また、前後の非空行を探す探索範囲（`maxLook`）を現在の30行から100行に拡大し、長めの空行でも安定してガイドが表示されるようにします。

---

## 3. 変更箇所の詳細

### 3.1 JavaScript実装の修正 ([`src/frontend/js/ui/codemirror.js`](file:///d:/antigravity/NoCapEdit/src/frontend/js/ui/codemirror.js))

`resolveBlankLineIndent` 関数を以下のように置き換えます：

```javascript
/**
 * 空行のインデント深さを前後の非空行から補間（VS Code準拠ロジック）
 * @param {import('@codemirror/state').Text} doc
 * @param {number} lineNumber
 * @param {number} tabSize
 * @param {number} indentUnitWidth
 * @returns {number}
 */
function resolveBlankLineIndent(doc, lineNumber, tabSize, indentUnitWidth) {
    let prevLevel = -1;
    let nextLevel = -1;
    const maxLook = 100;

    for (let i = lineNumber - 1; i >= Math.max(1, lineNumber - maxLook); i--) {
        const l = doc.line(i);
        const info = getLineIndentInfo(l.text, tabSize, indentUnitWidth);
        if (!info.isBlank) {
            prevLevel = info.level;
            break;
        }
    }

    for (let i = lineNumber + 1; i <= Math.min(doc.lines, lineNumber + maxLook); i++) {
        const l = doc.line(i);
        const info = getLineIndentInfo(l.text, tabSize, indentUnitWidth);
        if (!info.isBlank) {
            nextLevel = info.level;
            break;
        }
    }

    if (prevLevel === -1 || nextLevel === -1) {
        return 0;
    }
    if (prevLevel < nextLevel) {
        // 直前行で新しいブロックが開始された直後
        return prevLevel + 1;
    }
    if (prevLevel === nextLevel) {
        // 同一ブロック内
        return prevLevel;
    }
    // prevLevel > nextLevel: 直後行でブロックが終了する直前
    return nextLevel + 1;
}
```

### 3.2 ドキュメント仕様の更新 ([`docs/spec.md`](file:///d:/antigravity/NoCapEdit/docs/spec.md))
- 「インデントガイド」仕様セクションにおいて、空白行のインデント算出がブロック構造（VS Code準拠）に補間される仕様を反映。

### 3.3 バージョン番号の更新
次の内部バージョン `0.2.34` へ更新（5ファイルセット）：
1. `Cargo.toml`
2. `package.json`
3. `tauri.conf.json`
4. `nsis/installer.nsi`
5. `docs/DEVELOPMENT.md`

---

## 4. 検証項目

1. **ユーザー提示ケース（Javaコード）の表示検証**:
   - 添付画像と同様のコードを入力し、4行目（`main` 直後）および11行目（`main` 閉じ括弧直前）で2段目のインデントガイド（4ch位置）が途切れず表示されることを確認。
2. **完全な空行と空白のみの行の検証**:
   - 何も入力されていない空行（文字数0）
   - スペースのみが入力されている空行
   - タブ文字のみが入力されている空行
   いずれの場合でも同一の自然なインデントガイドが表示されることを確認。
3. **連続した空行の検証**:
   - ブロック開始直後やブロック終了直前に2行以上連続して空行がある場合でも、すべての空行でガイドラインが欠落せず継続することを確認。
4. **多重ネストの検証**:
   - クラス > メソッド > for文 > if文 などの多重ネスト構造において、各階層の開始・終了直前の空行でガイドラインが正しく表示されることを確認。
5. **ファイル先頭・末尾の空行の検証**:
   - ファイルの先頭や末尾に空行が存在する場合に、余計なガイドラインが表示されないことを確認。
6. **設定連動の検証**:
   - `Alt + I` による表示/非表示の切り替え。
   - インデント設定（スペース2 / スペース4 / タブ文字幅2, 4, 8）変更時に正しく再計算されること。
