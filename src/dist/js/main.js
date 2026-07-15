import { appState, elements, initElements } from './state.js';
import { invoke, appWindow, listen, ensureTauriApi } from './core/tauri.js';
import { createNewTab, updateStatus, updateTabStatus, renderTabs } from './ui/tabs.js';
import { openExistingFile, triggerManualSave, persistAllTabsBeforeExit } from './core/fileSystem.js';
import { updateEditorMetrics, onEditorInput, zoomIn, zoomOut, applyFontSize, applyLineHeight, increaseLineHeight, decreaseLineHeight } from './ui/editor.js';
import { toggleSettingsDialog, closeSettingsDialog, openSettingsDialog, applyThemeUI, onThemeChange, onFontFamilyChange, loadSystemFonts, checkNewVersion } from './ui/settings.js';
import { initSidebar, loadDirectory, focusSidebarTree, createItemGlobally } from './ui/sidebar.js';
import { normalizePathForComparison, getParentPath } from './utils/helpers.js';

function setupUIEventListeners() {
    if (appState.initialized) {
        return;
    }

    elements.addTabBtn.addEventListener('click', createNewTab);
    elements.settingsBtn && elements.settingsBtn.addEventListener('click', toggleSettingsDialog);
    if (elements.settingsDialog) {
        elements.settingsDialog.addEventListener('click', (e) => {
            if (e.target === elements.settingsDialog) {
                closeSettingsDialog();
            }
        });
    }
    elements.themeSelectModal && elements.themeSelectModal.addEventListener('change', (e) => onThemeChange(e.target.value));
    if (elements.fontFamilySelectModal) {
        elements.fontFamilySelectModal.addEventListener('change', onFontFamilyChange);
        const triggerLoadModal = async () => {
            if (!appState.fontsLoaded && !appState.fontsLoading) {
                await loadSystemFonts();
            }
        };
        elements.fontFamilySelectModal.addEventListener('mousedown', triggerLoadModal);
        elements.fontFamilySelectModal.addEventListener('focus', triggerLoadModal);
    }
    if (elements.tabBehaviorSelectModal) {
        elements.tabBehaviorSelectModal.addEventListener('change', async (e) => {
            appState.tabBehavior = e.target.value;
            const { saveSettings } = await import('./ui/settings.js');
            await saveSettings();
        });
    }
    if (elements.charCountModeSelectModal) {
        elements.charCountModeSelectModal.addEventListener('change', async (e) => {
            appState.charCountMode = e.target.value;
            const { saveSettings } = await import('./ui/settings.js');
            await saveSettings();
            updateEditorMetrics();
        });
    }
    if (elements.saveModeSelectModal) {
        elements.saveModeSelectModal.addEventListener('change', async (e) => {
            const { saveSettings } = await import('./ui/settings.js');
            await saveSettings();
        });
    }

    function getIndentString() {
        switch (appState.tabBehavior) {
            case 'space2': return '  ';
            case 'space4': return '    ';
            case 'tab':
            default:
                return '\t';
        }
    }

    elements.editor.addEventListener('keydown', (e) => {
        if (e.key === 'Tab') {
            e.preventDefault();

            const start = elements.editor.selectionStart;
            const end = elements.editor.selectionEnd;
            const value = elements.editor.value;
            const indentStr = getIndentString();

            const isMultiLine = value.substring(start, end).includes('\n') ||
                (start !== end && value.substring(0, start).lastIndexOf('\n') === start - 1);

            if (!e.shiftKey) {
                if (!isMultiLine) {
                    elements.editor.value = value.substring(0, start) + indentStr + value.substring(end);
                    elements.editor.selectionStart = elements.editor.selectionEnd = start + indentStr.length;
                } else {
                    const startLinePos = value.substring(0, start).lastIndexOf('\n') + 1;
                    const endLinePos = value.indexOf('\n', end);
                    const actualEndLinePos = endLinePos === -1 ? value.length : endLinePos;

                    const targetText = value.substring(startLinePos, actualEndLinePos);
                    const lines = targetText.split('\n');

                    const newLines = lines.map(line => indentStr + line);
                    const newText = newLines.join('\n');

                    elements.editor.value = value.substring(0, startLinePos) + newText + value.substring(actualEndLinePos);

                    const insertedCount = lines.length * indentStr.length;
                    elements.editor.selectionStart = start + indentStr.length;
                    elements.editor.selectionEnd = end + insertedCount;
                }
            } else {
                const startLinePos = value.substring(0, start).lastIndexOf('\n') + 1;
                const endLinePos = value.indexOf('\n', end);
                const actualEndLinePos = endLinePos === -1 ? value.length : endLinePos;

                const targetText = value.substring(startLinePos, actualEndLinePos);
                const lines = targetText.split('\n');

                let firstLineRemovedCount = 0;
                let totalRemovedCount = 0;

                const newLines = lines.map((line, idx) => {
                    let removed = 0;
                    let newLine = line;

                    if (line.startsWith(indentStr)) {
                        newLine = line.substring(indentStr.length);
                        removed = indentStr.length;
                    } else if (line.startsWith('\t')) {
                        newLine = line.substring(1);
                        removed = 1;
                    } else if (line.startsWith(' ')) {
                        const spaceMatch = line.match(/^ +/);
                        if (spaceMatch) {
                            const count = Math.min(spaceMatch[0].length, indentStr.length);
                            newLine = line.substring(count);
                            removed = count;
                        }
                    }

                    if (idx === 0) {
                        firstLineRemovedCount = removed;
                    }
                    totalRemovedCount += removed;
                    return newLine;
                });

                const newText = newLines.join('\n');
                elements.editor.value = value.substring(0, startLinePos) + newText + value.substring(actualEndLinePos);

                elements.editor.selectionStart = Math.max(startLinePos, start - firstLineRemovedCount);
                elements.editor.selectionEnd = Math.max(startLinePos, end - totalRemovedCount);
            }

            elements.editor.dispatchEvent(new Event('input'));
        }
    });

    elements.editor.addEventListener('input', onEditorInput);
    elements.editor.addEventListener('click', updateEditorMetrics);
    elements.editor.addEventListener('mouseup', updateEditorMetrics);
    elements.editor.addEventListener('keyup', updateEditorMetrics);

    registerCloseHandler();

    window.addEventListener('wheel', (e) => {
        if (e.ctrlKey) {
            e.preventDefault();
            if (e.shiftKey) {
                if (e.deltaY < 0) {
                    increaseLineHeight();
                } else if (e.deltaY > 0) {
                    decreaseLineHeight();
                }
            } else {
                if (e.deltaY < 0) {
                    zoomIn();
                } else if (e.deltaY > 0) {
                    zoomOut();
                }
            }
        }
    }, { passive: false });

    window.addEventListener('keydown', (e) => {
        // F5 キーによるリロードを禁止
        if (e.key === 'F5' || e.code === 'F5') {
            e.preventDefault();
            return;
        }

        if (e.ctrlKey) {
            // Ctrl + R によるリロードを禁止 (Shiftキーが同時に押されている場合も含む)
            if (e.key === 'r' || e.key === 'R' || e.code === 'KeyR') {
                e.preventDefault();
                return;
            }
            // Ctrl + P による印刷を禁止
            if (e.key === 'p' || e.key === 'P' || e.code === 'KeyP') {
                e.preventDefault();
                return;
            }
            if (e.shiftKey) {
                if (e.code === 'NumpadAdd' || e.code === 'Equal' || e.code === 'Semicolon' || e.key === '+') {
                    e.preventDefault();
                    increaseLineHeight();
                } else if (e.code === 'Minus' || e.code === 'NumpadSubtract' || e.key === '-' || e.key === '_') {
                    e.preventDefault();
                    decreaseLineHeight();
                }
                return;
            }

            if (e.key === '+' || e.key === '=' || e.key === ';' || e.code === 'NumpadAdd' || e.code === 'Equal' || (e.code === 'Semicolon' && e.shiftKey)) {
                e.preventDefault();
                zoomIn();
            }
            else if (e.key === '-' || e.key === '_' || e.code === 'NumpadSubtract' || e.code === 'Minus') {
                e.preventDefault();
                zoomOut();
            }
            else if (e.key === 's' || e.key === 'S' || e.code === 'KeyS') {
                e.preventDefault();
                triggerManualSave();
            }
            else if (e.key === 'e' || e.key === 'E' || e.code === 'KeyE') {
                e.preventDefault();
                focusSidebarTree();
            }
            else if (e.key === 'n' || e.key === 'N' || e.code === 'KeyN') {
                const activeEl = document.activeElement;
                if (activeEl && activeEl.tagName === 'INPUT' && activeEl.classList.contains('tree-input')) {
                    return;
                }
                e.preventDefault();
                createItemGlobally(false);
            }
            else if (e.key === 'd' || e.key === 'D' || e.code === 'KeyD') {
                const activeEl = document.activeElement;
                if (activeEl && activeEl.tagName === 'INPUT' && activeEl.classList.contains('tree-input')) {
                    return;
                }
                e.preventDefault();
                createItemGlobally(true);
            }
        }
    });

    if (listen) {
        listen('single-instance-file', async (event) => {
            const filePath = event.payload;
            if (filePath) {
                await openExistingFile(filePath);
            }
        });
    }

    let fileChangeDebounceTimer = null;
    let pendingChangedDirs = new Set();

    if (listen) {
        listen('file-system-changed', async (event) => {
            const { event_type, detail, paths } = event.payload;
            console.log('file-system-changed event received:', event_type, detail, paths);

            if (event_type === 'remove') {
                for (const path of paths) {
                    const { closeTabByPathWithoutSaving } = await import('./ui/tabs.js');
                    await closeTabByPathWithoutSaving(path);
                }
            } else if (event_type === 'rename') {
                const handleRenameTab = (oldPath, newPath) => {
                    const oldNorm = normalizePathForComparison(oldPath);
                    const tab = appState.tabs.find(t => t.filePath && normalizePathForComparison(t.filePath) === oldNorm);
                    if (tab) {
                        tab.filePath = newPath;
                        const newName = newPath.replace(/\\/g, '/').split('/').pop();
                        tab.fileName = newName;
                        
                        renderTabs();
                        
                        if (appState.currentTab === tab.id) {
                            updateStatus(`${newName} に名前変更されました`, 'info');
                            const cleanName = newName.replace(/\.nctx$/, '');
                            const masterVersion = appState.appVersion || '0.2.4';
                            document.title = `NoCapEdit [ Ver ${masterVersion} ] - ${cleanName}`;
                        }
                    }
                };

                if (detail === 'both' && paths.length >= 2) {
                    handleRenameTab(paths[0], paths[1]);
                } else if (paths.length >= 2) {
                    handleRenameTab(paths[0], paths[1]);
                } else if (paths.length === 1) {
                    if (detail === 'from') {
                        appState.pendingRenameFrom = paths[0];
                    } else if (detail === 'to') {
                        if (appState.pendingRenameFrom) {
                            handleRenameTab(appState.pendingRenameFrom, paths[0]);
                            appState.pendingRenameFrom = null;
                        }
                    } else {
                        if (!appState.pendingRenameFrom) {
                            appState.pendingRenameFrom = paths[0];
                        } else {
                            handleRenameTab(appState.pendingRenameFrom, paths[0]);
                            appState.pendingRenameFrom = null;
                        }
                    }
                }
            }

            for (const path of paths) {
                const normalizedPath = normalizePathForComparison(path);
                
                const isExistingFolder = Array.from(document.querySelectorAll('.tree-item[data-is-dir="true"]')).some(el => {
                    return normalizePathForComparison(el.dataset.filePath) === normalizedPath;
                });

                const isHomeFolder = normalizePathForComparison(appState.homeFolder) === normalizedPath;
                
                if ((isExistingFolder || isHomeFolder) && event_type === 'modify') {
                    continue;
                }

                if (isHomeFolder && (event_type === 'rename' || event_type === 'remove')) {
                    continue;
                }

                const parent = getParentPath(path.replace(/\\/g, '/'));
                if (parent) {
                    pendingChangedDirs.add(parent);
                } else if (appState.homeFolder) {
                    pendingChangedDirs.add(appState.homeFolder.replace(/\\/g, '/').replace(/\/$/, ''));
                }
            }

            clearTimeout(fileChangeDebounceTimer);
            fileChangeDebounceTimer = setTimeout(async () => {
                const dirsToReload = Array.from(pendingChangedDirs);
                pendingChangedDirs.clear();

                for (const dir of dirsToReload) {
                    const normalizedDir = normalizePathForComparison(dir);
                    const normalizedHome = normalizePathForComparison(appState.homeFolder);

                    if (normalizedDir === normalizedHome || normalizedDir === '') {
                        await loadDirectory(null, elements.fileTree);
                    } else {
                        const folderItem = Array.from(document.querySelectorAll('.tree-item[data-is-dir="true"]')).find(el => {
                            return normalizePathForComparison(el.dataset.filePath) === normalizedDir;
                        });

                        if (folderItem) {
                            const childrenContainer = folderItem.nextElementSibling;
                            if (childrenContainer && childrenContainer.classList.contains('tree-children')) {
                                if (!childrenContainer.classList.contains('hidden')) {
                                    await loadDirectory(folderItem.dataset.filePath, childrenContainer);
                                }
                            }
                        }
                    }
                }
            }, 250);
        });
    }

    appState.initialized = true;
}

