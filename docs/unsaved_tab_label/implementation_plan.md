# 実装計画書：新規タブの「未保存」ラベル表示

## 概要

遅延ファイル作成の仕様に合わせ、新規タブを開いた時点でのタブ名を
「未保存N」（自動保存モード）または「[未保存N]」（手動保存モード）に変更する。
初回保存が実行された時点でタイムスタンプ表示に切り替える。

あわせて、ファイル名のタイムスタンプ基準を「タブ作成時刻」から「初回保存時刻」に変更する。

---

## 変更対象ファイル

### `src/dist/main.js`（フロントエンド）

---

## 変更内容の詳細

### ① セッション連番カウンタの追加（定数・状態管理）

**変更箇所**: ファイル冒頭の定数定義・`appState` オブジェクト

```diff
// 変更前
let appState = {
    ...
};

// 変更後
// セッション内の未保存タブ連番カウンタ（再起動でリセット）
let unsavedTabCounter = 0;

let appState = {
    ...
};
```

`appState` の外側にモジュールレベル変数として `unsavedTabCounter` を追加する。

---

### ② `createNewTab()` の変更

**変更箇所**: L.1023〜L.1071

**変更内容**:
- `unsavedTabCounter` をインクリメントしてタブ名に使用する
- タイムスタンプの事前計算（`timestamp`）を削除する
  - 代わりに `tab.createdTimestamp` は**空文字**のまま生成する（実際のタイムスタンプは初回保存時に決定）
- `fileName` を `未保存N` / `[未保存N]` 形式にする

```diff
// 変更前
const now = new Date();
const yyyy = ...
timestamp = `${yyyy}${mm}${dd}_${hh}${min}${ss}`;

if (appState.saveMode === 'manual') {
    fileName = `[${yyyy}/${mm}/${dd} ${hh}:${min}:${ss}]`;
} else {
    fileName = `${timestamp}.nctx`;
}

const tab = {
    ...
    fileName: fileName,
    createdTimestamp: timestamp,
};

// 変更後
unsavedTabCounter++;
if (appState.saveMode === 'manual') {
    fileName = `[未保存${unsavedTabCounter}]`;
} else {
    fileName = `未保存${unsavedTabCounter}`;
}

const tab = {
    ...
    fileName: fileName,
    filePath: '',
    createdTimestamp: '',  // 初回保存時に設定
};
```

---

### ③ `saveTabIfDirty()` の変更

**変更箇所**: L.1158〜L.1166（初回保存ブロック）

**変更内容**:
- `invoke('create_and_save_file')` に渡す `timestamp` を **呼び出し時の現在時刻** で生成する
- 現在は `tab.createdTimestamp`（タブ作成時刻）を使っているが、これを廃止する

```diff
// 変更前
const file = await invoke('create_and_save_file', {
    homeFolder: appState.homeFolder,
    timestamp: tab.createdTimestamp,
    content: tab.content,
});

// 変更後
const now = new Date();
const yyyy = now.getFullYear();
const mm = String(now.getMonth() + 1).padStart(2, '0');
const dd = String(now.getDate()).padStart(2, '0');
const hh = String(now.getHours()).padStart(2, '0');
const min = String(now.getMinutes()).padStart(2, '0');
const ss = String(now.getSeconds()).padStart(2, '0');
const saveTimestamp = `${yyyy}${mm}${dd}_${hh}${min}${ss}`;

const file = await invoke('create_and_save_file', {
    homeFolder: appState.homeFolder,
    timestamp: saveTimestamp,
    content: tab.content,
});
```

---

### ④ `triggerManualSave()` の変更

**変更箇所**: L.1328〜L.1342（手動保存モードの初回保存ブロック）

**変更内容**:
- 現在は `tab.fileName` のタイムスタンプ文字列を正規表現でパースしてファイル名を生成しているが、
  `[未保存N]` 形式になるためそのロジックは不要になる
