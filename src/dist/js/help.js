import { applyI18nToDOM, t } from '../i18n.js';

// 初期化
document.addEventListener('DOMContentLoaded', () => {
    // 翻訳テキストの適用
    applyI18nToDOM();

    // ウィンドウタイトルの設定
    const titleText = t('help.title');
    if (titleText && window.__TAURI__) {
        window.__TAURI__.window.appWindow.setTitle(titleText).catch(console.error);
    }
});

// キーボードイベントの監視
window.addEventListener('keydown', (e) => {
    // Escキーでウィンドウを閉じる
    if (e.key === 'Escape' || e.code === 'Escape') {
        e.preventDefault();
        if (window.__TAURI__) {
            window.__TAURI__.window.appWindow.close();
        } else {
            window.close();
        }
    }
});