function registerCloseHandler() {
    if (!appWindow || typeof appWindow.onCloseRequested !== 'function') {
        return;
    }

    appWindow.onCloseRequested(async (event) => {
        if (appState.forceClosing) {
            return;
        }

        event.preventDefault();

        if (appState.closeGuard) {
            return;
        }
        appState.closeGuard = true;

        try {
            const ok = await persistAllTabsBeforeExit();
            if (!ok) {
                appState.closeGuard = false;
                return;
            }

            appState.forceClosing = true;
            await invoke('exit_app');
        } catch (error) {
            console.error('Failed while processing app close:', error);
            updateStatus('終了処理失敗', 'error');
            appState.closeGuard = false;
            appState.forceClosing = false;
        }
    });
}

async function init() {
    console.log('NoCapEdit initializing...');

    if (!ensureTauriApi()) {
        return;
    }

    try {
        const settings = await invoke('get_settings');

        // コンテキストメニュー制限の適用
        const isDebug = await invoke('is_debug');
        if (!isDebug) {
            document.addEventListener('contextmenu', (e) => {
                e.preventDefault();
            });
        }

        appState.homeFolder = settings.home_folder;
        appState.theme = settings.theme || 'dark';
        appState.fontSize = settings.font_size || 13;
        appState.fontFamily = settings.font_family || 'default';
        appState.lineHeight = settings.line_height || 1.5;
        appState.tabBehavior = settings.tab_behavior || 'tab';
        appState.saveMode = settings.save_mode || 'auto';
        appState.charCountMode = settings.char_count_mode || 'with_newline';
        appState.sidebarVisible = settings.sidebar_visible || false;
        appState.sidebarWidth = settings.sidebar_width || 220;
        appState.appVersion = settings.app_version;

        if (appState.sidebarVisible) {
            if (elements.sidebar) elements.sidebar.classList.remove('hidden');
            if (elements.sidebarResizeHandle) elements.sidebarResizeHandle.classList.remove('hidden');
            if (elements.iconBar) elements.iconBar.style.width = 'var(--sidebar-width)';
        } else {
            if (elements.sidebar) elements.sidebar.classList.add('hidden');
            if (elements.sidebarResizeHandle) elements.sidebarResizeHandle.classList.add('hidden');
            if (elements.iconBar) elements.iconBar.style.width = '48px';
        }
        document.documentElement.style.setProperty('--sidebar-width', `${appState.sidebarWidth}px`);

        if (elements.tabBehaviorSelectModal) {
            elements.tabBehaviorSelectModal.value = appState.tabBehavior;
        }
        if (elements.saveModeSelectModal) {
            elements.saveModeSelectModal.value = appState.saveMode;
        }
        if (elements.charCountModeSelectModal) {
            elements.charCountModeSelectModal.value = appState.charCountMode;
        }

        if (settings.app_version) {
            const initialTitle = `NoCapEdit [ Ver ${settings.app_version} ]`;
            document.title = initialTitle;
            if (appWindow && typeof appWindow.setTitle === 'function') {
                appWindow.setTitle(initialTitle);
            }
        }

        applyThemeUI(appState.theme);
        try {
            await invoke('apply_theme', { theme: appState.theme });
        } catch (themeError) {
            console.error('Failed to apply theme during init:', themeError);
        }

        applyFontSize();
        const { applyFontFamily } = await import('./ui/settings.js');
        applyFontFamily();
        applyLineHeight();

        if (appState.fontFamily !== 'default' && elements.fontFamilySelectModal) {
            const option = document.createElement('option');
            option.value = appState.fontFamily;
            option.textContent = appState.fontFamily;
            option.selected = true;
            elements.fontFamilySelectModal.appendChild(option);
        }

        const isFirstLaunch = !!settings.is_first_launch;
        const isHomeFolderMissing = settings.home_folder_exists === false;

        if (isFirstLaunch || isHomeFolderMissing) {
            openSettingsDialog(isHomeFolderMissing);
        } else {
            updateStatus('準備完了');
            setupUIEventListeners();

            const launchFile = await invoke('get_launch_file');
            if (launchFile) {
                await openExistingFile(launchFile);
            } else {
                await createNewTab();
            }

            if (settings.app_version) {
                checkNewVersion(settings.app_version);
            }
        }
    } catch (error) {
        console.error('Failed to initialize:', error);
        updateStatus('初期化エラー', 'error');
    } finally {
        if (appWindow && typeof appWindow.show === 'function') {
            try {
                await appWindow.show();
            } catch (showError) {
                console.error('Failed to show window:', showError);
            }
        }
    }
}

window.addEventListener('error', (event) => {
    console.error('Unhandled window error:', event.error || event.message);
});

window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
});

document.addEventListener('DOMContentLoaded', async () => {
    initElements();
    await init();
    updateEditorMetrics();
    initSidebar();
});
