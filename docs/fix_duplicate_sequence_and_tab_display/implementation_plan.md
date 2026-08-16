# 実装計画書：同名衝突連番の1桁化と保存モード別タブ名表示の統一

同名ファイル重複時の連番生成処理を1桁（`_1`〜`_9`、上限9回）に整理するとともに、手動保存モード・自動保存モードの双方において、外部ファイルや一般ファイルを含むすべてのタブ名表示を統一的なルールに従って正しく表示するよう改善します。

## ユーザーレビューが必要な項目

- ありません。合意いただいた以下の仕様方針に沿って実装します：
  1. 同名ファイル重複時の連番は `_1` 〜 `_9`（最大9回の重複＝1秒間に最大10ファイル）とし、上限超過でエラー。
  2. 自動生成ファイル判定の正規表現は後方互換性のため `_(\d+)`（1桁以上）を許容。
  3. タブ名表示仕様：
     - **自動保存モード**:
       - 未保存: `未保存N`
       - 自動生成（日時）: `yyyy/mm/dd hh:mm:ss`（連番付きは `-1` など）
       - 一般ファイル: `aaaa`（拡張子除去）
     - **手動保存モード**:
       - 未保存: `[未保存N]`
       - 自動生成（日時）: `[yyyy/mm/dd hh:mm:ss]`（連番付きは `[yyyy/mm/dd hh:mm:ss-1]` など）
       - 一般ファイル: `[aaaa]`（拡張子除去＋角括弧で囲む）

## 提案する変更内容

### 1. バックエンド (Rust)

#### [MODIFY] [src/commands.rs](file:///c:/work/NoCapEdit/src/commands.rs)
- `next_available_file_path` 関数内の連番生成フォーマットを `_01`（2桁ゼロ埋め）から `_{}`（1桁連番 `_1`〜`_9`）に変更します。
- 連番の上限チェックを `if index > 9` に更新し、10個目で `fs.error.maxLimitReached` エラーを返すようにします。

```rust
fn next_available_file_path(home_folder: &PathBuf, timestamp: &str) -> Result<(String, PathBuf), String> {
    let base = timestamp.to_string();
    let mut index = 0u32;

    loop {
        let file_name = if index == 0 {
            format!("{}{}", base, FILE_EXTENSION)
        } else {
            format!("{}_{}{}", base, index, FILE_EXTENSION)
        };

        let file_path = home_folder.join(&file_name);
        if !file_path.exists() {
            return Ok((file_name, file_path));
        }

        index += 1;
        if index > 9 {
            return Err("fs.error.maxLimitReached".to_string());
        }
    }
}
```

---

### 2. フロントエンド (JavaScript)

#### [MODIFY] [src/dist/js/utils/helpers.js](file:///c:/work/NoCapEdit/src/dist/js/utils/helpers.js)
- `AUTO_FILE_REGEX` を `^\d{8}_\d{6}(?:_\d+)?\.nctx$` に変更し、新仕様の1桁連番（`_1`）および過去の2桁連番（`_01`）の両方にマッチするようにします。

#### [MODIFY] [src/dist/js/ui/tabs.js](file:///c:/work/NoCapEdit/src/dist/js/ui/tabs.js)
- `formatTabDisplayName(fileName)` を更新します：
  1. 日時抽出の正規表現を `(?:_(\d+))?` に変更し、1桁以上の連番に対応。
  2. 手動保存モード（`appState.saveMode === 'manual'`）の場合、自動生成ファイルだけでなく、一般ファイル（`aaaa.nctx` → `[aaaa]`、`memo.txt` → `[memo]`）にも一律で角括弧 `[ ... ]` を付与するよう共通化。

```javascript
export function formatTabDisplayName(fileName) {
    const unsavedLabel = t('tabs.unsaved.label');
    const unsavedRegex = new RegExp(`^(\\[)?${unsavedLabel}\\d+(\\])?$`);
    if (unsavedRegex.test(fileName)) {
        return fileName;
    }

    let displayName = '';
    if (isAutoCreatedFileName(fileName)) {
        const match = fileName.match(/^(\d{4})(\d{2})(\d{2})_(\d{2})(\d{2})(\d{2})(?:_(\d+))?\.nctx$/);
        if (match) {
            const [_, year, month, day, hour, min, sec, index] = match;
            displayName = `${year}/${month}/${day} ${hour}:${min}:${sec}`;
            if (index) {
                const numIdx = parseInt(index, 10);
                displayName += `-${numIdx}`;
            }
        }
    } else {
        const lastDotIdx = fileName.lastIndexOf('.');
        if (lastDotIdx <= 0) {
            displayName = fileName;
        } else {
            displayName = fileName.substring(0, lastDotIdx);
        }
    }

    if (appState.saveMode === 'manual') {
        return `[${displayName}]`;
    }
    return displayName;
}
```

---

### 3. 仕様書・ドキュメント

#### [MODIFY] [docs/spec.md](file:///c:/work/NoCapEdit/docs/spec.md)
- 連番仕様（`_1`〜`_9`、上限9回）の記載を最新化。
- 手動保存モードにおけるタブ表示名ルール（一般ファイルも `[ファイル名]` となる仕様）を明確化。

---

## 検証計画

### 1. 単体テスト・ロジック検証
- 様々なファイル名パターン（未保存、連番なし日時、1桁連番 `_1`、2桁連番 `_01`、一般ファイル `aaaa.nctx`、`memo.txt`、隠しファイル `.gitignore`）に対して、自動保存モード・手動保存モードそれぞれの表示結果が期待通りとなることをテスト。

### 2. 手動検証
1. **外部ファイルオープン時の表示確認**:
   - `20260720_220219_1.nctx` を手動保存モードで開いた際、タブ名が `[2026/07/20 22:02:19-1]` と表示されることを確認。
   - `aaaa.nctx` や `memo.txt` を開いた際、手動保存モードでは `[aaaa]` / `[memo]`、自動保存モードでは `aaaa` / `memo` と表示されることを確認。
2. **同秒衝突時の連番生成確認**:
   - 同秒内に連続してタブ作成＆保存を行い、`_1`, `_2` ... と1桁の連番ファイルが生成されることを確認。
3. **設定画面でのモード切替確認**:
   - 設定画面で「自動保存」と「手動保存」を切り替えた際、既存の全タブ（未保存、日時ファイル、一般ファイル）の角括弧表示が正しく連動して切り替わることを確認。
