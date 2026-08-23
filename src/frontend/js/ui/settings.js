import { t } from '../../i18n.js';
import { appState, elements, savedEditorCursor, setSavedEditorCursor, DEFAULT_MONOSPACE_FONTS } from '../state.js';
import { invoke, openDialog, ensureTauriApi, appWindow, emit } from '../core/tauri.js';
import { updateStatus, renderTabs, createNewTab, getCurrentTab, updateTabStatus } from './tabs.js';
import { updateEditorMetrics, applyWordWrap, applyFontSize, applyLineHeight } from './editor.js';
import { autoSave, shouldDeleteEmptyFile } from '../core/fileSystem.js';
import { applyThemeUI, applyFontFamily, loadSystemFonts } from './theme.js';

import { saveApplicationSettings } from '../core/settingsManager.js';


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
    if (elements.fontSizeSelectModal) {
        elements.fontSizeSelectModal.value = String(appState.savedFontSize || appState.fontSize || 20);
    }
    if (elements.lineHeightSelectModal) {
        elements.lineHeightSelectModal.value = Number(appState.savedLineHeight || appState.lineHeight || 1.5).toFixed(1);
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
    if (elements.wordWrapSelectModal) {
        elements.wordWrapSelectModal.value = appState.wordWrap !== false ? 'true' : 'false';
    }
    if (elements.folderHint) {
        elements.folderHint.textContent = isMissingFolder
            ? t('settings.folder.hint.missing')
            : t('settings.folder.hint.default');
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

    // 設定ドックを開いた直後に「参照...」ボタンへ初期フォーカスをセット
    if (elements.browseFolderBtn) {
        setTimeout(() => {
            elements.browseFolderBtn.focus();
        }, 50);
    }
}

// 設定ドック内のフォーカストラップおよびキーボードナビゲーション設定
export function setupSettingsNavigation() {
    if (!elements.settingsDialog) return;

    elements.settingsDialog.addEventListener('keydown', (e) => {
        // Esc キーで設定を閉じる
        if (e.key === 'Escape') {
            e.preventDefault();
            e.stopPropagation();
            closeSettingsDialog();
            return;
        }

        // Tab キーによる項目循環移動
        if (e.key === 'Tab') {
            const focusableElements = [
                elements.browseFolderBtn,
                elements.fontFamilySelectModal,
                elements.fontSizeSelectModal,
                elements.lineHeightSelectModal,
                elements.tabBehaviorSelectModal,
                elements.saveModeSelectModal,
                elements.charCountModeSelectModal,
                elements.wordWrapSelectModal,
                elements.themeSelectModal
            ].filter(el => el && !el.disabled && el.offsetParent !== null);

            if (focusableElements.length === 0) return;

            const firstEl = focusableElements[0];
            const lastEl = focusableElements[focusableElements.length - 1];

            if (e.shiftKey) {
                // Shift + Tab: 先頭要素で押したら末尾へ
                if (document.activeElement === firstEl) {
                    e.preventDefault();
                    lastEl.focus();
                }
            } else {
                // Tab: 末尾要素で押したら先頭へ
                if (document.activeElement === lastEl) {
                    e.preventDefault();
                    firstEl.focus();
                }
            }
        }
    });
}


export async function saveSettings() {
    const homeFolder = elements.homeFolderInput ? elements.homeFolderInput.value : appState.homeFolder;
    const fontSize = elements.fontSizeSelectModal ? parseInt(elements.fontSizeSelectModal.value, 10) : (appState.savedFontSize || appState.fontSize || 20);
    const lineHeight = elements.lineHeightSelectModal ? parseFloat(elements.lineHeightSelectModal.value) : (appState.savedLineHeight || appState.lineHeight || 1.5);
    const tabBehavior = elements.tabBehaviorSelectModal ? elements.tabBehaviorSelectModal.value : appState.tabBehavior;
    const saveMode = elements.saveModeSelectModal ? elements.saveModeSelectModal.value : appState.saveMode;
    const charCountMode = elements.charCountModeSelectModal ? elements.charCountModeSelectModal.value : appState.charCountMode;
    const wordWrap = elements.wordWrapSelectModal ? (elements.wordWrapSelectModal.value === 'true') : appState.wordWrap;
    const previousSaveMode = appState.saveMode;

    if (!homeFolder) {
        alert(t('settings.alert.home.folder.required'));
        return;
    }

    try {
        appState.homeFolder = homeFolder;
        appState.savedFontSize = fontSize;
        appState.fontSize = fontSize;
        appState.savedLineHeight = lineHeight;
        appState.lineHeight = lineHeight;
        appState.tabBehavior = tabBehavior;
        appState.saveMode = saveMode;
        appState.charCountMode = charCountMode;
        appState.wordWrap = wordWrap;

        // 現在アクティブなタブの一時設定も更新して即時反映
        if (appState.currentTab) {
            const currentTab = getCurrentTab();
            if (currentTab) {
                currentTab.wordWrap = wordWrap;
            }
        }
        applyWordWrap(wordWrap);
        applyFontSize();
        applyLineHeight();

        await saveApplicationSettings();

        await handleSaveModeSwitch(previousSaveMode, saveMode);
        
        updateEditorMetrics();
        if (appState.tabs.length === 0) {
            await createNewTab();
        } else {
            const currentTab = getCurrentTab();
            if (currentTab) {
                updateTabStatus(currentTab);
            } else {
                updateStatus(t('status.ready'));
            }
        }
    } catch (error) {
        console.error('Failed to save settings:', error);
        updateStatus(t('status.error.settings.save'), 'error');
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

    if (emit) {
        try {
            await emit('theme-changed', { theme: newTheme });
        } catch (eventError) {
            console.error('Failed to emit theme-changed event:', eventError);
        }
    }

    await saveApplicationSettings();
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

async function handleSaveModeSwitch(previousSaveMode, saveMode) {
    if (previousSaveMode === saveMode) return;

    if (appState.autosaveTimer) {
        clearTimeout(appState.autosaveTimer);
        appState.autosaveTimer = null;
    }

    if (previousSaveMode === 'manual' && saveMode === 'auto') {
        for (const tab of appState.tabs) {
            if (!tab.filePath) {
                if (tab.fileName.startsWith(`[${t('tabs.unsaved.label')}`) && tab.fileName.endsWith(']')) {
                    tab.fileName = tab.fileName.slice(1, -1);
                } else if (!tab.fileName.startsWith(t('tabs.unsaved.label'))) {
                    tab.fileName = `${t('tabs.unsaved.label')}${tab.unsavedNumber}`;
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
                if (tab.fileName.startsWith(t('tabs.unsaved.label'))) {
                    tab.fileName = `[${tab.fileName}]`;
                } else if (!tab.fileName.startsWith(`[${t('tabs.unsaved.label')}`)) {
                    tab.fileName = `[${t('tabs.unsaved.label')}${tab.unsavedNumber}]`;
                }
            }
        }
        renderTabs();
    }
}

