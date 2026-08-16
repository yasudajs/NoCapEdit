import { appState } from '../state.js';
import { invoke, ensureTauriApi } from './tauri.js';

let settingsSaveTimer = null;

export async function saveApplicationSettings() {
    if (!ensureTauriApi() || !appState.homeFolder) {
        return;
    }
    try {
        await invoke('save_settings', {
            settings: {
                home_folder: appState.homeFolder,
                theme: appState.theme,
                font_size: appState.savedFontSize || appState.fontSize,
                font_family: appState.fontFamily,
                line_height: appState.savedLineHeight || appState.lineHeight,
                tab_behavior: appState.tabBehavior,
                save_mode: appState.saveMode,
                char_count_mode: appState.charCountMode,
                word_wrap: appState.wordWrap
            }
        });
    } catch (error) {
        console.error('Failed to save settings:', error);
    }
}

export function saveSettingsDelay() {
    clearTimeout(settingsSaveTimer);
    settingsSaveTimer = setTimeout(async () => {
        await saveApplicationSettings();
    }, 1000);
}
