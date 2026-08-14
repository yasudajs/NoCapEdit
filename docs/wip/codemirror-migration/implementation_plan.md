# CodeMirror (v6) 移行計画

## 概要
現在 `<textarea>` と標準のブラウザ機能に依存しているエディタ部分を、高機能なエディタライブラリである **CodeMirror (v6)** に置き換えます。
これにより、タブごとの独立したUndo/Redo履歴の保持、数万行の巨大ファイルの高速描画、および今後の拡張（シンタックスハイライト、行番号表示など）の基盤が整います。

## User Review Required
> [!IMPORTANT]
> **ビルド環境（Vite）の導入について**
> CodeMirror (v6) は多数の細かいnpmパッケージで構成されており、従来の「HTMLから `<script src="...">` で直接読み込む」方法が困難です。
> そのため、フロントエンド側に**Node.js (npm) と Vite** を導入し、JSをバンドル（コンパイル）する構成に変更する必要があります。
> （Tauri側で `npm run build` をフックして自動ビルドするように `tauri.conf.json` を書き換えます）
> この「ビルド環境の導入」について許可をいただけますでしょうか？

## Open Questions
- **Viteのソースディレクトリ構成について**:
  現在フロントエンドのコードは `src/dist` に配置されていますが、Viteを導入するにあたり、開発用ソースコードを `src/frontend` (または `ui` など) に移動し、ビルド結果（コンパイル済みのファイル）を `src/dist` に出力する一般的な構成に変更してもよろしいでしょうか？

## 作業量の見積もり
**総見積もり: 中規模（修正とテスト含め、全体でスムーズにいけば1〜2時間程度の作業）**

主な作業は以下の3つのステップに分かれます。

1. **環境構築（Vite + npm導入）: 約15〜30分**
   - `package.json` の作成と必要なパッケージのインストール
   - `vite.config.js` の設定
   - `tauri.conf.json` のビルドコマンドの更新 (`beforeBuildCommand` の設定)
2. **CodeMirrorの組み込みとUI連携の修正: 約45〜60分**
   - `<textarea>` を `<div>` に置き換え。
   - `ui/editor.js` の全面改修（`textarea.value` ベースのロジックをCodeMirrorのAPIに書き換え）。
   - タブ（`ui/tabs.js`）の改修：テキスト文字列の代わりにCodeMirrorの `EditorState` オブジェクトをタブごとに保持させる（これによりタブごとの完全なUndo履歴が実現します）。
   - 設定（テーマ、フォント、Tabキーの挙動など）の連携ロジックをCodeMirrorの拡張（Extension）に書き換え。
3. **テスト・動作検証: 約20分**
   - 既存の文字数カウントやファイル保存ロジックとの結合テスト。
   - バグの洗い出しと修正。

## Proposed Changes

### ビルド環境
#### [NEW] `package.json`, `vite.config.js`
- npmプロジェクトとして初期化し、ViteとCodeMirror（`codemirror`, `@codemirror/state`, `@codemirror/view` 等）をインストール。

#### [MODIFY] `tauri.conf.json`
- `beforeBuildCommand` を `npm run build` に変更し、Tauriのビルド前にフロントエンドがコンパイルされるように設定。

### フロントエンド（HTML / CSS / JS）
#### [MODIFY] `index.html` (または移動先の `src/frontend/index.html`)
- `<textarea id="editor">` を `<div id="editor">` に変更。
- Viteの仕様に合わせて `<script type="module" src="/js/main.js"></script>` を設定。

#### [MODIFY] `js/ui/editor.js`
- CodeMirrorのインスタンス（`EditorView`）の初期化。
- テキストの取得や更新をCodeMirrorのAPI（`view.state.doc.toString()` や `view.dispatch`）に変更。

#### [MODIFY] `js/ui/tabs.js`
- 各タブオブジェクトに `EditorState` を持たせ、タブ切り替え時に CodeMirror の `view.setState()` で状態を丸ごと切り替えるロジックに変更。

#### [MODIFY] `js/ui/theme.js`, `settings.js`, `main.js`
- テーマ変更時にCodeMirrorのテーマ拡張を動的に切り替える仕組みを追加。

## Verification Plan

### Manual Verification
実装後、以下の手動テストを実施し、正常動作を確認します。
1. **テキスト編集とUndo/Redo**: テキストを入力し、Ctrl+Z/Ctrl+Y が正常に動作するか。
2. **タブ切り替え時の状態保持**: タブAで編集し、タブBに切り替えてからタブAに戻ったとき、タブAのUndo履歴が残っているか。
3. **Tabキーのインデント**: 設定した文字数（タブ文字 or スペース）でインデントが挿入・削除（Shift+Tab）できるか。
4. **テーマ変更**: ダーク・ライト等のテーマ切り替えがエディタ領域にも即座に反映されるか。
5. **保存と読み込み**: ファイルの読み書きが以前と同じように行えるか。
