# ステップ 2.1: タイムスタンプ生成関数の共通化

## 目的
フロントエンドの `src/dist/js/core/fileSystem.js` 内で複数回（手動保存時や自動保存時など）記述されている、現在時刻からのタイムスタンプ文字列（`YYYYMMDD_HHmmss` 形式）生成ロジックを共通関数として抽出します。これにより、コードの重複を排除し、保守性を向上させます。

## 提案する変更内容

### [MODIFY] `src/dist/js/utils/helpers.js`
- タイムスタンプ文字列を生成して返す共通関数 `generateTimestamp()` を新規に追加しエクスポートします。

```javascript
export function generateTimestamp() {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const hh = String(now.getHours()).padStart(2, '0');
    const min = String(now.getMinutes()).padStart(2, '0');
    const ss = String(now.getSeconds()).padStart(2, '0');
    return `${yyyy}${mm}${dd}_${hh}${min}${ss}`;
}
```

### [MODIFY] `src/dist/js/core/fileSystem.js`
- ファイル冒頭の `import` 文に `generateTimestamp` を追加します。
- 既存の冗長なタイムスタンプ生成ロジック（約8行のブロックが2箇所）を削除し、それぞれ `const saveTimestamp = generateTimestamp();` の呼び出しに置き換えます。

## 検証プラン
### 手動検証
- **新規ファイルの作成と保存**: 新規タブでテキストを入力し保存（または自動保存）した際、生成されるファイル名がこれまで通り `YYYYMMDD_HHmmss.nctx` 形式で正しく作成されるか確認します。
