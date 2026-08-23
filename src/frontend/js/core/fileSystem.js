import { t } from '../../i18n.js';
import { appState, FILE_EXT_NCTX, FILE_EXT_NCMD } from '../state.js';
import { invoke, saveDialog, appWindow, ensureTauriApi } from './tauri.js';
import { updateStatus, updateTabStatus, renderTabs, switchTab, createNewTab } from '../ui/tabs.js';
import { syncCurrentEditorToState } from '../ui/editor.js';
import { createTabState } from '../ui/codemirror.js';
import { getFileNameFromPath, isAutoCreatedFileName, generateTimestamp, generateTabId } from '../utils/helpers.js';
import { showSaveErrorDialog } from '../ui/dialogs.js';



export async function saveTabAs(tab) {
    if (!saveDialog) {
        throw new Error(t('fs.error.noSaveDialog'));
    }

    const targetPath = await saveDialog({
        defaultPath: tab.filePath,
        filters: [
            { name: `NoCapEdit Text (*.${FILE_EXT_NCTX})`, extensions: [FILE_EXT_NCTX] },
            { name: `NoCapEdit Markdown (*.${FILE_EXT_NCMD})`, extensions: [FILE_EXT_NCMD] },
            { name: 'Text Files (*.txt)', extensions: ['txt'] },
            { name: 'All Files (*.*)', extensions: ['*'] }
        ]
    });
    if (!targetPath || typeof targetPath !== 'string') {
        return false;
    }

    await invoke('save_text_file', {
        filePath: targetPath,
        content: tab.content,
    });

    tab.filePath = targetPath;
    tab.fileName = getFileNameFromPath(targetPath);
    tab.isDirty = false;
    renderTabs();
    updateStatus(t('fs.status.savedAs'), 'saved');
    return true;
}

export async function saveTabIfDirty(tab) {
    if (!tab || !tab.isDirty) {
        return false;
    }

    // ファイル未作成で内容が空（または空白のみ）の場合は保存（ファイル作成）をスキップし、未保存フラグを下げる
    if (!tab.filePath && tab.content.trim() === '') {
        tab.isDirty = false;
        renderTabs();
        return false;
    }

    if (tab.isSaving) {
        if (tab.savePromise) {
            await tab.savePromise;
        }
        return true;
    }

    if (!ensureTauriApi()) {
        return false;
    }

    tab.isSaving = true;
    tab.savePromise = (async () => {
        try {
            if (!tab.filePath) {
                // 初回保存：ファイル生成＋内容書き込みを同時実行
                const saveTimestamp = generateTimestamp();

                const file = await invoke('create_and_save_file', {
                    homeFolder: appState.homeFolder,
                    timestamp: saveTimestamp,
                    content: tab.content,
                });
                tab.filePath = file.file_path;
                tab.fileName = file.file_name;
                tab.createdTimestamp = saveTimestamp;
            } else {
                // 2回目以降：既存ファイルに上書き保存
                await invoke('save_text_file', {
                    filePath: tab.filePath,
                    content: tab.content,
                });
            }
            tab.isDirty = false;
            renderTabs();
        } finally {
            tab.isSaving = false;
            tab.savePromise = null;
        }
    })();

    await tab.savePromise;
    return true;
}

export function shouldDeleteEmptyFile(tab) {
    if (!tab.filePath) {
        return false;
    }
    const trimmed = tab.content.trim();
    if (trimmed !== '') {
        return false;
    }
    return isAutoCreatedFileName(tab.fileName);
}

export async function persistTabWithRecovery(tab, contextLabel) {
    if (!tab) {
        return true;
    }

    if (shouldDeleteEmptyFile(tab)) {
        try {
            await invoke('delete_text_file', { filePath: tab.filePath });
        } catch (error) {
            console.error('Failed to delete empty file:', error);
            updateStatus(t('fs.error.deleteEmptyFile'), 'error');
            return false;
        }
        return true;
    }

    if (appState.saveMode === 'manual') {
        return true;
    }

    if (!tab.isDirty) {
        return true;
    }

    while (true) {
        try {
            updateStatus(t('fs.status.saving'), 'saving');
            await saveTabIfDirty(tab);
            updateStatus(t('fs.status.saved'), 'saved');
            return true;
        } catch (error) {
            console.error(`Save failed (${contextLabel}):`, error);
            const choice = await showSaveErrorDialog(
                t('fs.dialog.saveError', { fileName: tab.fileName, error: t(error) })
            );

            if (choice === 'retry') {
                continue;
            }

            if (choice === 'saveAs') {
                try {
                    const saved = await saveTabAs(tab);
                    if (saved) {
                        return true;
                    }
                } catch (saveAsError) {
                    console.error('Save As failed:', saveAsError);
                }
                continue;
            }

            updateStatus(t('fs.status.aborted'), 'error');
            return false;
        }
    }
}

