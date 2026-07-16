import { appState, elements, FILE_EXT_NCTX, FILE_EXT_NCMD } from '../state.js';
import { invoke, saveDialog, appWindow, ensureTauriApi } from './tauri.js';
import { updateStatus, updateTabStatus, renderTabs, switchTab, createNewTab } from '../ui/tabs.js';
import { syncCurrentEditorToState } from '../ui/editor.js';
import { getFileNameFromPath, isAutoCreatedFileName } from '../utils/helpers.js';

export function showSaveErrorDialog(message) {
    return new Promise((resolve) => {
        elements.errorMessage.textContent = message;
        elements.errorDialog.classList.remove('hidden');

        const onRetry = () => {
            cleanup();
            resolve('retry');
        };

        const onSaveAs = () => {
            cleanup();
            resolve('saveAs');
        };

        const onCancel = () => {
            cleanup();
            resolve('cancel');
        };

        function cleanup() {
            elements.errorDialog.classList.add('hidden');
            elements.retryBtn.removeEventListener('click', onRetry);
            elements.saveAsBtn.removeEventListener('click', onSaveAs);
            elements.cancelExitBtn.removeEventListener('click', onCancel);
        }

        elements.retryBtn.addEventListener('click', onRetry);
        elements.saveAsBtn.addEventListener('click', onSaveAs);
        elements.cancelExitBtn.addEventListener('click', onCancel);
    });
}

export async function saveTabAs(tab) {
    if (!saveDialog) {
        throw new Error('別名保存ダイアログを利用できません');
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
    updateStatus('別名で保存済み', 'saved');
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
                const now = new Date();
                const yyyy = now.getFullYear();
                const mm = String(now.getMonth() + 1).padStart(2, '0');
                const dd = String(now.getDate()).padStart(2, '0');
                const hh = String(now.getHours()).padStart(2, '0');
                const min = String(now.getMinutes()).padStart(2, '0');
                const ss = String(now.getSeconds()).padStart(2, '0');
                const saveTimestamp = `${yyyy}${mm}${dd}_${hh}${min}${ss}`;

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
            updateStatus('空ファイル削除失敗', 'error');
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
            updateStatus('保存中...', 'saving');
            await saveTabIfDirty(tab);
            updateStatus('保存済み', 'saved');
            return true;
        } catch (error) {
            console.error(`Save failed (${contextLabel}):`, error);
            const choice = await showSaveErrorDialog(
                `保存に失敗しました。\n対象: ${tab.fileName}\n理由: ${error}`
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

            updateStatus('処理を中止しました', 'error');
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
        updateTabStatus(tab, '保存中...', 'saving');

        const saved = await saveTabIfDirty(tab);

        if (saved) {
            if (isFirstSave) {
                updateStatus(tab.fileName + ' を作成', 'saved');
            } else {
                updateTabStatus(tab, '保存済み', 'saved');
            }
        } else {
            updateTabStatus(tab);
        }
    } catch (error) {
        console.error('Auto-save failed:', error);
        updateTabStatus(tab, '保存失敗', 'error');
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
        updateTabStatus(tab, '保存中...', 'saving');

        let saved = false;
        if (appState.saveMode === 'manual') {
            const now = new Date();
            const yyyy = now.getFullYear();
            const mm = String(now.getMonth() + 1).padStart(2, '0');
            const dd = String(now.getDate()).padStart(2, '0');
            const hh = String(now.getHours()).padStart(2, '0');
            const min = String(now.getMinutes()).padStart(2, '0');
            const ss = String(now.getSeconds()).padStart(2, '0');
            const saveTimestamp = `${yyyy}${mm}${dd}_${hh}${min}${ss}`;
            const fileName = `${saveTimestamp}.nctx`;
            const filePath = appState.homeFolder.replace(/[\\\/]$/, '') + '\\' + fileName;
            
            await invoke('save_text_file', {
                filePath: filePath,
                content: tab.content
            });
            tab.filePath = filePath;
            tab.fileName = fileName;
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
                    prefix = '[手動保存:Ctrl+S] ';
                }
                updateStatus(`${prefix}${tab.fileName} を作成`, 'saved', true);
            } else {
                updateTabStatus(tab, '保存済み', 'saved');
            }
        } else {
            updateTabStatus(tab);
        }
    } catch (error) {
        console.error('Manual save failed:', error);
        updateTabStatus(tab, '保存失敗', 'error');
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
        updateStatus('ファイルを読み込み中...', 'saving');
        if (!ensureTauriApi()) return;
        const content = await invoke('read_text_file', { filePath });
        const fileName = getFileNameFromPath(filePath);

        const tab = {
            id: 'tab-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8),
            fileName: fileName,
            filePath: filePath,
            content: content,
            isDirty: false,
            isSaving: false,
            savePromise: null,
            createdTimestamp: '',
        };

        appState.tabs.push(tab);
        await switchTab(tab.id);
        renderTabs();
        updateStatus(tab.fileName + ' を開きました', 'saved');
    } catch (error) {
        console.error('Failed to open file:', error);
        updateStatus('ファイル読み込み失敗', 'error');
        await createNewTab();
    }
}
