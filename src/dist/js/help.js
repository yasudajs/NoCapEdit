import { applyI18nToDOM, t } from '../i18n.js';

const VALID_THEMES = ['dark', 'soft-dark', 'light'];

// 初期化
document.addEventListener('DOMContentLoaded', () => {
    // 翻訳テキストの適用
    applyI18nToDOM();

    // ウィンドウタイトルの設定
    const titleText = t('help.title');
    if (titleText && window.__TAURI__) {
        window.__TAURI__.window.appWindow.setTitle(titleText).catch(console.error);
    }

    // テーマの適用
    const urlParams = new URLSearchParams(window.location.search);
    const themeParam = urlParams.get('theme');
    const theme = VALID_THEMES.includes(themeParam) ? themeParam : 'dark';

    if (theme === 'light') {
        document.body.classList.add('light-theme');
    } else if (theme === 'soft-dark') {
        document.body.classList.add('soft-dark-theme');
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
