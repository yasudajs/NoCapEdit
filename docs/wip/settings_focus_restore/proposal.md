# 設定画面閉じた後のカーソル位置復元

## 課題

設定画面（settingsDialog）を開いて閉じた際、エディタ（textarea）にフォーカスが戻らず、カーソルが表示されないため、文字入力をシームレスに再開できない。

### 再現手順

1. エディタ上でテキストを編集中（カーソルがある状態）
2. 設定ボタン（歯車アイコン）をクリックして設定画面を開く
3. 設定画面を閉じる（オーバーレイクリック or 歯車ボタン再クリック）
4. **期待**: エディタにカーソルが戻り、すぐに入力再開できる
5. **実際**: カーソルが消えており、エディタをクリックしないと入力できない

---

## 提案する実装内容

### 概要

設定画面の開閉時に、以下の2つの処理を追加する。

1. **設定画面を開いたとき**: エディタの現在のカーソル位置（selectionStart / selectionEnd）およびスクロール位置を記憶する
2. **設定画面を閉じたとき**: 記憶したカーソル位置とスクロール位置を復元し、エディタにフォーカスを戻す

### 実装方針

#### 影響範囲

- `src/dist/main.js` のみ（フロントエンドのみ、Rust側の変更は不要）

#### 変更対象の関数

| 関数名 | ファイル内の場所 | 変更内容 |
|---|---|---|
| `openSettingsDialog()` | L499-534 | 冒頭でカーソル位置を保存する処理を追加 |
| `closeSettingsDialog()` | L491-496 | カーソル位置の復元とフォーカスの復帰を追加 |

#### 具体的な実装案

##### 1. カーソル位置の一時保存用変数の追加

```javascript
// 設定画面を開く前のエディタのカーソル状態を保持する
let savedEditorCursor = null;
```

##### 2. `openSettingsDialog()` の冒頭に追加

```javascript
// 設定画面を開く前にカーソル位置を保存
savedEditorCursor = {
    selectionStart: elements.editor.selectionStart,
    selectionEnd: elements.editor.selectionEnd,
    scrollTop: elements.editor.scrollTop,
};
```

##### 3. `closeSettingsDialog()` の末尾に追加

```javascript
// エディタにフォーカスを戻し、カーソル位置を復元
if (savedEditorCursor !== null) {
    elements.editor.focus();
    elements.editor.selectionStart = savedEditorCursor.selectionStart;
    elements.editor.selectionEnd = savedEditorCursor.selectionEnd;
    elements.editor.scrollTop = savedEditorCursor.scrollTop;
    savedEditorCursor = null;
}
```

---

## 技術的な検討事項

### 実現可能性

**結論: 十分に実現可能**

- エディタは標準の `<textarea>` 要素であり、`selectionStart`/`selectionEnd`/`scrollTop` のプロパティで位置の取得・設定が可能。
- 既存コードでも `selectionStart`/`selectionEnd` は Tab キー処理（L727-804）やメトリクス更新（L92-93）で使用されており、実績がある。
- フォーカスの復帰は `elements.editor.focus()` で対応可能。

### 考慮すべきエッジケース

| ケース | 対応方針 |
|---|---|
| 設定画面を開いた状態でタブが切り替わった場合 | 現在のUIでは設定画面が開いている間にタブの切替操作はできないため、問題なし |
| 設定画面からフォントサイズやテーマを変更した場合 | エディタの内容自体は変わらないため、カーソル位置は有効なまま保持される |
| 初回起動時の設定画面（ホームフォルダ未設定時） | 初回起動時はエディタにまだコンテンツがないため、カーソル位置は0で問題なし |
| 設定画面でホームフォルダを変更した場合 | ファイルの保存先が変わるだけで、エディタの内容やカーソル位置には影響しない |

### リスク評価

- **低リスク**: 変更は `main.js` の2つの関数に対する小規模な追加のみ
- **既存動作への影響なし**: 設定画面を開閉する以外のフローには影響しない
- **テスト容易**: 手動テストで動作確認が容易

---

## 作業見積もり

- 実装: 10行程度の追加
- テスト: 手動テストで十分（設定画面の開閉→カーソル復帰の確認）
- 所要時間: 短時間で完了可能
