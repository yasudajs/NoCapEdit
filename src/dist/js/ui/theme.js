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

export async function loadSystemFonts() {
    if (!elements.fontFamilySelectModal) return;
    if (appState.fontsLoaded || appState.fontsLoading) return;

    try {
        if (!ensureTauriApi()) return;
        appState.fontsLoading = true;
        updateStatus(window.t('status.loading.fonts'));
        const fonts = await invoke('get_system_fonts');

        while (elements.fontFamilySelectModal.options.length > 1) {
            elements.fontFamilySelectModal.remove(1);
        }

        const monoGroup = document.createElement('optgroup');
        monoGroup.label = window.t('settings.font.group.monospace');

        const otherGroup = document.createElement('optgroup');
        otherGroup.label = window.t('settings.font.group.other');

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

        elements.fontFamilySelectModal.value = appState.fontFamily;
        appState.fontsLoaded = true;
        updateStatus(window.t('status.ready'));
    } catch (error) {
        console.error('Failed to load system fonts:', error);
        updateStatus(window.t('status.error.font.load'), 'error');
    } finally {
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
