# i18n リファクタリング Step 1.2: tabs.js の多言語化対応

`docs/wip/i18n_refactor/master_plan.md` に記載されている「Step 1.2: `tabs.js`」の実装計画書です。

## User Review Required

> [!IMPORTANT]
> - `tabs.js` のソースコードを調査した結果、マスタープランに記載されていた「タブの右クリックコンテキストメニュー」は現在の実装には存在しないことが確認されました。そのため、本対応ではコンテキストメニュー以外のタブ関連のステータスやエラーメッセージのみを対象として抽出・置換します。
> - 正規表現でファイル名が「未保存」から始まるかを判定する処理（` /^(\[)?未保存\d+(\])?$/ `）が含まれています。これについては、`new RegExp` と `t('tabs.unsaved.label')` を組み合わせて動的に正規表現を構築する形に修正します。

## Open Questions

特にありません。上記方針で問題なければ実装に進みます。

## Proposed Changes

### `src/dist/i18n.js`

以下のキーを追加します。

```javascript
tabs: {
    unsaved: {
        label: "未保存" // 既存
    },
    state: {
        saving: "保存中...",
        editing: "編集中",
        saved: "保存済み"
    },
    status: {
        manualSaveHint: "※Ctrl+Sで保存できます",
        ready: "保存準備完了",
        manualSavePrefix: "[手動保存:Ctrl+S] ",
        manualModePrefix: "[手動保存モード]"
    },
    error: {
        noHomeFolder: "ホームフォルダ未設定",
        createFailed: "新規ファイル作成失敗",
        switchFailed: "タブ切替失敗"
    }
}
```

### `src/dist/js/ui/tabs.js`

ハードコードされた文字列を `t('...')` に置き換えます。主な修正点は以下の通りです。

#### [MODIFY] [tabs.js](file:///c:/work/NoCapEdit/src/dist/js/ui/tabs.js)
- **正規表現の動的生成**
  - `const unsavedLabel = t('tabs.unsaved.label');`
  - `const unsavedRegex = new RegExp(\`^(\\\\[)?${unsavedLabel}\\\\d+(\\\\])?$\`);` に変更
- **タブステータス文字列の置換**
  - `targetState = '保存中...';` -> `targetState = t('tabs.state.saving');`
  - `targetState = '編集中';` -> `targetState = t('tabs.state.editing');`
  - `targetState = '保存済み';` -> `targetState = t('tabs.state.saved');`
- **ステータスバーへの表示メッセージの置換**
  - `displayMessage = \`[手動保存モード] ${message}\`;` -> `displayMessage = \`${t('tabs.status.manualModePrefix')} ${message}\`;`
  - `updateStatus('※Ctrl+Sで保存できます', ...)` -> `updateStatus(t('tabs.status.manualSaveHint'), ...)`
  - `updateStatus('保存準備完了', ...)` -> `updateStatus(t('tabs.status.ready'), ...)`
  - `prefix = '[手動保存:Ctrl+S] ';` -> `prefix = t('tabs.status.manualSavePrefix');`
- **エラーメッセージの置換**
  - `'ホームフォルダ未設定'` -> `t('tabs.error.noHomeFolder')`
  - `'新規ファイル作成失敗'` -> `t('tabs.error.createFailed')`
  - `'タブ切替失敗'` -> `t('tabs.error.switchFailed')`
- **新規タブ作成時の「未保存」テキストの置換**
  - 既存の `fileName = \`[未保存${currentUnsaved}]\`;` などを `t('tabs.unsaved.label')` を用いて構築するように変更。

## Verification Plan

### Manual Verification
1. アプリを起動し、新規タブ作成時に「未保存1」や「[未保存1]」（手動保存モード時）と正しく表示されること。
2. タブ内でテキストを編集し、ステータスバーが「編集中」になること。
3. 手動保存モードにしてステータスバーに「[手動保存モード]」や「[手動保存:Ctrl+S]」のプレフィックスが正しく付与されること。
4. ファイル保存後にステータスが「保存済み」になること。
5. （可能であれば）ホームフォルダ未設定などのエラー状態を引き起こし、エラーメッセージが正しく表示されること。
