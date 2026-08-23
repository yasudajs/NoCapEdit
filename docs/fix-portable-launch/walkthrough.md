# ポータブル版起動不具合修正およびウィンドウ表示フェイルセーフ強化 ウォークスルー (Walkthrough)

## 概要
リリースビルド（ポータブル版 `NoCapEdit.exe`）において、フロントエンド初期化時のタイミング差によってウィンドウが表示されず、非表示のままバックグラウンドにプロセスが残留して以降の起動ができなくなる不具合を根本から修正いたしました。

---

## 修正内容

### 1. `tauri.js` の動的 Proxy / Getter 化 ([tauri.js](file:///c:/work/NoCapEdit/src/frontend/js/core/tauri.js))
- `window.__TAURI__` の評価をモジュール読み込み時ではなく**実行時（動的）に解決する Proxy / ラッパー**に改修。
- Webview2 でのスクリプト評価と Tauri API 注入の順序差に起因する `null` 参照バグを根本解決。

### 2. フロントエンド初期化のフェイルセーフ多重化 ([main.js](file:///c:/work/NoCapEdit/src/frontend/js/main.js))
- `DOMContentLoaded` の全体を `try - catch - finally` で保護し、最悪の例外発生時でも確実に `appWindow.show()` が呼ばれるよう多重化。

### 3. Rust 側の安全装置（タイマーフォールバック） ([main.rs](file:///c:/work/NoCapEdit/src/main.rs))
- フロントエンド側の通信が万が一遅延・失敗した場合の保険として、起動後 1.5 秒経過しても非表示のままなら Rust 側から自動で `window.show()` を実行するフェイルセーフスレッドを追加。

---

## 検証結果

- [x] **Vite ビルド**: `npm run build` 正常終了
- [x] **Rust リリースビルド**: `cargo build --release` 正常終了（Ver 0.2.9）
- [x] **ポータブル版 ZIP 生成**: `target/release/bundle/NoCapEdit_v0.2.9_x64_portable.zip`
- [x] **起動動作確認**: `tauri.js` の動的 Proxy 化および Rust 側フォールバックにより、プロセスが非表示で孤立する問題を完全に解消
