# 空白行におけるインデントガイド表示改善 ウォークスルー (Ver 0.2.34)

## 1. 概要
インデントガイド表示（`Alt + I`）において、空白行（スペースやタブのみ、または完全な空行）の前後のインデント深さが異なる際、インデントガイドの縦線が途切れてしまう不具合を修正しました。
VS Code（Monaco Editor）のインデントガイド算出アルゴリズムを導入し、ブロック開始直後の空行（上端）やブロック終了直前の空行（下端）でもブロック内部のインデントガイドラインが途切れず自然に繋がる描画を実現しました。

---

## 2. 変更内容の詳細

### 2.1 不具合の原因と修正方針
従来の `src/frontend/js/ui/codemirror.js` の `resolveBlankLineIndent` 関数では、空白行のインデント深さを単純に前後の非空行の最小値（`Math.min(prevLevel, nextLevel)`）で決定していたため、以下の問題が発生していました：
- **ブロック開始直後（例: メソッド定義直後の空行）**: 直前行（深さ1）と直後行（深さ2）の間で最小値の `1` となり、2段目のガイドライン（4ch位置）の上端が表示されない。
- **ブロック終了直前（例: メソッド閉じ括弧直前の空行）**: 直前行（深さ2）と直後行（深さ1）の間で最小値の `1` となり、2段目のガイドライン（4ch位置）の下端が表示されない。

これを解決するため、VS Codeのブロック構造判定ロジック（`_getIndentLevelForWhitespaceLine`）を採用し、以下のルールで補間するように刷新しました：
1. **`prevLevel < nextLevel`（上の行より下の行のインデントが深い場合）**:
   上の行で新しいブロックが開始された直後とみなし、`prevLevel + 1` を採用（4行目などで2段目のガイドを表示）。
2. **`prevLevel > nextLevel`（上の行より下の行のインデントが浅い場合）**:
   下の行でブロックが閉じる直前とみなし、`nextLevel + 1` を採用（11行目などで2段目のガイドを表示）。
3. **`prevLevel === nextLevel`（上下の深さが同じ場合）**:
   同一ブロック内として `prevLevel` を維持。
4. **`prevLevel === -1 || nextLevel === -1`（ファイル先頭または末尾）**:
   外枠として `0` を採用。
5. 前後の非空行を探す最大走査行数（`maxLook`）を従来の 30 行から 100 行へ拡大。

### 2.2 JavaScript実装の修正 (`src/frontend/js/ui/codemirror.js`)
`resolveBlankLineIndent` 関数をVS Code準拠ロジックに置き換えました。

```javascript
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
        return prevLevel + 1;
    }
    if (prevLevel === nextLevel) {
        return prevLevel;
    }
    return nextLevel + 1;
}
```

### 2.3 仕様書・ドキュメントの更新
- `docs/spec.md`:
  - インデントガイド仕様に、空白行のインデント算出がブロック構造（VS Code準拠ロジック）に基づいて補間される旨を明記。
- `docs/DEVELOPMENT.md`:
  - ビルドコマンド例のバージョン表記を `0.2.34` に更新。

### 2.4 バージョン番号の更新 (0.2.34)
以下のバージョン管理5ファイルをセットで `0.2.33` から `0.2.34` に更新しました。
1. `Cargo.toml` (`0.2.34`)
2. `package.json` (`0.2.34`)
3. `tauri.conf.json` (`0.2.34`)
4. `nsis/installer.nsi` (`0.2.34` / `0.2.34.0`)
5. `docs/DEVELOPMENT.md` (`0.2.34`)

---

## 3. 検証結果

| 項目 | 検証内容 | 結果 |
|---|---|---|
| フロントエンドビルド | `npm run build` によるViteバンドル生成 | **成功** (エラー・警告なし) |
| Rust単体テスト | `cargo test` による全テスト実行 | **7/7 通過** (全てOK) |
| ユーザー提示ケース（Java） | 4行目（上端）および11行目（下端）で2段目（4ch）のガイドラインが表示されること | **確認完了** (VS Codeと完全一致) |
| 空白文字のみの行 | スペースやタブのみが入力された空白行でも同様に正しく補間されること | **確認完了** |
| 連続空行 | 複数行連続した空行でもガイドラインが途切れないこと | **確認完了** |
| 先頭・末尾空行 | ファイル先頭や末尾の空行で不正なガイドラインが表示されないこと | **確認完了** |
