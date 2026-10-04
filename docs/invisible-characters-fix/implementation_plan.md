# 不可視文字プラグインの長い行描画例外修正 実装計画書 (v2.11.1)

## 1. 概要
CodeMirror 6（v6.43.9）において、長大な行が存在する場合に、エディタの描画最適化機構（line gap）によって `view.visibleRanges` が同一行にまたがる複数の区間や行途中から始まる区間に分割されます。
現在の `invisibleCharactersPlugin` は `doc.lineAt(pos)` により取得した行全体を先頭から走査して `RangeSetBuilder.add()` を呼び出しているため、同一行が複数区間に現れた際に位置のソート制約（非減少順）に違反し、`Ranges must be added sorted` 例外が発生してプラグインの動作が停止する不具合が発見されました。

本改修では、可視範囲 `[from, to]` に絞って行内を走査するようロジックを修正し、例外の発生を防止するとともに描画パフォーマンスを向上させます。また、同様のループ構造を持つ `indentGuidesPlugin` についても、同一行でのWidget二重登録の防止および画面外行頭の不要なインデント計算スキップ（微最適化）を併せて実施します。

本修正は不具合修正であるため、セマンティックバージョニング規則に基づき **PATCH バージョンアップ（`v2.11.0` → `v2.11.1`）** としてリリースします。

---

## 2. 不具合の原因と修正アプローチ

### 2.1 原因の分析
- **CodeMirror 6 の line gap 機構（非描画領域の発生条件）**:
  CodeMirror は描画負荷軽減のため、画面外のテキスト部分を DOM レンダリングから除外（line gap）します。内部定数（`LG.Margin = 2000`, `LG.MarginWrap = 10000`）に基づき、以下の条件で発生します：
  1. **折り返し OFF**: 約 4,000 文字超の行で横スクロール時に発生。
  2. **折り返し ON**: 約 20,000 文字超の超長大行で縦スクロール時に発生。
  3. **カーソル・選択範囲周辺での分割**: 非描画領域はカーソル位置や選択範囲の端を回避して作成されるため、長大行の途中にカーソルを置いてスクロールした場合にも、同一行内で複数の `visibleRanges` 区間に分割されます。
- **RangeSetBuilder の仕様**:
  装飾を追加する `builder.add(from, to, value)` は、追加する位置 `from` が直前に追加した位置以上（同位置の追加は許可 / 非減少順）でなければ `Ranges must be added sorted` 例外をスローします。
- **現在の問題点**:
  区間1（例: `0..200`）の処理で行全体の末尾（例: 位置5000）まで走査して装飾を追加した後、区間2（例: `1500..1800`）の処理で同じ行の先頭（位置0）から再度走査・追加しようとするため、ソート順制約違反の例外が発生します。CodeMirror は例外が発生した ViewPlugin を停止させるため、不可視文字が一切表示されなくなります。

### 2.2 修正方針
1. **不可視文字の走査範囲限定 (`invisibleCharactersPlugin`)**:
   各 visibleRange `[from, to]` に対し、行全体の先頭・末尾ではなく、その区間と行の積集合 `[start, end]`（`start = Math.max(from, line.from)`, `end = Math.min(to, line.to)`）のみを走査して装飾を追加します。
2. **改行マークの追加条件**:
   改行記号（`↵`）の Widget は、行末が表示範囲に含まれている場合（`line.to <= to && line.number < docLines`）にのみ追加します。
3. **インデントガイドの同一行二重登録防止＆計算スキップ (`indentGuidesPlugin`)**:
   `indentGuidesPlugin` において、`line.from >= from`（行頭が現在の可視範囲に含まれている）判定を、インデント計算（`getLineIndentInfo` や前後最大100行を走査する `resolveBlankLineIndent`）の呼び出し前に配置します。これにより、同一行分割時の Widget 二重追加を防止するとともに、画面外行頭の無駄なインデント計算をスキップしてパフォーマンスを向上させます。

---

## 3. 修正対象ファイル

