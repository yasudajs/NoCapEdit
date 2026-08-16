import { t } from '../../i18n.js';
import { appState, elements, DEFAULT_MONOSPACE_FONTS } from '../state.js';
import { invoke, ensureTauriApi } from '../core/tauri.js';
import { updateStatus } from './tabs.js';

export function applyThemeUI(theme) {
    document.body.classList.remove('light-theme', 'soft-dark-theme');
    if (theme === 'light') {
        document.body.classList.add('light-theme');
    } else if (theme === 'soft-dark') {
        document.body.classList.add('soft-dark-theme');
    }
    if (elements.themeSelectModal) {
        elements.themeSelectModal.value = theme;
    }
}

export async function loadSystemFonts(openPicker = false) {
    if (!elements.fontFamilySelectModal) return;
    if (appState.fontsLoaded || appState.fontsLoading) return;

    const previousFontFamily = appState.fontFamily;

    try {
        if (!ensureTauriApi()) return;
        appState.fontsLoading = true;

        // セレクトボックス内にローディング用プレースホルダーを表示し、操作ガード
        elements.fontFamilySelectModal.classList.add('loading');
        elements.fontFamilySelectModal.innerHTML = '';
        const loadingOption = document.createElement('option');
        loadingOption.value = '__loading__';
        loadingOption.textContent = t('settings.font.loading');
        loadingOption.selected = true;
        loadingOption.disabled = true;
        elements.fontFamilySelectModal.appendChild(loadingOption);

        updateStatus(t('status.loading.fonts'));
        const fonts = await invoke('get_system_fonts');

        elements.fontFamilySelectModal.innerHTML = '';

        const defaultOption = document.createElement('option');
        defaultOption.value = 'default';
        defaultOption.textContent = t('ui.dialog.settings.font.default');
        elements.fontFamilySelectModal.appendChild(defaultOption);

        const monoGroup = document.createElement('optgroup');
        monoGroup.label = t('settings.font.group.monospace');

        const otherGroup = document.createElement('optgroup');
        otherGroup.label = t('settings.font.group.other');

        fonts.forEach(font => {
            const option = document.createElement('option');
            option.value = font.family;
            option.textContent = font.family;

            if (font.is_monospace) {
                monoGroup.appendChild(option);
            } else {
                otherGroup.appendChild(option);
            }
        });

        if (monoGroup.children.length > 0) {
            elements.fontFamilySelectModal.appendChild(monoGroup);
        }
        if (otherGroup.children.length > 0) {
            elements.fontFamilySelectModal.appendChild(otherGroup);
        }

        elements.fontFamilySelectModal.value = previousFontFamily || 'default';
        appState.fontsLoaded = true;
        updateStatus(t('status.ready'));

        // 読み込み完了後にドロップダウンを展開
        if (openPicker) {
            setTimeout(() => {
                try {
                    if (typeof elements.fontFamilySelectModal.showPicker === 'function') {
                        elements.fontFamilySelectModal.showPicker();
                    }
                } catch (err) {
                    console.warn('Could not open select picker automatically:', err);
                }
            }, 50);
        }
    } catch (error) {
        console.error('Failed to load system fonts:', error);
        updateStatus(t('status.error.font.load'), 'error');

        // エラー時は元の選択肢（デフォルトまたは設定フォント）を復元
        elements.fontFamilySelectModal.innerHTML = '';
        const defaultOption = document.createElement('option');
        defaultOption.value = 'default';
        defaultOption.textContent = t('ui.dialog.settings.font.default');
        elements.fontFamilySelectModal.appendChild(defaultOption);

        if (previousFontFamily && previousFontFamily !== 'default') {
            const option = document.createElement('option');
            option.value = previousFontFamily;
            option.textContent = previousFontFamily;
            option.selected = true;
            elements.fontFamilySelectModal.appendChild(option);
        }
        elements.fontFamilySelectModal.value = previousFontFamily || 'default';
    } finally {
        elements.fontFamilySelectModal.classList.remove('loading');
        appState.fontsLoading = false;
    }
}

export function applyFontFamily() {
    if (appState.fontFamily === 'default' || !appState.fontFamily) {
        document.documentElement.style.setProperty('--editor-font-family', DEFAULT_MONOSPACE_FONTS);
    } else {
        document.documentElement.style.setProperty('--editor-font-family', `"${appState.fontFamily}", ${DEFAULT_MONOSPACE_FONTS}`);
    }
}

