import { appState, elements } from '../state.js';
import { invoke, appWindow } from '../core/tauri.js';
import { normalizePathForComparison, getParentPath } from '../utils/helpers.js';
import { openExistingFile } from '../core/fileSystem.js';
import { closeTabByPathWithoutSaving } from './tabs.js';
import { saveSettingsDelay } from './settings.js';

// コンテキストメニュー関連の状態管理
export let contextMenuTarget = {
    filePath: null,
    isDir: false,
    fileName: null,
    element: null
};

// サイドバー関連の初期化
export function initSidebar() {
    console.log('initSidebar called, elements:', {
        btn: !!elements.sidebarToggleBtn,
        sidebar: !!elements.sidebar,
        handle: !!elements.sidebarResizeHandle
    });
    if (!elements.sidebarToggleBtn || !elements.sidebar || !elements.sidebarResizeHandle) return;

    // トグル機能
    elements.sidebarToggleBtn.addEventListener('click', () => {
        console.log('Toggle button clicked, current state:', appState.sidebarVisible);
        appState.sidebarVisible = !appState.sidebarVisible;
        if (appState.sidebarVisible) {
            elements.sidebar.classList.remove('hidden');
            elements.sidebarResizeHandle.classList.remove('hidden');
            elements.iconBar.style.width = 'var(--sidebar-width)';
        } else {
            elements.sidebar.classList.add('hidden');
            elements.sidebarResizeHandle.classList.add('hidden');
            elements.iconBar.style.width = '48px';
        }
        console.log('Sidebar is now:', appState.sidebarVisible ? 'visible' : 'hidden');
        saveSettingsDelay();
    });

    // リサイズ機能
    let isResizing = false;
    let startX = 0;
    let startWidth = 0;

    elements.sidebarResizeHandle.addEventListener('mousedown', (e) => {
        isResizing = true;
        startX = e.clientX;
        startWidth = appState.sidebarWidth;
        elements.sidebarResizeHandle.classList.add('active');
        document.body.style.cursor = 'col-resize';
        e.preventDefault(); // テキスト選択等を防ぐ
    });

    document.addEventListener('mousemove', (e) => {
        if (!isResizing) return;
        const deltaX = e.clientX - startX;
        let newWidth = startWidth + deltaX;

        // 幅の最小値・最大値を設定
        newWidth = Math.max(150, Math.min(newWidth, 600));
        
        appState.sidebarWidth = newWidth;
        document.documentElement.style.setProperty('--sidebar-width', `${newWidth}px`);
    });

    document.addEventListener('mouseup', () => {
        if (isResizing) {
            isResizing = false;
            elements.sidebarResizeHandle.classList.remove('active');
            document.body.style.cursor = '';
            saveSettingsDelay();
        }
    });

    // 初期ディレクトリの読み込み
    if (elements.fileTree) {
        loadDirectory(null, elements.fileTree);
    }

    // サイドバー背景の右クリック
    elements.sidebar.addEventListener('contextmenu', (e) => {
        if (e.target.closest('.tree-item')) return;
        e.preventDefault();
        showContextMenu(e, null, false, null, null);
    });

    // コンテキストメニューアイテムのクリックイベント
    if (elements.menuNewFile) {
        elements.menuNewFile.addEventListener('click', () => {
            hideContextMenu();
            createNewItemInTree(false);
        });
    }
    if (elements.menuNewFolder) {
        elements.menuNewFolder.addEventListener('click', () => {
            hideContextMenu();
            createNewItemInTree(true);
        });
    }
    if (elements.menuRename) {
        elements.menuRename.addEventListener('click', () => {
            hideContextMenu();
            startRenameInTree();
        });
    }
    if (elements.menuDelete) {
        elements.menuDelete.addEventListener('click', () => {
            hideContextMenu();
            deleteItemInTree();
        });
    }

    // メニュー外クリックやEscで閉じる
    document.addEventListener('click', () => {
        hideContextMenu();
    });
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            hideContextMenu();
        }
    });
}

