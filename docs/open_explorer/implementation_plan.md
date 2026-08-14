# フォルダを開く機能（Ctrl+E）の実装計画

ユーザーの提案通り、ファイル操作を補完するためにOS標準のエクスプローラーでホームフォルダ（データ保存先）を開く機能を追加します。
現在の仕様ではファイルブラウザなどのUIが不足しているため、この機能は非常に実用的で良いアイデアです。

## 概要

`Ctrl + E` のショートカットキーを押した際に、NoCapEditのデータが保存されているホームディレクトリ（`nce` フォルダ）をOS標準のエクスプローラーで開く機能を実装します。

## 調査結果

1. `Ctrl + E` は現在どの機能にも割り当てられていないため、競合せず安全に使用できます。
2. ホームディレクトリのパスは、フロントエンドの `appState.homeFolder` に保持されています。
3. Tauriの `tauri.conf.json` にて `shell.open` APIが既に許可されているため、Rust側の追加実装なしにフロントエンドから直接呼び出すことが可能です。

## 実装内容

### 1. `src/dist/js/ui/shortcuts.js` の変更

- `window.__TAURI__.shell.open` APIをインポート、または利用してディレクトリを開く処理を追加します。
- `window.addEventListener('keydown', ...)` 内に `Ctrl + E` のハンドリングを追加します。
- 実行時に `appState.homeFolder` を参照し、そのパスをOS標準のエクスプローラーで開くようにします。

```javascript
// 追加する処理のイメージ
if (e.key === 'e' || e.key === 'E' || e.code === 'KeyE') {
    e.preventDefault();
    if (appState.homeFolder) {
        window.__TAURI__.shell.open(appState.homeFolder).catch(err => {
            console.error("エクスプローラーの起動に失敗しました:", err);
        });
    }
}
```

## User Review Required

- 上記の実装計画で進めてよろしいでしょうか？
- この機能はメニューなどのUI（画面上のボタン）にも追加したほうが良いでしょうか？それともまずはショートカットキー（Ctrl+E）のみの実装でよろしいでしょうか？（今回はショートカットキーのみを予定しています）

問題なければ、「作業開始」のご指示をお願いいたします。
