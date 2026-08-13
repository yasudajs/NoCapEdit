# パス区切り文字ハードコード解消の修正計画

リファクタリングレビューで指摘された「7. `fileSystem.js` のパス区切り文字ハードコード」を修正します。
現在、手動保存時のファイルパス生成において `\\`（Windows専用のパス区切り文字）がハードコードされており、将来的なMac/Linux版展開の障害となります。実行環境のOSを判別して動的に区切り文字を切り替えるようリファクタリングを行います。

## User Review Required

以下の修正方針をご確認ください。

## Proposed Changes

### Frontend JS

#### [MODIFY] [helpers.js](file:///c:/work/NoCapEdit/src/dist/js/utils/helpers.js)
ユーザーエージェントから実行OS（Windowsか否か）を判別し、適切なパス区切り文字を返すユーティリティ関数 `getPathSeparator()` を追加します。
※Tauriの非同期OS APIを避けることで、既存の同期処理に影響を与えずに組み込めます。

```javascript
export function getPathSeparator() {
    return navigator.userAgent.includes('Windows') ? '\\' : '/';
}
```

#### [MODIFY] [fileSystem.js](file:///c:/work/NoCapEdit/src/dist/js/core/fileSystem.js)
`triggerManualSave()` メソッド内でパスを結合している部分を、`\\` のハードコードから `getPathSeparator()` を使用する形に変更します。

```diff
- const filePath = appState.homeFolder.replace(/[\\\/]$/, '') + '\\' + fileName;
+ const separator = getPathSeparator();
+ const filePath = appState.homeFolder.replace(/[\\\/]$/, '') + separator + fileName;
```
※ファイル上部のインポート文に `getPathSeparator` を追加します。

## Verification Plan

### Automated Tests
- なし（フロントエンドJSのロジック修正）

### Manual Verification
- アプリを起動し、手動保存モードで新規ファイルを作成・保存した際に、保存先パスが環境に応じて正しく結合（Windowsなら `\`）され、ファイルが作成されることを確認します。
