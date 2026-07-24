# 実装計画書 - 空ディレクトリ判定のドットファイル除外ロジック修正

## 概要
`src/main.rs` の `is_dir_empty_custom` 関数における空ディレクトリ判定ロジックを修正します。
現行実装では先頭が `.` で始まるファイル全てを判定除外（空とみなす）としているため、ユーザーが作成した重要な隠しファイル（例: `.env`, `.gitignore`）が含まれるフォルダが「空」と判定されて意図せず削除されてしまうリスクがあります。
本改修により、OSが自動生成する特定の不要メタデータ・キャッシュファイルのみをスキップ対象とし、それ以外の全ての隠しファイルおよび一般ファイルが存在する場合は「空ではない」と正しく判定するように変更します。
なお、除外対象のホワイトリスト定数は `src/constants.rs` に定義して一元管理します。

## 変更対象ファイル
- `docs/spec.md` [更新済み]
- `src/constants.rs` [新規定数の追加]
- `src/main.rs` (`is_dir_empty_custom`, `test_is_dir_empty_custom`)
- `docs/empty_dir_dotfile_check/implementation_plan.md`
- `docs/empty_dir_dotfile_check/task.md`

## 判定ロジックの詳細設計

### 定義する定数 (`src/constants.rs`)
```rust
// 空ディレクトリ判定でスキップするOS自動生成メタデータファイル名リスト（大文字小文字無視用を含む）
pub const IGNORED_METADATA_FILES: &[&str] = &[
    ".DS_Store",
    "Thumbs.db",
    "desktop.ini",
    ".Trashes",
];

// 空ディレクトリ判定でスキップするOS自動生成メタデータファイルのプレフィックス
pub const IGNORED_METADATA_PREFIXES: &[&str] = &[
    "._",
];
```

### スキップ対象（あっても「空」とみなすOS自動生成ファイル）
1. `.DS_Store`
2. `Thumbs.db` （大文字小文字を区別しない）
3. `desktop.ini` （大文字小文字を区別しない）
4. `.Trashes`
5. `._` で始まるファイル（アップルダブル形式の隠しメタデータファイル）

### 保護対象（存在した場合は「空ではない」と判定される例）
- `.env`, `.gitignore`, `.prettierrc`, `.eslintrc.json` などの各種設定ファイル
- `.git`, `.vscode`, `.idea` などの隠しディレクトリ
- その他上記ホワイトリストに含まれない全てのファイルおよびサブフォルダ

## 実施手順

### 1. `src/constants.rs` への定数追加
`IGNORED_METADATA_FILES` および `IGNORED_METADATA_PREFIXES` を定義します。

### 2. `src/main.rs` の `is_dir_empty_custom` 関数修正
`is_dir_empty_custom` 内のフィルター処理を、`constants.rs` の定数を参照したホワイトリスト判定に変更します。

```rust
fn is_dir_empty_custom(path: &std::path::Path) -> Result<bool, std::io::Error> {
    for entry in fs::read_dir(path)? {
        let entry = entry?;
        let file_name = entry.file_name();
        let file_name_str = file_name.to_string_lossy();

        // OS自動生成の不要メタデータ・キャッシュファイルのスキップ判定
        let is_ignored = constants::IGNORED_METADATA_FILES
            .iter()
            .any(|name| file_name_str.eq_ignore_ascii_case(name))
            || constants::IGNORED_METADATA_PREFIXES
                .iter()
                .any(|prefix| file_name_str.starts_with(prefix));

        if is_ignored {
            continue;
        }

        // 除外対象以外のファイルやフォルダが存在する場合は、空ではない
        return Ok(false);
    }
    Ok(true)
}
```

### 3. ユニットテスト (`test_is_dir_empty_custom`) の更新と追加
既存のユニットテストを新しい仕様に合わせて更新し、以下のパターンを網羅します。
- 完全な空フォルダ -> `true`
- `.DS_Store` のみ存在 -> `true`
- `Thumbs.db` や `desktop.ini` のみ存在 -> `true`
- `._test` (アップルダブル) のみ存在 -> `true`
- `.env` や `.gitignore` が存在 -> **`false`** （※旧実装では `true` になっていた部分の正常化）
- 通常のファイルが存在 -> `false`
- サブフォルダが存在 -> `false`

## 検証計画
- `cargo test test_is_dir_empty_custom` を実行し、全テストケースが正常にパスすることを確認する。