export async function loadDirectory(path, parentElement) {
    try {
        const files = await invoke('read_directory', { path });
        renderFileTree(files, parentElement);
    } catch (e) {
        console.error('Failed to load directory:', e);
        parentElement.innerHTML = `<div class="tree-error">読み込みエラー: ${e}</div>`;
    }
}

export function renderFileTree(files, container) {
    container.innerHTML = '';
    if (files.length === 0) {
        container.innerHTML = '<div class="tree-empty">フォルダは空です</div>';
        return;
    }

    files.forEach(file => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'tree-item';
        
        const iconSpan = document.createElement('span');
        iconSpan.className = 'tree-icon';
        iconSpan.textContent = file.is_dir ? '📁' : '📄';

        const nameSpan = document.createElement('span');
        nameSpan.className = 'tree-name';
        nameSpan.textContent = file.file_name;
        nameSpan.title = file.file_name;

        itemDiv.appendChild(iconSpan);
        itemDiv.appendChild(nameSpan);

        itemDiv.dataset.filePath = file.file_path;
        itemDiv.dataset.fileName = file.file_name;
        itemDiv.dataset.isDir = file.is_dir;

        itemDiv.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            e.stopPropagation();
            showContextMenu(e, file.file_path, file.is_dir, file.file_name, itemDiv);
        });

        if (file.is_dir) {
            const childrenContainer = document.createElement('div');
            childrenContainer.className = 'tree-children hidden';
            
            itemDiv.addEventListener('click', async (e) => {
                e.stopPropagation();
                
                const isHidden = childrenContainer.classList.contains('hidden');
                if (isHidden) {
                    childrenContainer.classList.remove('hidden');
                    iconSpan.textContent = '📂';
                    
                    if (childrenContainer.children.length === 0) {
                        childrenContainer.innerHTML = '<div class="tree-loading">読み込み中...</div>';
                        await loadDirectory(file.file_path, childrenContainer);
                    }
                } else {
                    childrenContainer.classList.add('hidden');
                    iconSpan.textContent = '📁';
                }
            });
            
            container.appendChild(itemDiv);
            container.appendChild(childrenContainer);
        } else {
            itemDiv.addEventListener('click', (e) => {
                e.stopPropagation();
                openFileFromTree(file);
                
                document.querySelectorAll('.tree-item').forEach(el => el.classList.remove('active'));
                itemDiv.classList.add('active');
            });
            container.appendChild(itemDiv);
        }
    });
}

export function openFileFromTree(file) {
    openExistingFile(file.file_path);
}

export function showContextMenu(e, path, isDir, name, element) {
    contextMenuTarget = {
        filePath: path,
        isDir: isDir,
        fileName: name,
        element: element
    };

    if (!elements.contextMenu) return;

    let visibleCount = 0;
    if (path === null) {
        elements.menuNewFile.classList.remove('hidden');
        elements.menuNewFolder.classList.remove('hidden');
        elements.menuRename.classList.add('hidden');
        elements.menuDelete.classList.add('hidden');
        visibleCount = 2;
    } else if (isDir) {
        elements.menuNewFile.classList.remove('hidden');
        elements.menuNewFolder.classList.remove('hidden');
        elements.menuRename.classList.remove('hidden');
        elements.menuDelete.classList.remove('hidden');
        visibleCount = 4;
    } else {
        elements.menuNewFile.classList.add('hidden');
        elements.menuNewFolder.classList.add('hidden');
        elements.menuRename.classList.remove('hidden');
        elements.menuDelete.classList.remove('hidden');
        visibleCount = 2;
    }

    const menuWidth = 160;
    const menuHeight = visibleCount * 32 + 8;
    let x = (e && typeof e.clientX === 'number') ? e.clientX : 0;
    let y = (e && typeof e.clientY === 'number') ? e.clientY : 0;

    y -= menuHeight;

    if (y < 0) {
        y = (e && typeof e.clientY === 'number') ? e.clientY : 0;
    }

    if (x + menuWidth > window.innerWidth) {
        x = Math.max(0, window.innerWidth - menuWidth);
    }
    if (y + menuHeight > window.innerHeight) {
        y = Math.max(0, window.innerHeight - menuHeight);
    }

    elements.contextMenu.style.left = `${x}px`;
    elements.contextMenu.style.top = `${y}px`;
    elements.contextMenu.classList.remove('hidden');
}

