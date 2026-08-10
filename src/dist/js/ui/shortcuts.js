import { increaseLineHeight, decreaseLineHeight, zoomIn, zoomOut } from './editor.js';
import { triggerManualSave } from '../core/fileSystem.js';
import { switchTabByOffset } from './tabs.js';

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
        // F5 キーによるリロードを禁止
        if (e.key === 'F5' || e.code === 'F5') {
            e.preventDefault();
            return;
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
            // 手動保存: "s" / "S" キー
            else if (e.key === 's' || e.key === 'S' || e.code === 'KeyS') {
                e.preventDefault();
                triggerManualSave();
            }
        }
    });
}
