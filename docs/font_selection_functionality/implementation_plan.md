# エディタのフォント変更機能の実装計画 (改訂版)

エディタにフォントの変更機能を実装し、OSにインストールされているシステムフォントの一覧から自由に選択できるようにします。デフォルトは現在のmonospace設定のままとし、設定したフォントは永続化されます。

## ユーザーレビューが必要な項目

> [!NOTE]
> - **システムフォントの動的取得**: 
>   - Rustの `fontdb` クレートを追加し、OSのフォントフォルダからフォントを読み込みます。
>   - フォント情報から「等幅フォント (Monospace)」かどうかを判別し、UI側で整理して表示します。
> - **UIでのフォント一覧表示**:
>   - システム内のフォントは数が非常に多いため、ドロップダウンメニュー内を `<optgroup>` で区切り、「等幅フォント」を上部に、それ以外の「プロポーショナルフォント」を下部にまとめて表示することで、エディタに最適なフォントを見つけやすくします。
> - **配置場所**:
>   - ご指示の通り、タブバーの右側（テーマ切り替えボタンの左側）にフォント選択用のドロップダウンを配置します。

---

## 提案される変更

### 依存関係の追加

#### [MODIFY] [Cargo.toml](file:///c:/work/NoCapEdit/Cargo.toml)
- `dependencies` セクションに `fontdb = "0.16"` を追加します。（C言語ライブラリへの依存がなく、Pure Rustでマルチプラットフォームに対応している軽量なフォントスキャンライブラリです）

---

### バックエンド (Rust)

#### [MODIFY] [main.rs](file:///c:/work/NoCapEdit/src/main.rs)
- `AppSettings` 構造体および `SettingsResponse` 構造体に `font_family: String` フィールドを追加します。
- `default_font_family() -> String` を定義し、デフォルト値として現在の CSS で指定されているフォント名（例えば `"monospace"`）を返すようにします。
- `get_settings` および `save_settings` を修正し、`font_family` も一緒に保存・読み込みできるようにします。
- システムフォントを列挙して返す新しい Tauri コマンド `get_system_fonts` を定義します。
  - `fontdb::Database` を用いてシステムフォントをスキャン。
  - 各フォントの「ファミリー名 (family_name)」と「等幅フォント判定 (is_monospace)」を取得してフロントエンドに返却します。
  - レスポンス構造の定義：
    ```rust
    #[derive(Serialize)]
    struct SystemFontInfo {
        family: String,
        is_monospace: bool,
    }
    ```

---

### フロントエンド (HTML / CSS / JS)

#### [MODIFY] [index.html](file:///c:/work/NoCapEdit/src/dist/index.html)
- タブバー（`class="tab-bar"`）の中のテーマ切り替えボタンの左側に、フォント選択用のセレクトボックスを追加します。
```html
<select id="fontFamilySelect" class="font-select" title="フォントを変更">
    <!-- JSから動的に <optgroup> を生成してシステムフォントを挿入します -->
    <option value="default">デフォルト (Monospace)</option>
</select>
```

#### [MODIFY] [style.css](file:///c:/work/NoCapEdit/src/dist/style.css)
- `.font-select` クラスを追加し、ドロップダウンリストのスタイリングを行います。
- 他のUI要素と調和するよう、ダークモード・ライトモードそれぞれに適した背景色、境界線、フォント、余白を定義します。セレクトボックス幅が広くなりすぎないよう調整します。

#### [MODIFY] [main.js](file:///c:/work/NoCapEdit/src/dist/main.js)
- `appState` に `fontFamily` を追加します（デフォルト: `'default'`).
- `init()` 内で設定から取得した `font_family` を適用します。
- `init()` の初期化プロセス中、もしくはアプリ起動完了後に `get_system_fonts` を呼び出し、取得したフォント一覧からドロップダウンの選択肢を動的に構築します。
  - `is_monospace` が `true` のフォントを「等幅フォント」グループ (`<optgroup label="等幅フォント">`) に配置。
  - それ以外を「その他のフォント」グループ (`<optgroup label="その他のフォント">`) に配置。
  - 重複するファミリー名を排除（ソートとデデュプ）して登録します。
- セレクトボックスの `change` イベントハンドラを追加し、選択されたフォント名を `appState.fontFamily` にセット、エディタ (`#editor`) の `style.fontFamily` を更新したうえで、`save_settings` を呼び出して即時（または遅延）保存します。
- `applyFontFamily()` 関数を追加し、エディタに適切なフォントファミリーを反映するロジックを実装します。

---

## 検証計画

### 自動テスト
- `cargo test` を実行し、既存のテストおよび設定追加に伴う変更が正常にビルド・通過することを確認します。

### 手動検証
1. アプリを起動し、フォント選択ドロップダウンにOSのシステムフォント（例: Windowsであれば "Consolas", "MS Gothic", "Meiryo", "Arial" など）が自動的に読み込まれていることを確認します。
2. 「等幅フォント」と「その他のフォント」に正しくグループ分けされていることを確認します。
3. ドロップダウンからフォントを切り替えた際、エディタのテキストのフォントが即座に切り替わることを確認します。
4. テーマを切り替えても、ドロップダウンのスタイルが崩れず綺麗に表示されることを確認します。
5. アプリを再起動し、前回選択したフォントが維持されて適用されることを確認します。