export function hideContextMenu() {
    if (elements.contextMenu) {
        elements.contextMenu.classList.add('hidden');
    }
}

export async function createNewItemInTree(isDir) {
    let parentPath = "";
    let parentContainer = elements.fileTree;

    if (contextMenuTarget.filePath) {
        if (contextMenuTarget.isDir) {
            parentPath = contextMenuTarget.filePath;
            parentContainer = contextMenuTarget.element.nextElementSibling;
            
            const iconSpan = contextMenuTarget.element.querySelector('.tree-icon');
            if (parentContainer && parentContainer.classList.contains('hidden')) {
                parentContainer.classList.remove('hidden');
                if (iconSpan) iconSpan.textContent = '📂';
                if (parentContainer.children.length === 0) {
                    parentContainer.innerHTML = '<div class="tree-loading">読み込み中...</div>';
                    await loadDirectory(parentPath, parentContainer);
                }
            }
        } else {
            parentPath = getParentPath(contextMenuTarget.filePath);
            const parentItem = contextMenuTarget.element.parentElement.previousElementSibling;
            if (parentItem && parentItem.classList.contains('tree-item')) {
                parentContainer = contextMenuTarget.element.parentElement;
            }
        }
    }

    const empties = parentContainer.querySelectorAll('.tree-empty, .tree-loading, .tree-error');
    empties.forEach(el => el.remove());

    const tempItem = document.createElement('div');
    tempItem.className = 'tree-item';

    const iconSpan = document.createElement('span');
    iconSpan.className = 'tree-icon';
    iconSpan.textContent = isDir ? '📁' : '📄';

    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'tree-input';
    const defaultName = isDir ? '新しいフォルダ' : '名称未設定';
    input.value = defaultName;

    tempItem.appendChild(iconSpan);
    tempItem.appendChild(input);
    parentContainer.appendChild(tempItem);

    tempItem.scrollIntoView({ block: 'nearest', behavior: 'smooth' });

    input.focus();
    input.select();

    let finished = false;

    const commitCreate = async () => {
        if (finished) return;
        finished = true;

        const name = input.value.trim() || defaultName;
        let finalName = name;

        if (!isDir) {
            const hasAllowedExt = ['.nctx', '.txt', '.md', '.json', '.csv'].some(ext => name.toLowerCase().endsWith(ext));
            if (!hasAllowedExt) {
                finalName = name + '.nctx';
            }
        }

        try {
            const newPath = await invoke('create_file_or_dir', {
                parentPath: parentPath,
                name: finalName,
                isDir: isDir
            });

            if (parentPath === "") {
                await loadDirectory(null, elements.fileTree);
            } else {
                await loadDirectory(parentPath, parentContainer);
            }

            if (!isDir) {
                await openExistingFile(newPath);
            }
        } catch (e) {
            console.error('Failed to create item:', e);
            if (window.__TAURI__ && window.__TAURI__.dialog) {
                await window.__TAURI__.dialog.message(`作成に失敗しました: ${e}`, { title: 'エラー', type: 'error' });
            } else {
                alert(`作成に失敗しました: ${e}`);
            }
            if (parentPath === "") {
                await loadDirectory(null, elements.fileTree);
            } else {
                await loadDirectory(parentPath, parentContainer);
            }
        }
    };

    const cancelCreate = () => {
        if (finished) return;
        finished = true;
        tempItem.remove();
        if (parentContainer.children.length === 0) {
            parentContainer.innerHTML = '<div class="tree-empty">フォルダは空です</div>';
        }
    };

    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            commitCreate();
        } else if (e.key === 'Escape') {
            cancelCreate();
        }
    });

    input.addEventListener('blur', () => {
        commitCreate();
    });
}

