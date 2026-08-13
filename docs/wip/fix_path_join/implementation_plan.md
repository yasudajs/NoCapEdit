# 手動保存時のパス結合をRust側に統一

手動保存（manual モード）の初回保存で、JS側で `getPathSeparator()` を使ったパス文字列結合を行っている箇所を、自動保存と同様にRust側の `create_and_save_file` コマンドで `PathBuf::join()` によるパス結合を行うように統一する。

## 背景

- **自動保存**: `create_and_save_file` コマンドを使用 → Rust側で `PathBuf::join()` によるパス結合 ✅
- **手動保存**: `save_text_file` コマンドを使用 → JS側で `getPathSeparator()` + 文字列結合でパスを構築 ⚠️

手動保存の初回保存（新規ファイル作成）は、自動保存の初回保存と実質同じ処理（タイムスタンプからファイル名を生成→保存フォルダにファイル作成→内容書き込み）を行っている。`create_and_save_file` コマンドを共有することで、パス結合のロジックをRust側に一元化できる。

---

## Proposed Changes

### フロントエンド (JavaScript)

#### [MODIFY] [fileSystem.js](file:///c:/work/NoCapEdit/src/dist/js/core/fileSystem.js)

`triggerManualSave()` の手動モード初回保存処理を変更:

```diff
         if (appState.saveMode === 'manual') {
             const saveTimestamp = generateTimestamp();
-            const fileName = `${saveTimestamp}.nctx`;
-            const separator = getPathSeparator();
-            const filePath = appState.homeFolder.replace(/[\\\/]$/, '') + separator + fileName;
-            
-            await invoke('save_text_file', {
-                filePath: filePath,
-                content: tab.content
+            const file = await invoke('create_and_save_file', {
+                homeFolder: appState.homeFolder,
+                timestamp: saveTimestamp,
+                content: tab.content,
             });
-            tab.filePath = filePath;
-            tab.fileName = fileName;
+            tab.filePath = file.file_path;
+            tab.fileName = file.file_name;
             tab.createdTimestamp = saveTimestamp;
             tab.isDirty = false;
             saved = true;
```

自動保存の `saveTabIfDirty()` と同じ呼び出しパターンになる。Rust側がパス結合・ファイル名生成・重複回避をすべて処理し、結果の `FileInfo`（`file_name`, `file_path`）を返す。

#### [MODIFY] [fileSystem.js](file:///c:/work/NoCapEdit/src/dist/js/core/fileSystem.js) (import)

`getPathSeparator` のインポートを削除:

```diff
-import { getFileNameFromPath, isAutoCreatedFileName, generateTimestamp, generateTabId, getPathSeparator } from '../utils/helpers.js';
+import { getFileNameFromPath, isAutoCreatedFileName, generateTimestamp, generateTabId } from '../utils/helpers.js';
```

#### [MODIFY] [helpers.js](file:///c:/work/NoCapEdit/src/dist/js/utils/helpers.js)

`getPathSeparator()` 関数を削除（他に使用箇所なし）:

```diff
-export function getPathSeparator() {
-    return navigator.userAgent.includes('Windows') ? '\\' : '/';
-}
```

### バックエンド (Rust)

変更なし。既存の [`create_and_save_file`](file:///c:/work/NoCapEdit/src/commands.rs#L70-L90) コマンドをそのまま利用する。

---

## 変更の影響範囲

- **手動モードの初回保存**のみ。2回目以降の上書き保存（`save_text_file`）は影響なし
- 自動保存と手動保存で、初回保存のコードパスが統一される
- `create_and_save_file` には重複ファイル名回避ロジック（`_01`, `_02` サフィックス）が含まれるため、手動保存でも同一秒内に複数保存した場合の安全性が向上する

---

## Verification Plan

### 動作確認
1. **手動保存モードで新規ファイルが正常に作成されること**を確認
2. **自動保存モードで新規ファイルが正常に作成されること**を確認（既存動作の退行確認）
3. **ビルド成功**の確認（`cargo build`）
