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

    // テーマの適用
    console.log("[help.js] window.location.href:", window.location.href);
    console.log("[help.js] window.location.search:", window.location.search);
    const urlParams = new URLSearchParams(window.location.search);
    const theme = urlParams.get('theme');
    console.log("[help.js] URLから取得したtheme:", theme);

    if (theme === 'light') {
        document.body.classList.add('light-theme');
        console.log("[help.js] light-theme クラスを適用しました");
    } else if (theme === 'soft-dark') {
        document.body.classList.add('soft-dark-theme');
        console.log("[help.js] soft-dark-theme クラスを適用しました");
    } else {
        console.log("[help.js] デフォルトのダークテーマ（クラス付与なし）となります");
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
