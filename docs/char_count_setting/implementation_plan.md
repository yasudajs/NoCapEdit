# 文字数カウント設定機能の実装計画

設定画面に「文字数カウント」の項目を追加し、カウント方法を「改行を含む（デフォルト）」または「文字数のみ（改行を除く）」から選択し、設定ファイル（`config.json`）に保存・適用できるようにします。

## User Review Required

> [!NOTE]
> - **デフォルト設定**: 起動時および初回設定時のデフォルト値は「改行を含む（デフォルト）」とします。
> - **設定値の形式**:
>   - `with_newline` : 改行を含めてカウントする（デフォルト）
>   - `no_newline` : 文字数のみ（改行を除く）

## Proposed Changes

### バックエンド

#### [MODIFY] [main.rs](file:///c:/work/NoCapEdit/src/main.rs)
- **`AppSettings` および `SettingsResponse` 構造体**:
  - `char_count_mode: String` フィールドを追加します。
  - デフォルト値を生成する `default_char_count_mode()` ヘルパー関数を定義します。
- **`save_settings` コマンド**:
  - 引数に `char_count_mode: String` を追加し、構造体へ保存します。

### フロントエンド

#### [MODIFY] [index.html](file:///c:/work/NoCapEdit/src/dist/index.html)
- 設定ダイアログ（`#settingsDialog`）内の「保存モード」の下などに、文字数カウント方法を選択するためのセレクトボックスを追加します。
  ```html
  <label for="charCountModeSelectModal">文字数カウント:</label>
  <select id="charCountModeSelectModal" class="tab-select" title="文字数カウント方法を変更">
      <option value="with_newline">改行を含む（デフォルト）</option>
      <option value="no_newline">文字数のみ（改行を除く）</option>
  </select>
  ```

#### [MODIFY] [main.js](file:///c:/work/NoCapEdit/src/dist/main.js)
- **`appState` への追加**:
  - `charCountMode: null` フィールドを追加します。
- **`elements` へのキャッシュ追加**:
  - `charCountModeSelectModal: document.getElementById('charCountModeSelectModal')` を追加します。
- **`init()` 関数の修正**:
  - バックエンドから取得した `char_count_mode` を `appState.charCountMode` に同期し、セレクトボックスの初期選択値に反映させます。
- **`showSettingsDialog()` 関数の修正**:
  - 設定ダイアログ表示時に現在の `appState.charCountMode` をセレクトボックスに同期します。
- **`saveSettings()` および `saveSettingsDelay()` 関数の修正**:
  - セレクトボックスから選択された値を設定保存コマンド（`save_settings`）に渡します。
  - 設定変更時に `updateEditorMetrics()` を呼び出して、即座にステータスバー表示を更新します。
- **`setupUIEventListeners()` へのイベントリスナー追加**:
  - `charCountModeSelectModal` の変更イベントを監視し、変更されたら `appState.charCountMode` を更新して `saveSettingsDelay()` および `updateEditorMetrics()` を呼び出します。
- **`updateEditorMetrics()` の文字数カウント処理の分岐**:
  - `appState.charCountMode` が `"no_newline"` の場合は改行を除外した引き算方式でカウントします。
  - それ以外（`"with_newline"`）の場合は、従来の全体長（`length`）でカウントします。
  - 選択範囲の文字数（`selectedChars`）についても同様に分岐させます。

---

## Verification Plan

### Automated Tests
- 自動テストはないため、手動検証で動作を確認します。

### Manual Verification
1. **初期起動時のデフォルト確認**
   - 初回起動時、または設定が未保存の状態で、文字数カウントが「改行を含む（デフォルト）」で動作し、改行が文字数に含まれていることを確認。
2. **設定画面からの設定変更とリアルタイム反映**
   - 設定画面で「文字数のみ（改行を除く）」に変更し「OK」を押した際、即座にステータスバーの文字数表示から改行文字が引かれ、文字数のみになること。
   - 逆に「改行を含む」に戻した際にも、即座に改行込みのカウントに戻ること。
3. **設定の永続化確認**
   - 設定変更後にアプリを再起動し、変更した「文字数のみ」または「改行を含む」の設定が正しく保持されていること。
4. **選択範囲での挙動確認**
   - 設定が「文字数のみ」の時、改行を含むテキストを選択した場合に、選択範囲の文字数カウントでも改行が除外されて表示されること。
   - 設定が「改行を含む」の時、改行を含むテキストを選択した場合に、選択範囲の文字数カウントにも改行が含まれること。
