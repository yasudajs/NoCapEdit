# 不可視文字プラグインの長い行描画例外修正 ウォークスルー (v2.11.1)

## 1. 修正概要
CodeMirror 6（v6.43.9）において、長大な行が存在する場合にエディタの描画最適化機構（line gap）によって `view.visibleRanges` が同一行にまたがる複数区間に分割される際、不可視文字描画プラグイン（`invisibleCharactersPlugin`）が `RangeSetBuilder` のソート順制約違反により例外（`Ranges must be added sorted`）をスローして停止してしまう不具合を修正しました。

併せて、同様のループ構造を持つインデント補助線プラグイン（`indentGuidesPlugin`）についても、同一行が分割された場合の Widget 二重追加の防止および画面外行頭の不要なインデント計算をスキップする最適化を実施しました。

本改修は不具合修正であるため、セマンティックバージョニング規則に基づき **PATCH バージョンアップ（`v2.11.0` → `v2.11.1`）** となります。

---

## 2. 実施した変更内容

### 2.1 `src/frontend/js/ui/codemirror.js`
1. **`invisibleCharactersPlugin.buildDecorations` の走査範囲限定**:
   - 従来の「行全体の先頭から末尾まで（`0..text.length`）走査する」実装を改め、現在の表示区間 `[from, to]` と行の積集合 `[start, end]`（`start = Math.max(from, line.from)`, `end = Math.min(to, line.to)`）のみを走査して装飾を追加するよう修正しました。
   - 改行記号（`↵`）の Widget も、行末が現在の表示区間に含まれる場合（`line.to <= to && line.number < docLines`）にのみ追加するように修正しました。
   - これにより、同一行が複数の `visibleRanges` に分割された場合でも装飾位置が常に昇順（非減少順）に保たれ、例外の発生を根本的に防止するとともに描画負荷を低減しました。
2. **`indentGuidesPlugin.buildDecorations` の行頭ガード＆計算スキップ**:
   - `line.from >= from`（その行の行頭が現在の可視区間に含まれている）判定を、インデント計算（`getLineIndentInfo` や `resolveBlankLineIndent`）の直前に配置しました。
   - 同一行が分割された場合の Widget 二重追加を防止し、画面外となる行頭の探索・計算処理をスキップしてパフォーマンスを向上させました。

### 2.2 バージョン管理ファイルの更新 (v2.11.1)
セマンティックバージョニングの運用方針に基づき、以下の5管理ファイルを一斉更新しました：
- `Cargo.toml`: `version = "2.11.1"`
- `package.json`: `"version": "2.11.1"`
- `tauri.conf.json`: `"version": "2.11.1"`
- `nsis/installer.nsi`: `VERSION "2.11.1"` / `VERSIONWITHBUILD "2.11.1.0"`
- `docs/DEVELOPMENT.md`: ポータブル版ZIPファイル名 `NoCapEdit_v2.11.1_x64_portable.zip`
- `docs/spec.md`: バージョン表記更新

---

## 3. 検証結果

### 3.1 単体テストおよびビルド
- **Rust 単体テスト**: `cargo test`（8 件全件パス確認）
- **フロントエンドビルド**: `npm run build`（正常完了）

### 3.2 実機シミュレーション動作確認
CodeMirror 6 の `RangeSetBuilder` 実モジュールを用いたシミュレーションテストを実施し、以下の全パターンで正常動作を確認しました：
1. **旧ロジックでの不具合再現**:
   - 長大行分割時に期待通り `Ranges must be added sorted` 例外が発生することを確認。
2. **パターン1: 折り返し OFF での長大行検証（5,000文字超）**:
   - line gap による区間分割時にも新ロジックで例外なく装飾（271件）が正常生成されることを確認。
3. **パターン2: 折り返し ON での超長大行検証（30,000文字超）**:
   - 3分割された `visibleRanges` でも例外なく装飾（2,500件）が正常生成されることを確認。
4. **パターン3: カーソル配置・改行記号の表示検証**:
   - 行末を含む区間でのみ `↵` Widget が正確に追加されることを確認。
5. **パターン4: インデントガイドの連動検証**:
   - 同一行分割時に旧ロジックでは2回重複追加されていた Widget が、新ロジックでは1回のみ正確に追加され、重複防止と不要計算スキップが正しく機能することを確認。
