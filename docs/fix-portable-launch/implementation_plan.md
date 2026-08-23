# [実装計画] ポータブル版起動不具合の修正とウィンドウ表示フォールバック強化

## 1. 概要
リリースビルド（ポータブル版 `NoCapEdit.exe`）において、フロントエンド初期化時のタイミングによりウィンドウが表示（`show()`）されず、非表示のままプロセスがバックグラウンドに残留して以降の起動ができなくなる不具合を根本から修正します。

---

## 2. 原因と修正方針

### 原因
1. **`tauri.js` の静的参照問題**:
   - `src/frontend/js/core/tauri.js` では、モジュール読み込み時点（トップレベル）で `const tauriApi = window.__TAURI__ || null;` を評価し、各APIを定数としてエクスポートしていました。
   - リリース版において、Webview2 で `window.__TAURI__` が注入される前にモジュールが評価されると、すべての API 参照が `null` に固定化され、初期化処理および `appWindow.show()` が失敗していました。
2. **非表示プロセスの残留と多重起動防止のブロック**:
   - ウィンドウが非表示（`.visible(false)`）のままプロセスが生存し、2回目以降のダブルクリックでは多重起動防止機能が働いて即座に終了（`exit(0)`）するため、「エラーも出ず何も起きない」状態となっていました。

### 修正方針
1. **`tauri.js` の動的 Proxy / Getter 化**:
   - 各 API（`invoke`, `appWindow`, `openDialog`, `saveDialog`, `listen`, `emit`）を、呼び出し時に動的に `window.__TAURI__` から取得する構造に改修します。
2. **フロントエンド初期化フローの安全性向上 (`main.js`)**:
   - `init()` の完了時だけでなく、初期化エラー時や最悪の例外発生時でも確実に `window.__TAURI__?.window?.appWindow?.show()` が呼ばれるようフェイルセーフを多重化します。
3. **Rust 側でのフォールバック表示 (`main.rs`)**:
   - フロントエンド側の通信が万が一遅延・失敗した場合でもプロセスが非表示のまま孤立しないよう、Rust 側から安全にウィンドウを表示するタイマー/フォールバック処理を追加します。

---

## 3. 変更対象ファイル

### [MODIFY] [tauri.js](file:///c:/work/NoCapEdit/src/frontend/js/core/tauri.js)
- `window.__TAURI__` へのアクセスを実行時（動的）に解決する Proxy / ラッパー関数に刷新。

### [MODIFY] [main.js](file:///c:/work/NoCapEdit/src/frontend/js/main.js)
- `init()` 内の `appWindow.show()` 呼び出しと例外ハンドリングの強化。

### [MODIFY] [main.rs](file:///c:/work/NoCapEdit/src/main.rs)
- ウィンドウ生成後のフェイルセーフ表示制御の追加。

---

## 4. バージョン管理と履歴
- 修正後のバージョン: `0.2.9`
- `docs/history.md` に Ver 0.2.9 として記録

---

## 5. 検証計画

### 動作確認手順
1. `npm run build` および `cargo build --release` を実行
2. 生成された `target/release/NoCapEdit.exe` を直接ダブルクリックで起動し、即座にウィンドウが表示されることを確認
3. アプリを終了後、再度ダブルクリックして正常に起動することを確認
4. タスクマネージャーに不要なゾンビプロセスが残らないことを確認