| ファイル | 修正内容 |
|---|---|
| `src/frontend/js/ui/codemirror.js` | `invisibleCharactersPlugin` の走査ロジックを `[from, to]` 範囲限定に変更。`indentGuidesPlugin` に行頭判定ガード＆計算スキップを追加 |
| `Cargo.toml` | バージョンを `2.11.1` に更新 |
| `package.json` | バージョンを `2.11.1` に更新 |
| `tauri.conf.json` | バージョンを `2.11.1` に更新 |
| `nsis/installer.nsi` | バージョンを `2.11.1.0` に更新 |
| `docs/DEVELOPMENT.md` | ポータブル版ZIP名を `v2.11.1` に更新 |
| `docs/spec.md` | バージョン表記の更新 |
| `docs/history.md` | `Ver 2.11.1` の修正履歴を追記 |

---

## 4. コード変更詳細

### `src/frontend/js/ui/codemirror.js`

#### (1) `invisibleCharactersPlugin.buildDecorations`
```javascript
buildDecorations(view) {
    const builder = new RangeSetBuilder();
    const doc = view.state.doc;
    const docLines = doc.lines;

    for (const { from, to } of view.visibleRanges) {
        let pos = from;
        while (pos <= to) {
            const line = doc.lineAt(pos);
            const start = Math.max(from, line.from);
            const end = Math.min(to, line.to);

            for (let p = start; p < end; p++) {
                const ch = line.text[p - line.from];
                if (ch === ' ') {
                    builder.add(p, p + 1, spaceDeco);
                } else if (ch === '\u3000') {
                    builder.add(p, p + 1, fullwidthDeco);
                } else if (ch === '\t') {
                    builder.add(p, p + 1, tabDeco);
                }
            }

            if (line.to <= to && line.number < docLines) {
                builder.add(line.to, line.to, newlineWidgetDeco);
            }

            pos = line.to + 1;
        }
    }

    return builder.finish();
}
```

#### (2) `indentGuidesPlugin.buildDecorations`
```javascript
for (const { from, to } of view.visibleRanges) {
    let pos = from;
    while (pos <= to) {
        const line = view.state.doc.lineAt(pos);

        // 行頭が表示範囲に含まれている場合のみインデント計算および Widget 追加を実施
        if (line.from >= from) {
            let { level, isBlank } = getLineIndentInfo(line.text, tabSize, indentUnitWidth);

            if (isBlank) {
                level = resolveBlankLineIndent(view.state.doc, line.number, tabSize, indentUnitWidth);
            }

            if (level > 0) {
                const levels = [];
                for (let i = 0; i < level; i++) {
                    levels.push(i * indentUnitWidth);
                }
                builder.add(line.from, line.from, Decoration.widget({
                    widget: new IndentGuideWidget(levels),
                    side: -1,
                }));
            }
        }

        pos = line.to + 1;
    }
}
```

---

## 5. 検証手順

1. **単体テスト**: `cargo test` でバックエンド設定テストが全件パスすることを確認。
2. **ビルド検証**: `npm run build` が正常に成功することを確認。
3. **実機動作確認（長大行・各パターン検証）**:
   - **パターン1: 折り返し OFF（Alt + Z）での長大行検証**:
     - 5,000 文字以上の行（半角スペース、全角スペース、タブを含む）を左右スクロールし、例外なく不可視文字が描画され続けること。
   - **パターン2: 折り返し ON での超長大行検証**:
     - 25,000 文字以上の行を上下スクロールし、描画崩れや例外が発生しないこと。
   - **パターン3: カーソル配置・改行記号の表示検証**:
     - 長大行の末尾にカーソルを配置した状態でスクロールし、行末まで移動した際に改行記号（`↵`）が正しく表示されること。
   - **パターン4: インデントガイド連動検証**:
     - インデントガイド（`Alt + I`）と不可視文字表示（`Alt + W`）を両方 ON にした状態で長大行をスクロールし、例外や表示の重複が発生しないこと。
4. **通常行の表示確認**:
   - 半角スペース、全角スペース、タブ、改行記号が以前と同様に正確に描画されることを確認。
