import { appState, elements, savedEditorCursor, setSavedEditorCursor, DEFAULT_MONOSPACE_FONTS } from '../state.js';
import { invoke, openDialog, ensureTauriApi, appWindow } from '../core/tauri.js';
import { updateStatus, renderTabs, createNewTab, getCurrentTab, updateTabStatus } from './tabs.js';
import { updateEditorMetrics } from './editor.js';
import { autoSave, shouldDeleteEmptyFile } from '../core/fileSystem.js';


let settingsSaveTimer = null;

export function toggleSettingsDialog() {
    if (elements.settingsDialog.classList.contains('hidden')) {
        openSettingsDialog(false);
    } else {
        closeSettingsDialog();
    }
}

export function closeSettingsDialog() {
    if (!elements.settingsDialog) return;
    elements.settingsDialog.classList.add('hidden');
    if (elements.settingsBtn) {
        elements.settingsBtn.classList.remove('open');
    }

    if (savedEditorCursor !== null && elements.editor) {
        elements.editor.focus();
        elements.editor.selectionStart = savedEditorCursor.selectionStart;
        elements.editor.selectionEnd = savedEditorCursor.selectionEnd;
        elements.editor.scrollTop = savedEditorCursor.scrollTop;
        setSavedEditorCursor(null);
    }
}

export function openSettingsDialog(isMissingFolder = false) {
    if (elements.editor) {
        setSavedEditorCursor({
            selectionStart: elements.editor.selectionStart || 0,
            selectionEnd: elements.editor.selectionEnd || 0,
            scrollTop: elements.editor.scrollTop || 0,
        });
    }

    if (elements.homeFolderInput) {
        elements.homeFolderInput.value = appState.homeFolder || '';
    }
    if (elements.tabBehaviorSelectModal) {
        elements.tabBehaviorSelectModal.value = appState.tabBehavior;
    }
    if (elements.saveModeSelectModal) {
        elements.saveModeSelectModal.value = appState.saveMode || 'auto';
    }
    if (elements.charCountModeSelectModal) {
        elements.charCountModeSelectModal.value = appState.charCountMode || 'with_newline';
    }
    if (elements.folderHint) {
        elements.folderHint.textContent = isMissingFolder
            ? window.t('settings.folder.hint.missing')
            : window.t('settings.folder.hint.default');
    }
    
    if (elements.settingsDialog) {
        elements.settingsDialog.classList.remove('hidden');
    }
    if (elements.settingsBtn && !isMissingFolder) {
        elements.settingsBtn.classList.add('open');
    }

    if (elements.browseFolderBtn) {
        elements.browseFolderBtn.onclick = async () => {
            if (!openDialog) {
                return;
            }

            try {
                const selected = await openDialog({ directory: true, multiple: false });
                if (typeof selected === 'string' && selected.trim() !== '') {
                    if (elements.homeFolderInput) {
                        elements.homeFolderInput.value = selected;
                    }
                    await saveSettings();
                }
            } catch (error) {
                console.error('Folder browse failed:', error);
            }
        };
    }
}

export async function saveApplicationSettings() {
    if (!ensureTauriApi() || !appState.homeFolder) {
        return;
    }
    try {
        await invoke('save_settings', {
            settings: {
                home_folder: appState.homeFolder,
                theme: appState.theme,
                font_size: appState.fontSize,
                font_family: appState.fontFamily,
                line_height: appState.lineHeight,
                tab_behavior: appState.tabBehavior,
                save_mode: appState.saveMode,
                char_count_mode: appState.charCountMode
            }
        });
    } catch (error) {
        console.error('Failed to save settings:', error);
    }
}

export async function saveSettings() {
    const homeFolder = elements.homeFolderInput ? elements.homeFolderInput.value : appState.homeFolder;
    const tabBehavior = elements.tabBehaviorSelectModal ? elements.tabBehaviorSelectModal.value : appState.tabBehavior;
    const saveMode = elements.saveModeSelectModal ? elements.saveModeSelectModal.value : appState.saveMode;
    const charCountMode = elements.charCountModeSelectModal ? elements.charCountModeSelectModal.value : appState.charCountMode;
    const previousSaveMode = appState.saveMode;

    if (!homeFolder) {
        alert(window.t('settings.alert.home.folder.required'));
        return;
    }

    try {
        appState.homeFolder = homeFolder;
        appState.tabBehavior = tabBehavior;
        appState.saveMode = saveMode;
        appState.charCountMode = charCountMode;

        await saveApplicationSettings();

        if (previousSaveMode !== saveMode) {
            if (appState.autosaveTimer) {
                clearTimeout(appState.autosaveTimer);
                appState.autosaveTimer = null;
            }
        }

        if (previousSaveMode === 'manual' && saveMode === 'auto') {
            for (const tab of appState.tabs) {
                if (!tab.filePath) {
                    if (tab.fileName.startsWith(`[${window.t('tabs.unsaved.label')}`) && tab.fileName.endsWith(']')) {
                        tab.fileName = tab.fileName.slice(1, -1);
                    } else if (!tab.fileName.startsWith(window.t('tabs.unsaved.label'))) {
                        tab.fileName = `${window.t('tabs.unsaved.label')}${tab.unsavedNumber}`;
                    }
                    if (tab.content.trim() !== '') {
                        tab.isDirty = true;
                    }
                }
            }
            renderTabs();
            autoSave();
        } else if (previousSaveMode === 'auto' && saveMode === 'manual') {
            for (const tab of appState.tabs) {
                if (shouldDeleteEmptyFile(tab)) {
                    try {
                        await invoke('delete_text_file', { filePath: tab.filePath });
                        tab.filePath = '';
                    } catch (err) {
                        console.error('Failed to delete empty file on mode switch:', err);
                    }
                }

                if (!tab.filePath) {
                    if (tab.fileName.startsWith(window.t('tabs.unsaved.label'))) {
                        tab.fileName = `[${tab.fileName}]`;
                    } else if (!tab.fileName.startsWith(`[${window.t('tabs.unsaved.label')}`)) {
                        tab.fileName = `[${window.t('tabs.unsaved.label')}${tab.unsavedNumber}]`;
                    }
                }
            }
            renderTabs();
        }
        
        updateEditorMetrics();
        if (appState.tabs.length === 0) {
            await createNewTab();
        } else {
            const currentTab = getCurrentTab();
            if (currentTab) {
                updateTabStatus(currentTab);
            } else {
                updateStatus(window.t('status.ready'));
            }
        }
    } catch (error) {
        console.error('Failed to save settings:', error);
        updateStatus(window.t('status.error.settings.save'), 'error');
    }
}

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

export async function onThemeChange(newTheme) {
    appState.theme = newTheme;
    applyThemeUI(newTheme);

    try {
        await invoke('apply_theme', { theme: newTheme });
    } catch (error) {
        console.error('Failed to apply theme to window:', error);
    }

    await saveApplicationSettings();
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

export function onFontFamilyChange(event) {
    const selectEl = event && event.target ? event.target
        : (elements.fontFamilySelectModal);
    if (selectEl) {
        appState.fontFamily = selectEl.value;
    }
    applyFontFamily();
    saveSettings();
}

export function saveSettingsDelay() {
    clearTimeout(settingsSaveTimer);
    settingsSaveTimer = setTimeout(async () => {
        await saveApplicationSettings();
    }, 1000);
}

