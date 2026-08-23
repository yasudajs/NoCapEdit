import { increaseLineHeight, decreaseLineHeight, zoomIn, zoomOut, resetZoomAndLineHeight, toggleWordWrap } from './editor.js';
import { triggerManualSave } from '../core/fileSystem.js';
import { switchTabByOffset, createNewTab, closeTab } from './tabs.js';
import { toggleSettingsDialog } from './settings.js';
import { openFind, closeFind, isFindWidgetOpen } from './findReplace.js';
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

        // Esc キーで検索バーを閉じる
        if (e.key === 'Escape' || e.code === 'Escape') {
            if (isFindWidgetOpen()) {
                e.preventDefault();
                closeFind();
                return;
            }
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

        // 行の折り返し切り替え: Alt + Z
        if (e.altKey && !e.ctrlKey && !e.shiftKey) {
            if (e.key === 'z' || e.key === 'Z' || e.code === 'KeyZ') {
                e.preventDefault();
                toggleWordWrap();
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
            if (e.key === '+' || e.key === '=' || e.key === ';' || e.code === 'NumpadAdd' || e.code === 'Equal') {
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
            // 検索バーを開く: "f" / "F" キー
            else if (e.key === 'f' || e.key === 'F' || e.code === 'KeyF') {
                e.preventDefault();
                openFind(false);
            }
            // 置換バーを開く: "h" / "H" キー
            else if (e.key === 'h' || e.key === 'H' || e.code === 'KeyH') {
                e.preventDefault();
                openFind(true);
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
