# ステータスバーのファイル状態表示に関する不具合調査・修正提案

左下のステータスバーにおいて、アクティブなタブの状態とステータス表示が一致しなくなる不具合について調査しました。

## 不具合の原因分析

### 1. 新規ウィンドウを開いて未入力状態でCtrl+Sを押したときに「未保存1 を作成」と表示されるが、ファイルは作成されない

#### 原因
- `appState.saveMode === 'auto'`（自動保存モード、デフォルト）の場合、新規タブ（未入力）で Ctrl+S を押すと `triggerManualSave()` が実行されます。
- `triggerManualSave()` 内では `saveTabIfDirty(tab)` が呼び出されます。
- `saveTabIfDirty(tab)` では、ファイル未作成かつ内容が空（`tab.content.trim() === ''`）の場合、ファイル生成をスキップして `tab.isDirty = false` にした後に早期リターンします。
- しかし、`triggerManualSave()` は `saveTabIfDirty` がスキップされたかどうかを判断せず、`isFirstSave`（`!tab.filePath`）が `true` であることに基づいて一律で `updateStatus('未保存1 を作成', 'saved')` を呼び出してしまいます。
- そのため、実際にはファイルが作成されていないにもかかわらず、ステータスバーに「作成」と表示されてしまいます。

---

### 2. 既存ファイルのタブを閉じて未保存タブに移動した際に、ステータスバー左側の状態が更新されない

#### 原因
- `closeTab(tabId)` 関数内でアクティブなタブが閉じられた際、残ったタブがある場合にアクティブなタブを切り替える処理があります。
- 現在の `closeTab` の実装では、以下のように直接 `appState.currentTab` を書き換え、エディタの値を同期しています。
  ```javascript
  appState.currentTab = appState.tabs[0].id;
  const active = getCurrentTab();
  if (active) {
      elements.editor.value = active.content;
  }
  ```
- この処理において、タブ切り替え用の共通関数である `switchTab(tabId)` が呼び出されていません。
- `switchTab` の中には、ステータスバーを切り替え先タブの状態に更新する `updateTabStatus(tab)` や、カーソル位置の復元、エディタへのフォーカスなどの処理が含まれていますが、これらが一切実行されないため、ステータスバーが閉じた古いタブの状態（「〜 を開きました」など）のまま残ってしまいます。

---

## 修正案

### 1. `saveTabIfDirty` の戻り値として、実際に保存が行われたかを返すように変更する
`saveTabIfDirty` が正常にファイルを保存した場合は `true`、空ファイルのため保存をスキップした場合などは `false` を返すようにします。

```javascript
// src/dist/main.js
async function saveTabIfDirty(tab) {
    if (!tab || !tab.isDirty) {
        return false;
    }

    // ファイル未作成で内容が空（または空白のみ）の場合は保存（ファイル作成）をスキップし、未保存フラグを下げる
    if (!tab.filePath && tab.content.trim() === '') {
        tab.isDirty = false;
        renderTabs();
        return false; // スキップしたため false を返す
    }
    
    // ... 保存処理 ...
    await tab.savePromise;
    return true; // 保存成功したため true を返す
}
```

### 2. `triggerManualSave` と `autoSave` で戻り値を判定し、ステータス表示を制御する
保存がスキップされた場合は「作成」と表示せず、`updateTabStatus(tab)` を呼んでステータスを初期状態（「保存準備完了」など）に戻します。

```javascript
// triggerManualSave の修正イメージ
    try {
        updateTabStatus(tab, '保存中...', 'saving');

        let saved = false;
        if (appState.saveMode === 'manual') {
            // ... 手動保存処理 ...
            saved = true;
        } else {
            tab.isDirty = true;
            saved = await saveTabIfDirty(tab);
        }

        renderTabs();

        if (saved) {
            if (isFirstSave) {
                let prefix = '';
                if (appState.saveMode === 'manual') {
                    prefix = '[手動保存:Ctrl+S] ';
                }
                updateStatus(`${prefix}${tab.fileName} を作成`, 'saved', true);
            } else {
                updateTabStatus(tab, '保存済み', 'saved');
            }
        } else {
            // 保存がスキップされた場合は、現在のタブ状態に基づいてステータスを更新する
            updateTabStatus(tab);
        }
    } catch (error) { ... }
```

```javascript
// autoSave の修正イメージ
    try {
        updateTabStatus(tab, '保存中...', 'saving');

        const saved = await saveTabIfDirty(tab);

        if (saved) {
            if (isFirstSave) {
                updateStatus(tab.fileName + ' を作成', 'saved');
            } else {
                updateTabStatus(tab, '保存済み', 'saved');
            }
        } else {
            // 保存がスキップされた場合は、現在のタブ状態に基づいてステータスを更新する
            updateTabStatus(tab);
        }
    } catch (error) { ... }
```

### 3. `closeTab` 内で `switchTab` を呼び出してタブを切り替える
アクティブなタブを閉じた後の切り替え処理で `switchTab` を呼び出すことで、ステータス表示やエディタのフォーカス、カーソル位置の復元などの一連の処理を一貫して実行させます。

```javascript
// closeTab の修正イメージ
    if (appState.currentTab === tabId) {
        if (appState.tabs.length > 0) {
            // appState.currentTab = appState.tabs[0].id; を直接代入するのではなく、switchTab を呼ぶ
            await switchTab(appState.tabs[0].id);
        } else {
            appState.currentTab = null;
            elements.editor.value = '';
            await createNewTab();
        }
    }
```
