# 行間高さ調整機能の実装

エディタの行間の高さをショートカットキー（`Ctrl + Shift + +/-`）で動的に変更し、ステータスバーに現在の行間を表示する機能を追加します。
設定画面への追加は行わず、シームレスな操作感を目指します。

## Proposed Changes

### Backend (Rust)
#### [MODIFY] [main.rs](file:///c:/work/NoCapEdit/src/main.rs)
- `AppSettings` 構造体に `line_height: f32` を追加（デフォルト値: 1.6）。
- `SettingsResponse` 構造体に `line_height: f32` を追加し、フロントエンドに渡せるようにする。
- `get_settings` コマンドで `line_height` を返すように修正。
- `save_settings` コマンドの引数に `line_height` を追加し、設定を保存できるように修正。

---
### Frontend (JavaScript/CSS)
#### [MODIFY] [main.js](file:///c:/work/NoCapEdit/src/dist/main.js)
- 状態管理 `appState` に `lineHeight: 1.6` を追加。
- `init()` 処理にて、バックエンドから取得した `line_height` を `appState.lineHeight` に反映。
- `updateEditorMetrics()` 関数を修正し、ステータスバーの表示テキストを `` `Ln ${line}, Col ${col} | ${chars} chars | Font ${appState.fontSize} pt | LH ${appState.lineHeight.toFixed(1)}` `` のフォーマットに変更。
- キーボードイベントハンドラ (`window.addEventListener('keydown', ...)`) に `Ctrl + Shift + +/-` の条件分岐を追加し、`appState.lineHeight` の増減（0.1刻み、最小1.0〜最大3.0等）を実装。
- 新しく `applyLineHeight()` 関数を作成し、`elements.editor.style.lineHeight` の更新と、遅延保存関数 `saveSettingsDelay()` を呼び出す。

#### [MODIFY] [style.css](file:///c:/work/NoCapEdit/src/dist/style.css)
- ※ 変更不要。`.editor` クラスに定義されている `line-height: 1.6;` は JavaScript 側でインラインスタイルとして動的に上書きされるため、そのままデフォルトのフォールバックとして残します。

## Verification Plan

### Manual Verification
- アプリを起動し、初期状態で行間が 1.6 になっており、ステータスバーに `LH 1.6` と表示されることを確認する。
- `Ctrl + Shift + +` キーで行間が広がり（例: 1.7）、ステータスバーの LH 表示が更新されることを確認する。
- `Ctrl + Shift + -` キーで行間が狭まり、ステータスバーの LH 表示が更新されることを確認する。
- 変更後、アプリを再起動し、変更した行間設定が維持されていることを確認する。