export async function startRenameInTree() {
    const targetPath = contextMenuTarget.filePath;
    const targetElement = contextMenuTarget.element;
    const isDir = contextMenuTarget.isDir;
    const oldName = contextMenuTarget.fileName;

    if (!targetPath || !targetElement) return;

    const nameSpan = targetElement.querySelector('.tree-name');
    if (!nameSpan) return;

    const originalText = nameSpan.textContent;
    nameSpan.innerHTML = '';

    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'tree-input';
    input.value = oldName;

    nameSpan.appendChild(input);
    input.focus();

    const lastDot = oldName.lastIndexOf('.');
    if (!isDir && lastDot !== -1) {
        input.setSelectionRange(0, lastDot);
    } else {
        input.select();
    }

    let finished = false;

    const commitRename = async () => {
        if (finished) return;
        finished = true;

        const newName = input.value.trim();
        if (!newName || newName === oldName) {
            nameSpan.textContent = originalText;
            return;
        }

        let finalName = newName;
        if (!isDir) {
            const hasAllowedExt = ['.nctx', '.txt', '.md', '.json', '.csv'].some(ext => newName.toLowerCase().endsWith(ext));
            if (!hasAllowedExt) {
                finalName = newName + '.nctx';
            }
        }

        try {
            const newPath = await invoke('rename_file_or_dir', {
                oldPath: targetPath,
                newName: finalName
            });

            const parentPath = getParentPath(targetPath);
            const parentContainer = targetElement.parentElement;
            if (parentPath === "") {
                await loadDirectory(null, elements.fileTree);
            } else {
                await loadDirectory(parentPath, parentContainer);
            }

            const tab = appState.tabs.find(t => t.filePath === targetPath);
            if (tab) {
                tab.filePath = newPath;
                tab.fileName = finalName;
                renderTabs();
                if (appState.currentTab === tab.id) {
                    const { updateTabStatus } = await import('./tabs.js');
                    updateTabStatus(tab);
                    const titleText = `NoCapEdit [ Ver ${appState.appVersion || '0.2.4'} ] - ${finalName.replace(/\.nctx$/, '')}`;
                    document.title = titleText;
                    if (appWindow && typeof appWindow.setTitle === 'function') {
                        appWindow.setTitle(titleText);
                    }
                }
            }
        } catch (e) {
            console.error('Failed to rename item:', e);
            if (window.__TAURI__ && window.__TAURI__.dialog) {
                await window.__TAURI__.dialog.message(`名前変更に失敗しました: ${e}`, { title: 'エラー', type: 'error' });
            } else {
                alert(`名前変更に失敗しました: ${e}`);
            }
            nameSpan.textContent = originalText;
        }
    };

    const cancelRename = () => {
        if (finished) return;
        finished = true;
        nameSpan.textContent = originalText;
    };

    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            commitRename();
        } else if (e.key === 'Escape') {
            cancelRename();
        }
    });

    input.addEventListener('blur', () => {
        commitRename();
    });
}

export async function deleteItemInTree() {
    const targetPath = contextMenuTarget.filePath;
    const targetElement = contextMenuTarget.element;
    const fileName = contextMenuTarget.fileName;

    if (!targetPath) return;

    let confirmed = false;
    if (window.__TAURI__ && window.__TAURI__.dialog) {
        confirmed = await window.__TAURI__.dialog.ask(
            `「${fileName}」を削除してごみ箱に移動しますか？`,
            { title: '確認', type: 'warning' }
        );
    } else {
        confirmed = confirm(`「${fileName}」を削除してごみ箱に移動しますか？`);
    }

    if (!confirmed) return;

    try {
        await invoke('trash_file_or_dir', { filePath: targetPath });

        const parentPath = getParentPath(targetPath);
        const parentContainer = targetElement.parentElement;
        if (parentPath === "") {
            await loadDirectory(null, elements.fileTree);
        } else {
            await loadDirectory(parentPath, parentContainer);
        }

        await closeTabByPathWithoutSaving(targetPath);
    } catch (e) {
        console.error('Failed to delete item:', e);
        if (window.__TAURI__ && window.__TAURI__.dialog) {
            await window.__TAURI__.dialog.message(`削除に失敗しました: ${e}`, { title: 'エラー', type: 'error' });
        } else {
            alert(`削除に失敗しました: ${e}`);
        }
    }
}
