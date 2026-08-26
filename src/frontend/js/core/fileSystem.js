import { t } from '../../i18n.js';
import { appState, FILE_EXT_NCTX, FILE_EXT_NCMD } from '../state.js';
import { invoke, openDialog, saveDialog, appWindow, ensureTauriApi } from './tauri.js';
import { updateStatus, updateTabStatus, renderTabs, switchTab, createNewTab } from '../ui/tabs.js';
import { syncCurrentEditorToState } from '../ui/editor.js';
import { createTabState, getLanguageSupport, updateLanguageForFileName, getEditorView } from '../ui/codemirror.js';
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
        encoding: tab.encoding || 'UTF-8',
    });

    tab.filePath = targetPath;
    tab.fileName = getFileNameFromPath(targetPath);
    tab.isDirty = false;
    renderTabs();
    if (tab.id === appState.currentTab) {
        await updateLanguageForFileName(getEditorView(), tab.fileName);
    }
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
                tab.encoding = 'UTF-8';
                tab.createdTimestamp = saveTimestamp;
            } else {
                // 2回目以降：既存ファイルに上書き保存
                await invoke('save_text_file', {
                    filePath: tab.filePath,
                    content: tab.content,
                    encoding: tab.encoding || 'UTF-8',
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
            tab.encoding = 'UTF-8';
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

/**
 * 既存のテキストファイルをタブとして開く
 * @param {string} filePath - ファイルパス
 * @param {boolean} [suppressStatus=false] - 個別ステータス通知を抑制するか
 */
export async function openExistingFile(filePath, suppressStatus = false) {
    if (!filePath || typeof filePath !== 'string') return;

    const targetPath = filePath.replace(/\\/g, '/').toLowerCase();
    const existingTab = appState.tabs.find((t) => t.filePath && t.filePath.replace(/\\/g, '/').toLowerCase() === targetPath);
    if (existingTab) {
        await switchTab(existingTab.id);
        return;
    }

    try {
        if (!suppressStatus) {
            updateStatus(t('fs.status.loading'), 'saving');
        }
        if (!ensureTauriApi()) return;

        const res = await invoke('read_text_file', { filePath });
        const content = typeof res === 'string' ? res : (res && res.content !== undefined ? res.content : '');
        const encoding = (res && typeof res === 'object' && res.encoding) ? res.encoding : 'UTF-8';
        const fileName = getFileNameFromPath(filePath);
        const languageSupport = await getLanguageSupport(fileName);

        const editorState = createTabState(content, {
            wordWrap: appState.wordWrap,
            tabBehavior: appState.tabBehavior,
            languageSupport: languageSupport,
        });

        // 起動直後の未編集・未作成の空タブ（1つのみ存在）であれば、そのタブを再利用して開く
        const isSingleEmptyTab = appState.tabs.length === 1 &&
            !appState.tabs[0].filePath &&
            !appState.tabs[0].isDirty &&
            appState.tabs[0].content === '';

        if (isSingleEmptyTab) {
            const firstTab = appState.tabs[0];
            firstTab.fileName = fileName;
            firstTab.filePath = filePath;
            firstTab.content = content;
            firstTab.encoding = encoding;
            firstTab.editorState = editorState;
            firstTab.isDirty = false;
            firstTab.isSaving = false;
            firstTab.savePromise = null;
            firstTab.createdTimestamp = '';

            await switchTab(firstTab.id);
            renderTabs();
        } else {
            const tab = {
                id: generateTabId(),
                fileName: fileName,
                filePath: filePath,
                content: content,
                encoding: encoding,
                editorState: editorState,
                isDirty: false,
                isSaving: false,
                savePromise: null,
                createdTimestamp: '',
            };

            appState.tabs.push(tab);
            await switchTab(tab.id);
            renderTabs();
        }

        if (!suppressStatus) {
            updateStatus(t('fs.status.opened', { fileName: fileName }), 'saved');
        }
    } catch (error) {
        console.error('Failed to open file:', error);
        updateStatus(t('fs.status.loadFailed'), 'error');
    }
}

/**
 * 複数のファイルを一括で開く
 * @param {string[]} filePaths
 */
export async function openFiles(filePaths) {
    if (!filePaths || !Array.isArray(filePaths) || filePaths.length === 0) {
        return;
    }

    const validPaths = filePaths.filter(p => typeof p === 'string' && p.trim() !== '');
    if (validPaths.length === 0) return;

    if (validPaths.length === 1) {
        await openExistingFile(validPaths[0]);
        return;
    }

    updateStatus(t('fs.status.loading'), 'saving');
    for (const filePath of validPaths) {
        await openExistingFile(filePath, true);
    }
    updateStatus(t('fs.status.openBatch', { count: validPaths.length }), 'saved');
}

/**
 * ファイル選択ダイアログを開いてファイルを選択・オープン (Ctrl+O)
 */
export async function openFileDialog() {
    if (!openDialog) {
        throw new Error(t('fs.error.noOpenDialog'));
    }

    const selected = await openDialog({
        multiple: true,
        filters: [
            {
                name: 'Supported Files / Text Files',
                extensions: [
                    'nctx', 'ncmd', 'txt', 'md', 'markdown',
                    'js', 'mjs', 'cjs', 'ts', 'mts', 'cts', 'jsx', 'tsx',
                    'json', 'yaml', 'yml', 'toml', 'xml', 'html', 'htm', 'css', 'scss', 'less',
                    'py', 'rs', 'c', 'cpp', 'h', 'hpp', 'cs', 'java', 'go', 'rb', 'php', 'sql',
                    'sh', 'bash', 'zsh', 'bat', 'cmd', 'ps1', 'psm1',
                    'csv', 'tsv', 'log', 'ini', 'conf', 'env'
                ]
            },
            { name: 'All Files (*.*)', extensions: ['*'] }
        ]
    });

    if (!selected) {
        return;
    }

    const paths = Array.isArray(selected) ? selected : [selected];
    await openFiles(paths);
}

