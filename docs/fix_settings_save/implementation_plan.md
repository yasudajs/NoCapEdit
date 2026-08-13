# `saveSettings()` のリファクタリング計画

リファクタリングレビューで指摘された「5. `settings.js` の `saveSettings()` が複雑」という問題を解消します。
現在 `saveSettings()` 関数は、設定の永続化以外にも「保存モード切り替え時のタブ名変換や不要ファイルの削除処理」などの多くの副作用を含んでおり、関数が肥大化しています。
この副作用部分を別の関数として抽出（Extract Method）し、可読性と凝集度を向上させます。

## User Review Required

以下の修正方針をご確認ください。

## Proposed Changes

### Frontend JS

#### [MODIFY] [settings.js](file:///c:/work/NoCapEdit/src/dist/js/ui/settings.js)
`saveSettings()` 関数内の「保存モード（auto/manual）切り替え時の処理ブロック」を抽出し、非同期関数 `handleSaveModeSwitch(previousSaveMode, saveMode)` として独立させます。
これにより `saveSettings()` 自身の記述をスリム化します。

**変更内容イメージ:**
```javascript
export async function saveSettings() {
    // ... 前半の取得とバリデーション
    try {
        appState.homeFolder = homeFolder;
        // ... 代入処理
        await saveApplicationSettings();

        // 抽出した関数を呼び出すだけにする
        await handleSaveModeSwitch(previousSaveMode, saveMode);
        
        updateEditorMetrics();
        // ... 後半のUI更新処理
    } catch (error) { ... }
}

// 抽出された関数
async function handleSaveModeSwitch(previousSaveMode, saveMode) {
    if (previousSaveMode === saveMode) return;

    if (appState.autosaveTimer) {
        clearTimeout(appState.autosaveTimer);
        appState.autosaveTimer = null;
    }

    if (previousSaveMode === 'manual' && saveMode === 'auto') {
        // [未保存N] -> 未保存N への変換処理や autoSave() の呼び出し
    } else if (previousSaveMode === 'auto' && saveMode === 'manual') {
        // 空ファイル削除処理や 未保存N -> [未保存N] への変換処理
    }
}
```

## Verification Plan

### Automated Tests
- なし（フロントエンドJSのロジックリファクタリング）

### Manual Verification
- 設定画面から「保存モード（自動/手動）」を切り替えて設定を保存し、未保存タブの名前（角括弧の有無）が正しく連動して変わること、また空ファイルの削除等の副作用がデグレードなく動作することを確認します。
