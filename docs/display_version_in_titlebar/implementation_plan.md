# タイトルバーへのバージョン表示機能の実装計画

アプリケーションウィンドウのタイトルバーに、現在のアプリバージョン（`Ver 0.1.3`）を表示させます。これに伴い、プロジェクト設定上のバージョン番号を `0.1.3` に更新し、仕様書（`mvp-spec.md`）にも追記します。

## ユーザーレビュー要求事項

> [!NOTE]
> 今回の変更は設定ファイルおよびHTMLファイルの静的な記述の更新であり、プログラムのロジック（JavaScriptやRustコード）への影響はありません。

## 提案される変更

### 1. 仕様書への追記 (Markdown)

---

#### [MODIFY] [mvp-spec.md](file:///c:/work/NoCapEdit/docs/mvp-spec.md)

- 文書情報の「最終更新日」を更新します。
- 「改訂履歴」にバージョン 1.4 の項目を追記します。
- 「6.1 MVPに含める機能」に「タイトルバーへのバージョン表示」を追記します。
- 「8.13 タイトルバーへのバージョン表示機能」の要件セクションを新規追加します。
- 「13 受け入れ基準」に表示確認のテスト項目を追記します。
- 「14 実装履歴および達成状況」に項目を追加します。

##### 変更イメージ
```markdown
### 8.13 タイトルバーへのバージョン表示機能
- **タイトル表示の仕様**:
  - ウィンドウのタイトルバーに、アプリケーション名と現在のバージョン番号を表示する。
  - 表示形式は `NoCapEdit [ Ver 0.1.3 ]` とする。
```

---

### 2. プロジェクトバージョンとタイトルの更新

---

#### [MODIFY] [Cargo.toml](file:///c:/work/NoCapEdit/Cargo.toml)

- `version` を `"0.1.0"` から `"0.1.3"` に変更します。

```diff
 [package]
 name = "NoCapEdit"
-version = "0.1.0"
+version = "0.1.3"
 edition = "2021"
```

---

#### [MODIFY] [tauri.conf.json](file:///c:/work/NoCapEdit/tauri.conf.json)

- `package` > `version` を `"0.1.3"` に変更します。
- `tauri` > `windows` 内の `title` を `"NoCapEdit [ Ver 0.1.3 ]"` に変更します。

```diff
   "package": {
     "productName": "NoCapEdit",
-    "version": "0.1.0"
+    "version": "0.1.3"
   },
...
     "windows": [
       {
         "fullscreen": false,
         "height": 600,
         "resizable": true,
-        "title": "NoCapEdit",
+        "title": "NoCapEdit [ Ver 0.1.3 ]",
         "width": 900,
```

---

#### [MODIFY] [index.html](file:///c:/work/NoCapEdit/src/dist/index.html)

- `<title>` タグを `"NoCapEdit [ Ver 0.1.3 ]"` に変更します。

```diff
     <meta charset="UTF-8">
     <meta name="viewport" content="width=device-width, initial-scale=1.0">
-    <title>NoCapEdit</title>
+    <title>NoCapEdit [ Ver 0.1.3 ]</title>
     <link rel="icon" href="favicon.ico" type="image/x-icon">
```

---

## 検証計画

### 1. ビルド検証
- `cargo check` を実行し、`Cargo.toml` の変更に伴うビルドエラーが発生しないことを確認します。

### 2. 手動確認項目
- アプリケーション起動時に、ウィンドウのタイトルバーに `NoCapEdit [ Ver 0.1.3 ]` と表示されていることを確認します。
