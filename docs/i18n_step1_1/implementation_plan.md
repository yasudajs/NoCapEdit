# i18n リファクタリング: Phase 1 (Step 1.1 - `settings.js`) 実装計画書

## 目的
マスタープランに基づき、`src/dist/js/ui/settings.js` 内にハードコードされている日本語文字列を `src/dist/i18n.js` に抽出し、ドット区切りのキーに置き換えます。

## ユーザーレビュー要求事項

> [!NOTE]
> 抽出した文字列に対するキー名の命名規則と階層構造（`settings`, `status`, `tabs`）について、以下の内容で問題ないかご確認ください。

## 変更内容

### 1. 抽出対象のキー設計と `i18n.js` への追加
以下の階層構造で `i18n.js` の `DICT.ja` に文字列を追加します。完全にスネークケースを排除したネスト構造とします。

```js
const DICT = {
    ja: {
        // ...既存の folder キー等 ...
        settings: {
            folder: {
                hint: {
                    missing: "保存先フォルダが見つからないため、再設定してください",
                    default: "ここにファイルが保存されます"
                }
            },
            alert: {
                home: {
                    folder: {
                        required: "ホームフォルダを指定してください"
                    }
                }
            },
            font: {
                group: {
                    monospace: "等幅フォント",
                    other: "その他のフォント"
                }
            }
        },
        status: {
            ready: "準備完了",
            loading: {
                fonts: "システムフォントを読み込み中..."
            },
            error: {
                settings: {
                    save: "設定保存エラー"
                },
                font: {
                    load: "フォント読み込み失敗"
                }
            }
        },
        tabs: {
            unsaved: {
                label: "未保存"
            }
        }
    }
};
```

### 2. `src/dist/js/ui/settings.js` の置換
#### [MODIFY] [settings.js](file:///c:/work/NoCapEdit/src/dist/js/ui/settings.js)
ファイル内のハードコード文字列を `window.t('...')` に置き換えます。
- `L57-58`: `isMissingFolder` 時のメッセージを `t('settings.folder.hint.missing')` および `t('settings.folder.hint.default')` に置換。
- `L119`: `alert(t('settings.alert.home.folder.required'))` に置換。
- `L141, L144, L165, L167`: タブ名の `'未保存'` および `'[未保存'` の生成部分について、`t('tabs.unsaved.label')` を用いて結合するように修正（例: `` `${window.t('tabs.unsaved.label')}${tab.unsavedNumber}` ``）。
- `L183, L258`: `updateStatus(window.t('status.ready'))` に置換。
- `L188`: `updateStatus(window.t('status.error.settings.save'), 'error')` に置換。
- `L224`: `updateStatus(window.t('status.loading.fonts'))` に置換。
- `L232`: `monoGroup.label = window.t('settings.font.group.monospace')` に置換。
- `L235`: `otherGroup.label = window.t('settings.font.group.other')` に置換。
- `L261`: `updateStatus(window.t('status.error.font.load'), 'error')` に置換。

---

## 検証計画

### 自動テスト / 動作確認
1. **設定画面の開閉**:
   - フォルダが未設定の場合と設定済みの場合で、ヒント文が正しく表示されること。
   - フォルダ未入力のまま保存ボタンを押した際にアラートが正しく表示されること。
2. **フォント読み込み**:
   - フォント選択ドロップダウンのグループ名（等幅フォント、その他のフォント）が正しく表示されること。
   - 読み込み中のステータス表示が正しく切り替わること。
3. **タブの挙動と保存モード変更**:
   - 保存モードを「自動」⇔「手動」に切り替えた際、未保存タブの名前が正しく `[未保存1]` や `未保存1` のように切り替わること。
