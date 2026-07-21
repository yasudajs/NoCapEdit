# フェーズ 1-3: 正規表現コンパイルのキャッシュ化 (バックエンド)

バックエンド（Rust）におけるファイル操作時に発生する、正規表現コンパイルのオーバーヘッドを削減するための実装計画です。

## 提案する変更

Rustの標準機能である `std::sync::OnceLock` を用いて、`move_file_or_dir` および `copy_file_or_dir` 内で毎回実行されている `regex::Regex::new` を初回呼び出し時のみに制限します。

### バックエンド

#### [MODIFY] [main.rs](file:///c:/work/NoCapEdit/src/main.rs)

- `move_file_or_dir` 関数
  - 変更前: `let re = regex::Regex::new(r"_(\d{2})$").unwrap();`
  - 変更後:
    ```rust
    static RE: std::sync::OnceLock<regex::Regex> = std::sync::OnceLock::new();
    let re = RE.get_or_init(|| regex::Regex::new(r"_(\d{2})$").unwrap());
    ```

- `copy_file_or_dir` 関数
  - `move_file_or_dir` と同様に、関数内に `OnceLock` を用いた静的変数を定義し、正規表現インスタンスをキャッシュするよう修正します。

## 備考
- 外部クレート（`lazy_static`など）は追加せず、Rust標準機能のみで完結させるため、依存関係やビルド時間への悪影響はありません。

## Verification Plan

### Automated Tests
- Rustのビルド (`cargo check` または `cargo build`) が正常に通ることを確認します。

### Manual Verification
- ユーザーに手動テストを依頼し、同名ファイルが存在する状態での「ファイル移動」および「ファイルコピー」操作が、これまで通り連番を正しく付与して動作することを確認します。
