import { increaseLineHeight, decreaseLineHeight, zoomIn, zoomOut, resetZoomAndLineHeight, moveLine, duplicateLine, deleteLine, insertTimestamp } from './editor.js';
import { triggerManualSave } from '../core/fileSystem.js';
import { switchTabByOffset, createNewTab, closeTab } from './tabs.js';
import { toggleSettingsDialog } from './settings.js';
import { appState } from '../state.js';
import { appWindow } from '../core/tauri.js';

export function setupKeyboardShortcuts() {
    // Ctrl + マウスホイールでフォントサイズ拡大縮小、Ctrl + Shift + マウスホイールで行間調整
    window.addEventListener('wheel', (e) => {
        if (e.ctrlKey) {
            e.preventDefault();
            if (e.shiftKey) {
                if (e.deltaY < 0) {
                    increaseLineHeight();
                } else if (e.deltaY > 0) {
                    decreaseLineHeight();
                }
            } else {
                if (e.deltaY < 0) {
                    zoomIn();
                } else if (e.deltaY > 0) {
                    zoomOut();
                }
            }
        }
    }, { passive: false });

    // 各種ショートカットキー監視
    window.addEventListener('keydown', async (e) => {
        // IME入力・変換中はショートカットを処理しない
        if (e.isComposing) {
            return;
        }

        // F5 キーで現在日時を挿入（Windowsメモ帳互換）
        if ((e.key === 'F5' || e.code === 'F5') && !e.ctrlKey && !e.altKey && !e.metaKey) {
            e.preventDefault();
            insertTimestamp();
            return;
        }

        // F1 キーでヘルプ画面（ショートカット一覧）を開く
        if (e.key === 'F1' || e.code === 'F1') {
            e.preventDefault();
            if (window.__TAURI__) {
                console.log("[shortcuts.js] F1キー押下. appState.theme:", appState.theme);
                const { WebviewWindow } = window.__TAURI__.window;
                const existingWindow = WebviewWindow.getByLabel('help_screen');
                if (existingWindow) {
                    console.log("[shortcuts.js] 既存のヘルプウィンドウにフォーカスします");
                    existingWindow.setFocus();
                } else {
                    const helpUrl = `help.html?theme=${appState.theme || 'dark'}`;
                    console.log("[shortcuts.js] 新規ヘルプウィンドウを作成します. URL:", helpUrl);
                    new WebviewWindow('help_screen', {
                        url: helpUrl,
                        title: 'ショートカット一覧',
                        width: 600,
                        height: 700,
                        resizable: true,
                        center: true
                    });
                }
            }
            return;
        }

        // Alt キーを使用したショートカット（行移動・行複製）
        if (e.altKey && !e.ctrlKey) {
            if (e.shiftKey) {
                // 行の上下複製: Alt + Shift + ↑ / ↓
                if (e.key === 'ArrowUp' || e.code === 'ArrowUp') {
                    e.preventDefault();
                    duplicateLine('up');
                    return;
                } else if (e.key === 'ArrowDown' || e.code === 'ArrowDown') {
                    e.preventDefault();
                    duplicateLine('down');
                    return;
                }
            } else {
                // 行の上下移動: Alt + ↑ / ↓
                if (e.key === 'ArrowUp' || e.code === 'ArrowUp') {
                    e.preventDefault();
                    moveLine('up');
                    return;
                } else if (e.key === 'ArrowDown' || e.code === 'ArrowDown') {
                    e.preventDefault();
                    moveLine('down');
                    return;
                }
            }
        }

        // Ctrl + Shift + K で行削除
        if (e.ctrlKey && e.shiftKey && !e.altKey) {
            if (e.key === 'k' || e.key === 'K' || e.code === 'KeyK') {
                e.preventDefault();
                deleteLine();
                return;
            }
        }

        // Ctrl + Tab / Ctrl + Shift + Tab でタブ切り替え
        if (e.key === 'Tab' && e.ctrlKey) {
            e.preventDefault();
            await switchTabByOffset(e.shiftKey ? -1 : 1);
            return;
        }

        if (e.ctrlKey) {
            // Ctrl + R によるリロードを禁止 (Shiftキーが同時に押されている場合も含む)
            if (e.key === 'r' || e.key === 'R' || e.code === 'KeyR') {
                e.preventDefault();
                return;
            }
            // Ctrl + P による印刷を禁止
            if (e.key === 'p' || e.key === 'P' || e.code === 'KeyP') {
                e.preventDefault();
                return;
            }

            // Shift キーが押されている場合は行間の変更
            if (e.shiftKey) {
                if (e.code === 'NumpadAdd' || e.code === 'Equal' || e.code === 'Semicolon' || e.key === '+') {
                    e.preventDefault();
                    increaseLineHeight();
                } else if (e.code === 'Minus' || e.code === 'NumpadSubtract' || e.key === '-' || e.key === '_') {
                    e.preventDefault();
                    decreaseLineHeight();
                }
                return;
            }

            // 拡大条件
            if (e.key === '+' || e.key === '=' || e.key === ';' || e.code === 'NumpadAdd' || e.code === 'Equal' || (e.code === 'Semicolon' && e.shiftKey)) {
                e.preventDefault();
                zoomIn();
            }
            // 縮小条件
            else if (e.key === '-' || e.key === '_' || e.code === 'NumpadSubtract' || e.code === 'Minus') {
                e.preventDefault();
                zoomOut();
            }
            // ズーム・行間リセット: "0" キー（メインキーおよびテンキー）
            else if (e.key === '0' || e.code === 'Digit0' || e.code === 'Numpad0') {
                e.preventDefault();
                resetZoomAndLineHeight();
            }
            // 設定画面の開閉: "," (カンマ) キー
            else if (e.key === ',' || e.code === 'Comma') {
                e.preventDefault();
                toggleSettingsDialog();
            }
            // 手動保存: "s" / "S" キー
            else if (e.key === 's' || e.key === 'S' || e.code === 'KeyS') {
                e.preventDefault();
                triggerManualSave();
            }
            // 新規タブ追加: "t" / "T" キー
            else if (e.key === 't' || e.key === 'T' || e.code === 'KeyT') {
                e.preventDefault();
                createNewTab();
            }
            // タブを閉じる: "w" / "W" キー
            else if (e.key === 'w' || e.key === 'W' || e.code === 'KeyW') {
                e.preventDefault();
                if (appState.currentTab) {
                    await closeTab(appState.currentTab);
                }
            }
            // アプリケーション終了: "q" / "Q" キー
            else if (e.key === 'q' || e.key === 'Q' || e.code === 'KeyQ') {
                e.preventDefault();
                if (appWindow && typeof appWindow.close === 'function') {
                    await appWindow.close();
                }
            }
            // エクスプローラーを開く: "e" / "E" キー
            else if (e.key === 'e' || e.key === 'E' || e.code === 'KeyE') {
                e.preventDefault();
                if (appState.homeFolder) {
                    window.__TAURI__.shell.open(appState.homeFolder).catch(err => {
                        console.error("エクスプローラーの起動に失敗しました:", err);
                    });
                }
            }
        }
    });
}