- 常に現在時刻からファイル名を生成するロジックに統一する

```diff
// 変更前
const match = tab.fileName.match(/^\[(\d{4})\/(\d{2})\/(\d{2}) (\d{2}):(\d{2}):(\d{2})\]$/);
if (match) {
    fileName = `${match[1]}${match[2]}${match[3]}_${match[4]}${match[5]}${match[6]}.nctx`;
} else {
    const now = new Date();
    ...
    fileName = `${yyyy}${mm}${dd}_${hh}${min}${ss}.nctx`;
}

// 変更後
const now = new Date();
const yyyy = now.getFullYear();
const mm = String(now.getMonth() + 1).padStart(2, '0');
const dd = String(now.getDate()).padStart(2, '0');
const hh = String(now.getHours()).padStart(2, '0');
const min = String(now.getMinutes()).padStart(2, '0');
const ss = String(now.getSeconds()).padStart(2, '0');
fileName = `${yyyy}${mm}${dd}_${hh}${min}${ss}.nctx`;
```

---

### ⑤ `formatTabDisplayName()` の変更

**変更箇所**: L.146〜L.165

**変更内容**:
- `未保存N` / `[未保存N]` 形式のファイル名はそのまま返す（変換不要）
- 現在は「ファイルが存在する」前提でフォーマットしているが、未保存ラベルを透過させる

```diff
// 変更前
function formatTabDisplayName(fileName) {
    if (isAutoCreatedFileName(fileName)) {
        ...
    }
    // 拡張子除去ロジック
}

// 変更後
function formatTabDisplayName(fileName) {
    // 未保存ラベルはそのまま返す
    if (/^(\[)?未保存\d+(\])?$/.test(fileName)) {
        return fileName;
    }
    if (isAutoCreatedFileName(fileName)) {
        ...
    }
    // 拡張子除去ロジック（変更なし）
}
```

---

### ⑥ `autoSave()` の `isFirstSave` 判定（確認のみ・変更なし）

**変更箇所**: L.1290

```js
const isFirstSave = !tab.filePath;
```

`filePath` が空かどうかで初回保存を判定しており、これは変更後も正しく機能する。変更不要。

---

### ⑦ `shouldDeleteEmptyFile()` の対応確認（変更なし）

**変更箇所**: L.1218〜L.1228

ファイルが未作成の場合は最初の `if (!tab.filePath) return false;` で正しく `false` を返す。
**ファイルが未作成の場合は削除不要**という既存ロジックで問題なく機能する。変更不要。

---

## 変更ファイルまとめ

| ファイル | 変更内容 |
|---|---|
| `src/dist/main.js` | ①〜⑤の変更 |
| `docs/spec.md` | 更新済み（ブランチ作成時に実施） |

---

## 検証計画

### 手動確認項目

| # | 操作 | 期待結果 |
|---|---|---|
| 1 | 起動直後 | タブ名が `未保存1` で表示される |
| 2 | `+` ボタンで新規タブ追加 | `未保存2`、`未保存3` と連番が増える |
| 3 | 文字を入力して3秒待つ（自動保存） | タブ名が `2026/07/12 11:xx:xx` に切り替わる |
| 4 | `Ctrl+S` で手動保存（自動保存モード） | タブ名がタイムスタンプに切り替わる |
| 5 | 手動保存モードに切り替えて新規タブ | タブ名が `[未保存1]` で表示される |
| 6 | 手動保存モードで `Ctrl+S` | タブ名が `[2026/07/12 11:xx:xx]` に切り替わる |
| 7 | アプリ再起動後 | 連番が `未保存1` からリセットされている |
| 8 | `未保存1`（内容なし）のまま新規タブを開く | `未保存1` はそのまま残り、`未保存2` が開く |
| 9 | `未保存1`（内容なし）タブを閉じる | ディスク操作なしでタブが閉じる |
| 10 | 既存ファイルを開く | タブ名が従来通り正常表示される |
