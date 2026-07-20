// sidebar-integration.js — サイドバー統合モジュール（ブリッジ）
// main.js とサイドバーモジュール間の橋渡し役。
// 後続フェーズで、サイドバー関連の初期化・ショートカット登録・FS監視連携・設定保存を集約する。

import { initSidebar, initSidebarElements, focusSidebarTree, createItemGlobally, loadDirectory } from './sidebar.js';
import { appState, elements } from '../state.js';
import { registerShortcut } from '../shortcuts.js';
import { registerSettingsExtraProvider, saveSettingsDelay } from './settings.js';
import { listen } from '../core/tauri.js';
import { normalizePathForComparison, getParentPath } from '../utils/helpers.js';

let fileChangeDebounceTimer = null;
let pendingChangedDirs = new Set();

function setupSidebarFileSystemListener() {
    if (!listen) return;

    listen('file-system-changed', async (event) => {
        const { event_type, paths } = event.payload;

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

/**
 * サイドバー統合の初期化
 */
export function initSidebarIntegration() {
    initSidebarElements();
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

    // サイドバー設定プロバイダーの登録
    registerSettingsExtraProvider(() => ({
        sidebar_visible: appState.sidebarVisible,
        sidebar_width: appState.sidebarWidth
    }));

    // サイドバーからの設定保存要求をリッスン
    window.addEventListener('sidebar-settings-changed', () => {
        saveSettingsDelay();
    });

    // サイドバー用ショートカットの登録
    registerShortcut(['Ctrl+E'], () => {
        focusSidebarTree();
    }, { category: 'Sidebar' });

    registerShortcut(['Ctrl+N'], () => {
        const activeEl = document.activeElement;
        if (activeEl && activeEl.tagName === 'INPUT' && activeEl.classList.contains('tree-input')) {
            return;
        }
        createItemGlobally(false);
    }, { category: 'Sidebar' });

    registerShortcut(['Ctrl+D'], () => {
        const activeEl = document.activeElement;
        if (activeEl && activeEl.tagName === 'INPUT' && activeEl.classList.contains('tree-input')) {
            return;
        }
        createItemGlobally(true);
    }, { category: 'Sidebar' });

    setupSidebarFileSystemListener();

    initSidebar();
}
