# 修正内容の確認 (Walkthrough) - タイトルバーへのバージョン表示

アプリのタイトルバーおよびウィンドウタイトルに、バージョン番号を含む `NoCapEdit [ Ver 0.1.4 ]` 形式の表示を追加する実装が完了しました。

## 変更内容のまとめ

| ファイル | 変更内容 |
|---|---|
| [mvp-spec.md](file:///c:/work/NoCapEdit/docs/mvp-spec.md) | 仕様書 v1.4 として8.13節・受け入れ基準・実装履歴を追記、バージョン表示を `0.1.4` に修正 |
| [Cargo.toml](file:///c:/work/NoCapEdit/Cargo.toml) | `version = "0.1.0"` → `version = "0.1.4"` |
| [tauri.conf.json](file:///c:/work/NoCapEdit/tauri.conf.json) | `package.version` を `0.1.4` に、`windows[].title` を `NoCapEdit [ Ver 0.1.4 ]` に更新 |
| [index.html](file:///c:/work/NoCapEdit/src/dist/index.html) | `<title>` タグを `NoCapEdit [ Ver 0.1.4 ]` に更新 |

## ビルド確認

`cargo check` の実行結果：
```
Compiling NoCapEdit v0.1.4 (C:\work\NoCapEdit)
Finished `dev` profile [unoptimized + debuginfo] target(s) in 2.46s
```
ビルドエラーなし ✅

## 手動確認項目

- [ ] アプリ起動時、タイトルバーに `NoCapEdit [ Ver 0.1.4 ]` が表示されること
