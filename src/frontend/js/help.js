import { applyI18nToDOM, t } from '../i18n.js';
import { invoke, listen, appWindow } from './core/tauri.js';

const VALID_THEMES = ['dark', 'soft-dark', 'light'];

// テーマの適用（DOMクラスおよびネイティブタイトルバー）
function applyTheme(theme) {
    const validTheme = VALID_THEMES.includes(theme) ? theme : 'dark';
    document.body.classList.remove('light-theme', 'soft-dark-theme');
    if (validTheme === 'light') {
        document.body.classList.add('light-theme');
    } else if (validTheme === 'soft-dark') {
        document.body.classList.add('soft-dark-theme');
    }

    if (invoke) {
        invoke('apply_theme', { theme: validTheme }).catch((err) => {
            console.error('Failed to apply theme to help window:', err);
        });
    }
}

// 初期化
document.addEventListener('DOMContentLoaded', () => {
    // 翻訳テキストの適用
    applyI18nToDOM();

    // ウィンドウタイトルの設定
    const titleText = t('help.title');
    if (titleText && appWindow && typeof appWindow.setTitle === 'function') {
        appWindow.setTitle(titleText).catch(console.error);
    }

    // テーマの初期適用
    const urlParams = new URLSearchParams(window.location.search);
    const themeParam = urlParams.get('theme');
    applyTheme(themeParam);

    // テーマ変更イベントの監視（リアルタイム同期）
    if (listen) {
        listen('theme-changed', (event) => {
            if (event && event.payload && event.payload.theme) {
                applyTheme(event.payload.theme);
            }
        }).catch((err) => {
            console.error('Failed to listen to theme-changed event in help window:', err);
        });
    }

    // リポジトリリンクのクリック（既定のWebブラウザで開く）
    const repoLink = document.getElementById('repoLink');
    if (repoLink) {
        repoLink.addEventListener('click', (e) => {
            e.preventDefault();
            const url = repoLink.getAttribute('href');
            if (window.__TAURI__ && window.__TAURI__.shell && typeof window.__TAURI__.shell.open === 'function') {
                window.__TAURI__.shell.open(url).catch(console.error);
            } else {
                window.open(url, '_blank');
            }
        });
    }
});

// キーボードイベントの監視
window.addEventListener('keydown', (e) => {
    // Escキーでウィンドウを閉じる
    if (e.key === 'Escape' || e.code === 'Escape') {
        e.preventDefault();
        if (appWindow && typeof appWindow.close === 'function') {
            appWindow.close();
        } else {
            window.close();
        }
    }
});
