# ウォークスルー: 手動保存時のパス結合をRust側に統一

## 概要

リファクタリングレビュー項目7「`fileSystem.js` のパス区切り文字ハードコード」の改善対応。
前回の修正（v0.1.66）では JS側に `getPathSeparator()` 関数を追加するアプローチだったが、本修正ではRust側の既存コマンド `create_and_save_file` を活用してパス結合を一元化した。

## 変更内容

### fileSystem.js
- `triggerManualSave()` の手動モード初回保存で、`save_text_file` + JS側パス結合 → `create_and_save_file` コマンドに変更
- 自動保存（`saveTabIfDirty()`）と同じ呼び出しパターンに統一
- `getPathSeparator` のインポートを削除

### helpers.js
- 使用箇所がなくなった `getPathSeparator()` 関数を削除

### Rust側
- 変更なし。既存の `create_and_save_file` コマンドをそのまま利用

## 検証結果
- `cargo build` 成功（v0.1.71）
