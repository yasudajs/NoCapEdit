import { appState, elements } from '../state.js';
import { invoke, appWindow } from '../core/tauri.js';
import { normalizePathForComparison, getParentPath } from '../utils/helpers.js';
import { openExistingFile } from '../core/fileSystem.js';
import { closeTabByPathWithoutSaving, updateStatus } from './tabs.js';
import { saveSettingsDelay } from './settings.js';

// コンテキストメニュー関連の状態管理
export let contextMenuTarget = {
    filePath: null,
    isDir: false,
    fileName: null,
    element: null
};

// 選択中アイテムの状態管理
export let selectedPath = null;
export let selectedElement = null;

// ドラッグ＆ドロップ用の一時状態
let draggingPath = null;
let draggingIsDir = false;

// パスから \\?\ プレフィックスを取り除くヘルパー（Windows OLE D&Dのキャンセル防止）
function cleanPathForDnD(path) {
    if (!path) return '';
    return path.replace(/^\\\\\?\\/, '');
}

// 選択状態の操作ヘルパー
export function clearSelection() {
    if (selectedElement) {
        selectedElement.classList.remove('selected', 'selected-inactive');
    }
    selectedPath = null;
    selectedElement = null;
}

export function makeSelectionInactive() {
    if (selectedElement) {
        selectedElement.classList.remove('selected');
        selectedElement.classList.add('selected-inactive');
    }
}

export function makeSelectionActive() {
    if (selectedElement) {
        selectedElement.classList.remove('selected-inactive');
        selectedElement.classList.add('selected');
    }
}

export function selectItem(element, path) {
    console.log('selectItem called for:', path);
    clearSelection();
    selectedElement = element;
    selectedPath = path;
    selectedElement.classList.add('selected');
    if (selectedElement && typeof selectedElement.focus === 'function') {
        selectedElement.focus();
        console.log('selectedElement focused, activeElement is now:', document.activeElement ? `${document.activeElement.tagName}.${document.activeElement.className}` : 'none');
    } else {
        console.log('selectedElement focus failed or not supported');
    }
}

async function handleGlobalKeyDown(e) {
    console.log('handleGlobalKeyDown:', e.key, 'ctrl:', e.ctrlKey, 'shift:', e.shiftKey, 'activeElement:', document.activeElement ? `${document.activeElement.tagName}.${document.activeElement.className}` : 'none');
    const activeEl = document.activeElement;
    if (
        activeEl &&
        (activeEl.tagName === 'INPUT' ||
         activeEl.tagName === 'TEXTAREA' ||
         activeEl.isContentEditable)
    ) {
        console.log('Keydown ignored because focus is in input/textarea');
        return;
    }

    if (!selectedPath || !selectedElement) {
        console.log('Keydown ignored because selectedPath or selectedElement is null:', { selectedPath, selectedElement: !!selectedElement });
        return;
    }

    if (e.key === 'Delete') {
        console.log('Delete key pressed, shiftKey:', e.shiftKey);
        e.preventDefault();
        if (e.shiftKey) {
            await deleteItemPermanentlyInTree(selectedPath, selectedElement);
        } else {
            const prevTarget = { ...contextMenuTarget };
            contextMenuTarget = {
                filePath: selectedPath,
                isDir: selectedElement.dataset.isDir === "true",
                fileName: selectedElement.dataset.fileName,
                element: selectedElement
            };
            await deleteItemInTree();
            contextMenuTarget = prevTarget;
        }
    }
}

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

    // サイドバー背景クリックで選択解除
    elements.sidebar.addEventListener('click', (e) => {
        if (!e.target.closest('.tree-item')) {
            clearSelection();
        }
    });

    // エディタ（またはサイドバー外）をクリックした際、選択ハイライトを非アクティブ表示（薄いグレー）にする
    document.addEventListener('click', (e) => {
        if (elements.sidebar && !elements.sidebar.contains(e.target)) {
            makeSelectionInactive();
        }
    });

    // エディタがフォーカスを得た際、選択ハイライトを非アクティブ表示（薄いグレー）にする
    if (elements.editor) {
        elements.editor.addEventListener('focus', () => {
            makeSelectionInactive();
        });
    }

    // キー監視（Delete / Shift + Delete）
    document.addEventListener('keydown', handleGlobalKeyDown);

    // ファイルツリーコンテナへのドラッグオーバーを許可
    if (elements.fileTree) {
        elements.fileTree.addEventListener('dragover', (e) => {
            if (draggingPath) {
                e.preventDefault();
            }
        });
    }
}

