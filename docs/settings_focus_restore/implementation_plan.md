# 設定画面閉じた後のカーソル位置復元 ＆ タブ切り替え時の状態復元 実装計画

本計画では、以下の2つのUX改善を行います。
1. **設定画面閉鎖時の状態復元**: 設定画面（settingsDialog）を閉じた際、エディタにフォーカスを戻し、開く前のカーソル位置・スクロール位置を復元する。
2. **新規タブ/ウィンドウ起動時の自動フォーカス ＆ タブごとのカーソル位置復元**: 新規ウィンドウ起動時やタブ追加時にエディタへ自動フォーカスを当てる。また、既存タブを切り替えた際、直前で編集していたカーソル位置およびスクロール位置をタブごとに記憶・復元する。

## ユーザーレビュー

> [!NOTE]
> 本変更はフロントエンドのスクリプト（`main.js`）のみの変更であり、Rust側の修正やHTML/CSSの構造変更はありません。既存のエディタ動作に対する影響リスクは極めて低いです。

## オープンな質問

特になし。

## 提案する変更

### フロントエンド (`src/dist/main.js`)

#### [MODIFY] [main.js](file:///c:/work/NoCapEdit/src/dist/main.js)

##### 1. 設定画面閉鎖時の状態復元（実装済み）
- 変数 `savedEditorCursor` を定義し、`openSettingsDialog` 時にエディタ状態を一時記憶、`closeSettingsDialog` 時にフォーカス復帰と復元を行います（Null安全チェック付き）。

##### 2. タブ切り替え時の自動フォーカス ＆ 状態復元（新規追加）
- `switchTab(tabId)` 関数（L1037付近）を修正し、切り替え前のタブにカーソル情報を退避し、切り替え後のタブのカーソル状態をエディタに適用します。

```javascript
// タブ切り替え
async function switchTab(tabId) {
    try {
        // 前のタブを保存
        if (appState.currentTab) {
            const currentIdx = appState.tabs.findIndex(t => t.id === appState.currentTab);
            if (currentIdx !== -1) {
                appState.tabs[currentIdx].content = elements.editor.value;
                
                // 【追加】切り替え前のタブのカーソル状態を記憶
                if (elements.editor) {
                    appState.tabs[currentIdx].cursorState = {
                        selectionStart: elements.editor.selectionStart || 0,
                        selectionEnd: elements.editor.selectionEnd || 0,
                        scrollTop: elements.editor.scrollTop || 0,
                    };
                }

                const ok = await persistTabWithRecovery(appState.tabs[currentIdx], 'tab-switch');
                if (!ok) {
                    return;
                }
            }
        }

        // 新しいタブに切り替え
        appState.currentTab = tabId;
        const tab = appState.tabs.find(t => t.id === tabId);

        if (tab) {
            elements.editor.value = tab.content;
            renderTabs();
            updateEditorMetrics();
            updateStatus(tab.fileName + ' - 準備完了');
            
            // 【追加】エディタにフォーカスを戻し、カーソル状態を復元する
            if (elements.editor) {
                elements.editor.focus();
                
                if (tab.cursorState) {
                    // 記憶されたカーソル位置とスクロール位置を復元
                    elements.editor.selectionStart = tab.cursorState.selectionStart;
                    elements.editor.selectionEnd = tab.cursorState.selectionEnd;
                    elements.editor.scrollTop = tab.cursorState.scrollTop;
                } else {
                    // 記憶がない場合（新規タブなど）は、テキストの末尾にカーソルを設定
                    const len = elements.editor.value.length;
                    elements.editor.selectionStart = len;
                    elements.editor.selectionEnd = len;
                    elements.editor.scrollTop = 0;
                }
            }
        }
    } catch (error) {
        console.error('Failed to switch tab:', error);
        updateStatus('タブ切替失敗', 'error');
    }
}
```

---

## 検証計画

### 自動テスト
- フロントエンドJavaScriptのユニットテスト環境がないため、手動検証で網羅的にテストを行います。

### 手動検証

#### A. 設定画面の閉鎖（検証済み）
1. 適当な文字を入力し、任意の場所にカーソルを配置した状態で設定画面を開閉する。
2. 選択範囲を指定した状態で設定画面を開閉する。
3. 複数行スクロールした状態で設定画面を開閉する。
   - **期待される結果**: いずれの場合も設定画面を閉じた後、エディタに自動フォーカスされ、カーソル位置・選択範囲・スクロール位置が完全に復元されること。

#### B. 新規起動とタブ追加時の自動フォーカス（新規追加）
1. **新規起動時**:
   - アプリを起動する。
   - **期待される結果**: 起動直後、テキスト入力エリアにすでにフォーカスが当たっており、カーソルが点滅している。マウスクリックをしなくてもすぐにキーボード入力が開始できること。
2. **新規タブ追加時**:
   - プラス（`+`）ボタンをクリックして新規タブを作成する。
   - **期待される結果**: 新規タブがアクティブになった瞬間、テキスト入力エリアに自動でフォーカスが当たり、カーソルが配置されること。

#### C. タブ間のカーソル・スクロール状態復元（新規追加）
1. タブAに長いテキストを入力し、中ほどの特定の位置にカーソルを置く。
2. プラス（`+`）ボタンでタブBを作成し、そこに別のテキストを入力し、別の位置にカーソルを置く。
3. タブAをクリックして切り替える。
   - **期待される結果**: タブAに自動フォーカスされ、カーソルが直前に置いていた位置に戻り、スクロール位置も完全に維持されていること。
4. 再びタブBに切り替える。
   - **期待される結果**: タブBに自動フォーカスされ、直前のカーソル位置・スクロール位置が復元されていること。