export async function persistAllTabsBeforeExit() {
    syncCurrentEditorToState();
    clearTimeout(appState.autosaveTimer);

    for (const tab of [...appState.tabs]) {
        const ok = await persistTabWithRecovery(tab, 'app-exit');
        if (!ok) {
            return false;
        }
    }

    return true;
}

export async function autoSave() {
    if (!appState.currentTab) return;

    const tab = appState.tabs.find(t => t.id === appState.currentTab);
    if (!tab || !tab.isDirty) return;

    const isFirstSave = !tab.filePath;

    try {
        updateTabStatus(tab, t('fs.status.saving'), 'saving');

        const saved = await saveTabIfDirty(tab);

        if (saved) {
            if (isFirstSave) {
                updateStatus(t('fs.status.created', { prefix: '', fileName: tab.fileName }), 'saved');
            } else {
                updateTabStatus(tab, t('fs.status.saved'), 'saved');
            }
        } else {
            updateTabStatus(tab);
        }
    } catch (error) {
        console.error('Auto-save failed:', error);
        updateTabStatus(tab, t('fs.status.saveFailed'), 'error');
    }
}

export async function triggerManualSave() {
    if (!appState.currentTab) return;

    syncCurrentEditorToState();

    // 自動保存タイマーがあればクリアする
    if (appState.autosaveTimer) {
        clearTimeout(appState.autosaveTimer);
        appState.autosaveTimer = null;
    }

    const tab = appState.tabs.find(t => t.id === appState.currentTab);
    if (!tab) return;

    const isFirstSave = !tab.filePath;

    try {
        updateTabStatus(tab, t('fs.status.saving'), 'saving');

        let saved = false;
        if (appState.saveMode === 'manual') {
            const saveTimestamp = generateTimestamp();
            const file = await invoke('create_and_save_file', {
                homeFolder: appState.homeFolder,
                timestamp: saveTimestamp,
                content: tab.content,
            });
            tab.filePath = file.file_path;
            tab.fileName = file.file_name;
            tab.createdTimestamp = saveTimestamp;
            tab.isDirty = false;
            saved = true;
        } else {
            tab.isDirty = true;
            saved = await saveTabIfDirty(tab);
        }

        renderTabs();

        if (saved) {
            if (isFirstSave) {
                let prefix = '';
                if (appState.saveMode === 'manual') {
                    prefix = t('tabs.status.manualSavePrefix');
                }
                updateStatus(t('fs.status.created', { prefix: prefix, fileName: tab.fileName }), 'saved', true);
            } else {
                updateTabStatus(tab, t('fs.status.saved'), 'saved');
            }
        } else {
            updateTabStatus(tab);
        }
    } catch (error) {
        console.error('Manual save failed:', error);
        updateTabStatus(tab, t('fs.status.saveFailed'), 'error');
    }
}

export async function openExistingFile(filePath) {
    const targetPath = filePath.replace(/\\/g, '/').toLowerCase();
    const existingTab = appState.tabs.find((t) => t.filePath.replace(/\\/g, '/').toLowerCase() === targetPath);
    if (existingTab) {
        await switchTab(existingTab.id);
        return;
    }

    try {
        updateStatus(t('fs.status.loading'), 'saving');
        if (!ensureTauriApi()) return;
        const content = await invoke('read_text_file', { filePath });
        const fileName = getFileNameFromPath(filePath);

        const tab = {
            id: generateTabId(),
            fileName: fileName,
            filePath: filePath,
            content: content,
            editorState: createTabState(content, { wordWrap: appState.wordWrap, tabBehavior: appState.tabBehavior }),
            isDirty: false,
            isSaving: false,
            savePromise: null,
            createdTimestamp: '',
        };

        appState.tabs.push(tab);
        await switchTab(tab.id);
        renderTabs();
        updateStatus(t('fs.status.opened', { fileName: tab.fileName }), 'saved');
    } catch (error) {
        console.error('Failed to open file:', error);
        updateStatus(t('fs.status.loadFailed'), 'error');
        await createNewTab();
    }
}