export async function loadDirectory(path, parentElement, openFolders = null) {
    if (!openFolders && parentElement) {
        openFolders = new Set();
        parentElement.querySelectorAll('.tree-children:not(.hidden)').forEach(el => {
            const prev = el.previousElementSibling;
            if (prev && prev.dataset.filePath) {
                openFolders.add(normalizePathForComparison(prev.dataset.filePath));
            }
        });
    }

    try {
        const files = await invoke('read_directory', { path });
        renderFileTree(files, parentElement, openFolders);
    } catch (e) {
        console.error('Failed to load directory:', e);
        parentElement.innerHTML = `<div class="tree-error">読み込みエラー: ${e}</div>`;
    }
}

export function renderFileTree(files, container, openFolders = null) {
    container.innerHTML = '';
    if (files.length === 0) {
        container.innerHTML = '<div class="tree-empty">フォルダは空です</div>';
        return;
    }

    files.forEach(file => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'tree-item';
        itemDiv.tabIndex = 0; // フォーカス可能にする
        
        // 以前の選択状態を復元（再描画時に選択が解除されるのを防ぐ）
        if (selectedPath && normalizePathForComparison(file.file_path) === normalizePathForComparison(selectedPath)) {
            selectedElement = itemDiv;
            itemDiv.classList.add('selected');
        }

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

        // 右クリックで選択状態にする
        itemDiv.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            e.stopPropagation();
            selectItem(itemDiv, file.file_path);
            makeSelectionActive();
            showContextMenu(e, file.file_path, file.is_dir, file.file_name, itemDiv);
        });

        // ドラッグ＆ドロップ設定
        itemDiv.setAttribute('draggable', 'true');

        itemDiv.addEventListener('dragstart', (e) => {
            console.log('dragstart fired for:', file.file_path);
            e.stopPropagation();
            
            const cleanPath = cleanPathForDnD(file.file_path);
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/plain', cleanPath);
            draggingPath = cleanPath;
            draggingIsDir = file.is_dir;
            console.log('draggingPath set to (clean):', draggingPath);

            // ダミードラッグイメージを設定（Chromiumでの即時キャンセルのハック）
            if (e.dataTransfer.setDragImage) {
                const img = new Image();
                img.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
                e.dataTransfer.setDragImage(img, 0, 0);
                console.log('Dummy drag image set');
            }
        });

        itemDiv.addEventListener('dragover', (e) => {
            if (!draggingPath) {
                return; 
            }
            e.preventDefault();
            e.stopPropagation();

            const targetPath = itemDiv.dataset.filePath;
            const targetIsDir = itemDiv.dataset.isDir === "true";

            // ドラッグ元の親
            const srcParent = getParentPath(draggingPath);
            // 移動先親
            const destParent = targetIsDir ? targetPath : getParentPath(targetPath);

            // 循環移動、自分自身、現在の親フォルダと同一の場合はドロップ不可
            if (draggingPath === targetPath || 
                destParent === draggingPath ||
                destParent.startsWith(draggingPath + "/") || 
                destParent === srcParent) {
                e.dataTransfer.dropEffect = 'none';
                return;
            }

            e.dataTransfer.dropEffect = 'move';
        });

        itemDiv.addEventListener('dragenter', (e) => {
            if (!draggingPath) return; 
            console.log('dragenter targetPath:', itemDiv.dataset.filePath);
            e.preventDefault();
            e.stopPropagation();

            const targetIsDir = itemDiv.dataset.isDir === "true";
            if (targetIsDir) {
                const targetPath = itemDiv.dataset.filePath;
                const srcParent = getParentPath(draggingPath);
                
                if (draggingPath !== targetPath && 
                    !targetPath.startsWith(draggingPath + "/") && 
                    targetPath !== srcParent) {
                    itemDiv.classList.add('drag-hover');
                    console.log('drag-hover class added to target');
                }
            }
        });

        itemDiv.addEventListener('dragleave', (e) => {
            e.stopPropagation();
            itemDiv.classList.remove('drag-hover');
        });

        itemDiv.addEventListener('dragend', (e) => {
            console.log('dragend fired');
            e.stopPropagation();
            document.querySelectorAll('.tree-item').forEach(el => el.classList.remove('drag-hover'));
            draggingPath = null;
        });

        itemDiv.addEventListener('drop', async (e) => {
            console.log('drop event fired');
            e.preventDefault();
            e.stopPropagation();
            itemDiv.classList.remove('drag-hover');

            const srcPath = draggingPath || e.dataTransfer.getData('text/plain');
            console.log('drop srcPath:', srcPath);
            if (!srcPath) {
                console.log('drop canceled: srcPath is empty');
                return;
            }

            const targetPath = itemDiv.dataset.filePath;
            const targetIsDir = itemDiv.dataset.isDir === "true";
            console.log('drop targetPath:', targetPath, 'isDir:', targetIsDir);

            let destParentPath = "";
            if (targetIsDir) {
                destParentPath = targetPath;
            } else {
                destParentPath = getParentPath(targetPath);
            }

            const srcParent = getParentPath(srcPath);

            // 不正な移動チェック（JS側）
            if (srcPath === destParentPath || destParentPath === srcParent) {
                console.log('drop canceled: identical parent or path');
                return; 
            }

            const normalizedSrc = srcPath.replace(/\\/g, '/');
            const normalizedDest = destParentPath.replace(/\\/g, '/');
            if (normalizedDest === normalizedSrc || normalizedDest.startsWith(normalizedSrc + '/')) {
                console.log('drop canceled: moving to self or descendant');
                updateStatus('自分自身またはサブフォルダへは移動できません', 'error', true);
                return;
            }

            try {
                await invoke('move_file_or_dir', { sourcePath: srcPath, targetParentPath: destParentPath });
                
                // 再読み込み
                await loadDirectory(null, elements.fileTree);

                // 選択のクリア
                clearSelection();

                updateStatus('移動しました');
            } catch (err) {
                console.error('Failed to move file/dir:', err);
                updateStatus(`移動に失敗しました: ${err}`, 'error', true);
            }
        });

        if (file.is_dir) {
            const childrenContainer = document.createElement('div');
            childrenContainer.className = 'tree-children hidden';
            
            itemDiv.addEventListener('click', async (e) => {
                e.stopPropagation();
                selectItem(itemDiv, file.file_path);
                makeSelectionActive();
                
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

            if (openFolders && openFolders.has(normalizePathForComparison(file.file_path))) {
                childrenContainer.classList.remove('hidden');
                iconSpan.textContent = '📂';
                childrenContainer.innerHTML = '<div class="tree-loading">読み込み中...</div>';
                loadDirectory(file.file_path, childrenContainer, openFolders);
            }
        } else {
            // 開いているファイルがアクティブであるかのチェック
            const tab = appState.tabs.find(t => normalizePathForComparison(t.filePath) === normalizePathForComparison(file.file_path));
            if (tab && tab.id === appState.currentTab) {
                itemDiv.classList.add('active');
            }

            itemDiv.addEventListener('click', (e) => {
                e.stopPropagation();
                
                const tab = appState.tabs.find(t => normalizePathForComparison(t.filePath) === normalizePathForComparison(file.file_path));
                const isCurrentlyActive = tab && tab.id === appState.currentTab;

                selectItem(itemDiv, file.file_path);
                makeSelectionActive();
                
                if (!isCurrentlyActive) {
                    openFileFromTree(file);
                } else {
                    console.log('File is already active, keeping focus on tree item');
                }
                
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

export async function deleteItemPermanentlyInTree(targetPath, targetElement) {
    if (!targetPath || !targetElement) return;

    const fileName = targetElement.dataset.fileName;
    let confirmed = false;
    if (window.__TAURI__ && window.__TAURI__.dialog) {
        confirmed = await window.__TAURI__.dialog.ask(
            `「${fileName}」をごみ箱に入れず、完全に削除しますか？\n※この操作は取り消せません。`,
            { title: '警告', type: 'warning' }
        );
    } else {
        confirmed = confirm(`「${fileName}」をごみ箱に入れず、完全に削除しますか？\n※この操作は取り消せません。`);
    }

    if (!confirmed) return;

    try {
        await invoke('delete_file_or_dir_permanently', { filePath: targetPath });

        const parentPath = getParentPath(targetPath);
        const parentContainer = targetElement.parentElement;
        if (parentPath === "") {
            await loadDirectory(null, elements.fileTree);
        } else {
            await loadDirectory(parentPath, parentContainer);
        }

        clearSelection();

        await closeTabByPathWithoutSaving(targetPath);

        updateStatus('完全に削除しました');
    } catch (e) {
        console.error('Failed to permanently delete item:', e);
        updateStatus(`削除に失敗しました: ${e}`, 'error', true);
    }
}
