import { appState, elements } from '../state.js';
import { invoke, appWindow } from '../core/tauri.js';
import { normalizePathForComparison, getParentPath, getFileNameFromPath } from '../utils/helpers.js';
import { openExistingFile } from '../core/fileSystem.js';
import { closeTabByPathWithoutSaving, updateStatus, renderTabs } from './tabs.js';
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

// D&D移動時に該当するタブのパス情報を事前に更新し、タブの自動クローズを防ぐ
function preserveTabOnMove(srcPath, destParentPath) {
    if (!srcPath || !destParentPath) return;
    
    // パスを標準化して比較
    const normalizedSrc = normalizePathForComparison(srcPath);
    
    // 移動対象のファイル名を取得
    const fileName = getFileNameFromPath(srcPath);
    if (!fileName) return;

    // 移動後の新しいパスを作成
    const newPath = destParentPath.replace(/\\/g, '/').replace(/\/$/, '') + '/' + fileName;

    // アプリ状態から該当するタブを探す
    const tab = appState.tabs.find(t => normalizePathForComparison(t.filePath) === normalizedSrc);
    if (tab) {
        tab.filePath = newPath;
        tab.fileName = fileName;
        
        // タブリストの再描画
        if (typeof renderTabs === 'function') {
            renderTabs();
        }
    }
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
    clearSelection();
    selectedElement = element;
    selectedPath = path;
    selectedElement.classList.add('selected');
    if (selectedElement && typeof selectedElement.focus === 'function') {
        selectedElement.focus();
    }
}

async function handleGlobalKeyDown(e) {
    const activeEl = document.activeElement;
    if (
        activeEl &&
        (activeEl.tagName === 'INPUT' ||
         activeEl.tagName === 'TEXTAREA' ||
         activeEl.isContentEditable)
    ) {
        return;
    }

    if (!selectedPath || !selectedElement) {
        return;
    }

    if (e.key === 'Delete') {
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
    // ツリー内の要素がフォーカスを得た/失った際の状態遷移を一元管理
    elements.fileTree.addEventListener('focusin', (e) => {
        if (e.target.classList.contains('tree-item')) {
            selectedElement = e.target;
            selectedPath = e.target.dataset.filePath;
            makeSelectionActive();
        }
    });

    elements.fileTree.addEventListener('focusout', (e) => {
        setTimeout(() => {
            const activeEl = document.activeElement;
            const isTreeFocused = elements.fileTree && elements.fileTree.contains(activeEl);
            if (!isTreeFocused) {
                makeSelectionInactive();
            }
        }, 0);
    });

    // キー監視（Delete / Shift + Delete）
    document.addEventListener('keydown', handleGlobalKeyDown);

    // サイドバー全体へのドラッグオーバーとドロップを許可（余白部分へのドロップでルートへ移動するため）
    if (elements.sidebar) {
        elements.sidebar.addEventListener('dragover', (e) => {
            if (draggingPath) {
                e.preventDefault();
            }
        });

        elements.sidebar.addEventListener('drop', async (e) => {
            // 余白部分へのドロップかを判定（ツリーアイテム上ではない場合）
            if (!e.target.closest('.tree-item')) {
                e.preventDefault();
                e.stopPropagation();

                const srcPath = draggingPath;
                if (!srcPath) {
                    return;
                }

                // 移動先の親パスはルートディレクトリ
                const destParentPath = appState.homeFolder;
                if (!destParentPath) {
                    return;
                }

                const srcParent = getParentPath(srcPath);

                // 不正な移動チェック（JS側）
                if (srcPath === destParentPath || destParentPath === srcParent) {
                    return; 
                }

                const normalizedSrc = srcPath.replace(/\\/g, '/');
                const normalizedDest = destParentPath.replace(/\\/g, '/');
                if (normalizedDest === normalizedSrc || normalizedDest.startsWith(normalizedSrc + '/')) {
                    updateStatus('自分自身またはサブフォルダへは移動できません', 'error', true);
                    return;
                }

                // 移動前に該当するタブのパスを更新して維持する
                preserveTabOnMove(srcPath, destParentPath);

                try {
                    await invoke('move_file_or_dir', { sourcePath: srcPath, targetParentPath: destParentPath });
                    
                    // 再読み込み
                    await loadDirectory(null, elements.fileTree);

                    // 選択のクリア
                    clearSelection();

                    updateStatus('ルートへ移動しました');
                } catch (err) {
                    console.error('Failed to move file/dir to root:', err);
                    updateStatus(`移動に失敗しました: ${err}`, 'error', true);
                }
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
        await renderFileTree(files, parentElement, openFolders);
    } catch (e) {
        console.error('Failed to load directory:', e);
        parentElement.innerHTML = `<div class="tree-error">読み込みエラー: ${e}</div>`;
    }
}

export async function renderFileTree(files, container, openFolders = null) {
    const treeHadFocus = elements.fileTree && elements.fileTree.contains(document.activeElement);

    container.innerHTML = '';
    if (files.length === 0) {
        container.innerHTML = '<div class="tree-empty">フォルダは空です</div>';
        return;
    }

    for (const file of files) {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'tree-item';
        itemDiv.tabIndex = 0; // フォーカス可能にする
        // 以前の選択状態を復元（再描画時に選択が解除されるのを防ぐ）
        if (selectedPath && normalizePathForComparison(file.file_path) === normalizePathForComparison(selectedPath)) {
            selectedElement = itemDiv;
            if (treeHadFocus) {
                itemDiv.classList.add('selected');
                setTimeout(() => {
                    itemDiv.focus();
                }, 0);
            } else {
                itemDiv.classList.add('selected-inactive');
            }
        }        // 切り取り中の半透明状態を復元
        if (clipboardState.mode === 'cut' && clipboardState.path && normalizePathForComparison(file.file_path) === normalizePathForComparison(clipboardState.path)) {
            itemDiv.classList.add('cut-pending');
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

        // キーボード操作とショートカットのイベントリスナー
        itemDiv.addEventListener('keydown', async (e) => {
            // INPUTタグやTEXTAREA、あるいはインライン編集でのキー入力時は何もしない
            const activeEl = document.activeElement;
            if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA' || activeEl.isContentEditable)) {
                return;
            }

            const isDir = itemDiv.dataset.isDir === "true";
            const filePath = itemDiv.dataset.filePath;

            // 1. フォーカス・選択移動 (ArrowDown, ArrowUp, ArrowRight, ArrowLeft)
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                const allItems = Array.from(elements.fileTree.querySelectorAll('.tree-item'));
                const visibleItems = allItems.filter(isItemVisible);
                const currentIndex = visibleItems.indexOf(itemDiv);
                if (currentIndex !== -1 && currentIndex < visibleItems.length - 1) {
                    const nextItem = visibleItems[currentIndex + 1];
                    selectItem(nextItem, nextItem.dataset.filePath);
                    makeSelectionActive();
                    nextItem.focus();
                    nextItem.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
                }
            } 
            else if (e.key === 'ArrowUp') {
                e.preventDefault();
                const allItems = Array.from(elements.fileTree.querySelectorAll('.tree-item'));
                const visibleItems = allItems.filter(isItemVisible);
                const currentIndex = visibleItems.indexOf(itemDiv);
                if (currentIndex > 0) {
                    const prevItem = visibleItems[currentIndex - 1];
                    selectItem(prevItem, prevItem.dataset.filePath);
                    makeSelectionActive();
                    prevItem.focus();
                    prevItem.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
                }
            } 
            else if (e.key === 'ArrowRight') {
                if (isDir) {
                    e.preventDefault();
                    const childrenContainer = itemDiv.nextElementSibling;
                    if (childrenContainer && childrenContainer.classList.contains('tree-children')) {
                        const isHidden = childrenContainer.classList.contains('hidden');
                        if (isHidden) {
                            itemDiv.click(); // 展開
                        } else {
                            // すでに展開されている場合、最初の子要素を選択
                            const firstChild = childrenContainer.querySelector('.tree-item');
                            if (firstChild && isItemVisible(firstChild)) {
                                selectItem(firstChild, firstChild.dataset.filePath);
                                makeSelectionActive();
                                firstChild.focus();
                                firstChild.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
                            }
                        }
                    }
                }
            } 
            else if (e.key === 'ArrowLeft') {
                e.preventDefault();
                if (isDir) {
                    const childrenContainer = itemDiv.nextElementSibling;
                    if (childrenContainer && childrenContainer.classList.contains('tree-children') && !childrenContainer.classList.contains('hidden')) {
                        itemDiv.click(); // 折りたたむ
                        return;
                    }
                }
                // 親フォルダに移動
                const parentContainer = itemDiv.parentElement;
                if (parentContainer && parentContainer.classList.contains('tree-children')) {
                    const parentItem = parentContainer.previousElementSibling;
                    if (parentItem && parentItem.classList.contains('tree-item')) {
                        selectItem(parentItem, parentItem.dataset.filePath);
                        makeSelectionActive();
                        parentItem.focus();
                        parentItem.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
                    }
                }
            }
            // 2. 決定処理 (Enter)
            else if (e.key === 'Enter') {
                e.preventDefault();
                if (isDir) {
                    itemDiv.click();
                } else {
                    const tab = appState.tabs.find(t => normalizePathForComparison(t.filePath) === normalizePathForComparison(filePath));
                    const isCurrentlyActive = tab && tab.id === appState.currentTab;
                    if (!isCurrentlyActive) {
                        openFileFromTree(file);
                    }
                    // エディタへフォーカス
                    if (elements.editor) {
                        elements.editor.focus();
                    }
                }
            }
            // 3. エディタへフォーカスを戻す (Esc)
            else if (e.key === 'Escape') {
                e.preventDefault();
                if (clipboardState.mode === 'cut') {
                    clearClipboard();
                }
                if (elements.editor) {
                    elements.editor.focus();
                }
            }
            // 4. ショートカット操作 (Ctrl + N, Ctrl + D, F2, Ctrl + C, Ctrl + X, Ctrl + V)
            else if (e.ctrlKey) {
                if (e.key === 'n' || e.key === 'N' || e.code === 'KeyN') {
                    e.preventDefault();
                    // 新規ファイル作成
                    contextMenuTarget = {
                        filePath: filePath,
                        isDir: isDir,
                        fileName: itemDiv.dataset.fileName,
                        element: itemDiv
                    };
                    createNewItemInTree(false);
                } 
                else if (e.key === 'd' || e.key === 'D' || e.code === 'KeyD') {
                    e.preventDefault();
                    // 新規フォルダ作成
                    contextMenuTarget = {
                        filePath: filePath,
                        isDir: isDir,
                        fileName: itemDiv.dataset.fileName,
                        element: itemDiv
                    };
                    createNewItemInTree(true);
                } 
                else if (e.key === 'c' || e.key === 'C' || e.code === 'KeyC') {
                    e.preventDefault();
                    clearCutPendingStyles();
                    clipboardState.path = filePath;
                    clipboardState.isDir = isDir;
                    clipboardState.mode = 'copy';
                    updateStatus(`"${itemDiv.dataset.fileName}" をコピーしました`);
                } 
                else if (e.key === 'x' || e.key === 'X' || e.code === 'KeyX') {
                    e.preventDefault();
                    clearCutPendingStyles();
                    clipboardState.path = filePath;
                    clipboardState.isDir = isDir;
                    clipboardState.mode = 'cut';
                    itemDiv.classList.add('cut-pending');
                    updateStatus(`"${itemDiv.dataset.fileName}" を切り取りました`);
                }
                else if (e.key === 'v' || e.key === 'V' || e.code === 'KeyV') {
                    e.preventDefault();
                    if (!clipboardState.path) {
                        updateStatus('コピーまたは切り取りされたファイル/フォルダがありません', 'error', true);
                        return;
                    }
                    
                    let destParentPath = isDir ? filePath : getParentPath(filePath);
                    if (!destParentPath) {
                        destParentPath = appState.homeFolder;
                    }

                    const normalizedSrc = normalizePathForComparison(clipboardState.path).replace(/\\/g, '/');
                    const normalizedDest = normalizePathForComparison(destParentPath).replace(/\\/g, '/');

                    if (clipboardState.mode === 'cut') {
                        // 循環移動チェック
                        if (normalizedDest === normalizedSrc || normalizedDest.startsWith(normalizedSrc + '/')) {
                            updateStatus('自分自身またはサブフォルダへは移動できません', 'error', true);
                            return;
                        }

                        try {
                            updateStatus('移動中...');
                            const newPath = await invoke('move_file_or_dir', { sourcePath: clipboardState.path, targetParentPath: destParentPath });
                            
                            // 再読み込み
                            const openFolders = new Set();
                            elements.fileTree.querySelectorAll('.tree-children:not(.hidden)').forEach(el => {
                                const prev = el.previousElementSibling;
                                if (prev && prev.dataset.filePath) {
                                    openFolders.add(normalizePathForComparison(prev.dataset.filePath));
                                }
                            });
                            openFolders.add(normalizePathForComparison(destParentPath));
                            
                            await loadDirectory(null, elements.fileTree, openFolders);
                            clearSelection();
                            clearClipboard();

                            // 移動後の新ファイルを選択＆フォーカス
                            if (newPath) {
                                const normNewPath = normalizePathForComparison(newPath);
                                const items = elements.fileTree.querySelectorAll('.tree-item');
                                let targetEl = null;
                                for (const item of items) {
                                    if (normalizePathForComparison(item.dataset.filePath) === normNewPath) {
                                        targetEl = item;
                                        break;
                                    }
                                }
                                if (targetEl) {
                                    selectItem(targetEl, newPath);
                                    makeSelectionActive();
                                    targetEl.focus();
                                    targetEl.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
                                }
                            }
                            updateStatus('移動が完了しました');
                        } catch (err) {
                            console.error('Failed to move file/dir:', err);
                            updateStatus(`移動に失敗しました: ${err}`, 'error', true);
                        }
                    } else {
                        // 循環コピーチェック
                        if (clipboardState.isDir && (normalizedDest === normalizedSrc || normalizedDest.startsWith(normalizedSrc + '/'))) {
                            updateStatus('自分自身またはサブフォルダへはコピーできません', 'error', true);
                            return;
                        }

                        try {
                            updateStatus('貼り付け中...');
                            const newPath = await invoke('copy_file_or_dir', { sourcePath: clipboardState.path, targetParentPath: destParentPath });
                            
                            // 再読み込み
                            const openFolders = new Set();
                            elements.fileTree.querySelectorAll('.tree-children:not(.hidden)').forEach(el => {
                                const prev = el.previousElementSibling;
                                if (prev && prev.dataset.filePath) {
                                    openFolders.add(normalizePathForComparison(prev.dataset.filePath));
                                }
                            });
                            openFolders.add(normalizePathForComparison(destParentPath));
                            
                            await loadDirectory(null, elements.fileTree, openFolders);
                            clearSelection();

                            // コピー後の新ファイルを選択＆フォーカス
                            if (newPath) {
                                const normNewPath = normalizePathForComparison(newPath);
                                const items = elements.fileTree.querySelectorAll('.tree-item');
                                let targetEl = null;
                                for (const item of items) {
                                    if (normalizePathForComparison(item.dataset.filePath) === normNewPath) {
                                        targetEl = item;
                                        break;
                                    }
                                }
                                if (targetEl) {
                                    selectItem(targetEl, newPath);
                                    makeSelectionActive();
                                    targetEl.focus();
                                    targetEl.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
                                }
                            }
                            updateStatus('貼り付けが完了しました');
                        } catch (err) {
                            console.error('Failed to copy file/dir:', err);
                            updateStatus(`コピーに失敗しました: ${err}`, 'error', true);
                        }
                    }
                }
            } 
            else if (e.key === 'F2') {
                e.preventDefault();
                // インライン名前変更
                contextMenuTarget = {
                    filePath: filePath,
                    isDir: isDir,
                    fileName: itemDiv.dataset.fileName,
                    element: itemDiv
                };
                startRenameInTree();
            }
        });

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
            e.stopPropagation();
            
            const cleanPath = cleanPathForDnD(file.file_path);
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/plain', cleanPath);
            draggingPath = cleanPath;
            draggingIsDir = file.is_dir;

            // ダミードラッグイメージを設定（Chromiumでの即時キャンセルのハック）
            if (e.dataTransfer.setDragImage) {
                const img = new Image();
                img.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
                e.dataTransfer.setDragImage(img, 0, 0);
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
                }
            }
        });

        itemDiv.addEventListener('dragleave', (e) => {
            e.stopPropagation();
            itemDiv.classList.remove('drag-hover');
        });

        itemDiv.addEventListener('dragend', (e) => {
            e.stopPropagation();
            document.querySelectorAll('.tree-item').forEach(el => el.classList.remove('drag-hover'));
            draggingPath = null;
        });

        itemDiv.addEventListener('drop', async (e) => {
            e.preventDefault();
            e.stopPropagation();
            itemDiv.classList.remove('drag-hover');

            const srcPath = draggingPath || e.dataTransfer.getData('text/plain');
            if (!srcPath) {
                return;
            }

            const targetPath = itemDiv.dataset.filePath;
            const targetIsDir = itemDiv.dataset.isDir === "true";

            let destParentPath = "";
            if (targetIsDir) {
                destParentPath = targetPath;
            } else {
                destParentPath = getParentPath(targetPath);
            }

            const srcParent = getParentPath(srcPath);

            // 不正な移動チェック（JS側）
            if (srcPath === destParentPath || destParentPath === srcParent) {
                return; 
            }

            const normalizedSrc = srcPath.replace(/\\/g, '/');
            const normalizedDest = destParentPath.replace(/\\/g, '/');
            if (normalizedDest === normalizedSrc || normalizedDest.startsWith(normalizedSrc + '/')) {
                updateStatus('自分自身またはサブフォルダへは移動できません', 'error', true);
                return;
            }

            // 移動前に該当するタブのパスを更新して維持する
            preserveTabOnMove(srcPath, destParentPath);

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
                await loadDirectory(file.file_path, childrenContainer, openFolders);
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
                    if (elements.editor) {
                        elements.editor.focus();
                    }
                } else {
                    itemDiv.focus();
                }

                document.querySelectorAll('.tree-item').forEach(el => el.classList.remove('active'));
                itemDiv.classList.add('active');
            });
            container.appendChild(itemDiv);
        }
    }
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
                if (elements.editor) {
                    elements.editor.focus();
                }
            } else {
                if (newPath) {
                    const normNewPath = normalizePathForComparison(newPath);
                    const items = elements.fileTree.querySelectorAll('.tree-item');
                    let targetEl = null;
                    for (const item of items) {
                        if (normalizePathForComparison(item.dataset.filePath) === normNewPath) {
                            targetEl = item;
                            break;
                        }
                    }
                    if (targetEl) {
                        selectItem(targetEl, newPath);
                        makeSelectionActive();
                        targetEl.focus();
                    }
                }
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
        if (parentPath) {
            const normParent = normalizePathForComparison(parentPath);
            const items = elements.fileTree.querySelectorAll('.tree-item');
            let targetEl = null;
            for (const item of items) {
                if (normalizePathForComparison(item.dataset.filePath) === normParent) {
                    targetEl = item;
                    break;
                }
            }
            if (targetEl) {
                selectItem(targetEl, parentPath);
                makeSelectionActive();
                targetEl.focus();
            }
        } else {
            const firstItem = elements.fileTree.querySelector('.tree-item');
            if (firstItem) {
                selectItem(firstItem, firstItem.dataset.filePath);
                makeSelectionActive();
                firstItem.focus();
            }
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
            if (targetElement) {
                selectItem(targetElement, targetPath);
                makeSelectionActive();
                targetElement.focus();
            }
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

            if (newPath) {
                const normNewPath = normalizePathForComparison(newPath);
                const items = elements.fileTree.querySelectorAll('.tree-item');
                let targetEl = null;
                for (const item of items) {
                    if (normalizePathForComparison(item.dataset.filePath) === normNewPath) {
                        targetEl = item;
                        break;
                    }
                }
                if (targetEl) {
                    selectItem(targetEl, newPath);
                    makeSelectionActive();
                    targetEl.focus();
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
            if (targetElement) {
                selectItem(targetElement, targetPath);
                makeSelectionActive();
                targetElement.focus();
            }
        }
    };

    const cancelRename = () => {
        if (finished) return;
        finished = true;
        nameSpan.textContent = originalText;
        if (targetElement) {
            selectItem(targetElement, targetPath);
            makeSelectionActive();
            targetElement.focus();
        }
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

    // 次にフォーカスするアイテムのパスを決定
    let nextFocusPath = null;
    if (targetElement) {
        let nextFocusEl = null;
        let sibling = targetElement.nextElementSibling;
        while (sibling) {
            if (sibling.classList.contains('tree-item')) {
                nextFocusEl = sibling;
                break;
            }
            sibling = sibling.nextElementSibling;
        }
        if (!nextFocusEl) {
            sibling = targetElement.previousElementSibling;
            while (sibling) {
                if (sibling.classList.contains('tree-item')) {
                    nextFocusEl = sibling;
                    break;
                }
                sibling = sibling.previousElementSibling;
            }
        }
        if (!nextFocusEl) {
            const parentContainer = targetElement.parentElement;
            if (parentContainer && parentContainer.classList.contains('tree-children')) {
                const parentItem = parentContainer.previousElementSibling;
                if (parentItem && parentItem.classList.contains('tree-item')) {
                    nextFocusEl = parentItem;
                }
            }
        }
        if (nextFocusEl) {
            nextFocusPath = nextFocusEl.dataset.filePath;
        }
    }

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

        // 次のアイテムを選択＆フォーカス
        if (nextFocusPath) {
            const normPath = normalizePathForComparison(nextFocusPath);
            const items = elements.fileTree.querySelectorAll('.tree-item');
            let targetEl = null;
            for (const item of items) {
                if (normalizePathForComparison(item.dataset.filePath) === normPath) {
                    targetEl = item;
                    break;
                }
            }
            if (targetEl) {
                selectItem(targetEl, nextFocusPath);
                makeSelectionActive();
                targetEl.focus();
            } else {
                const firstItem = elements.fileTree.querySelector('.tree-item');
                if (firstItem) {
                    selectItem(firstItem, firstItem.dataset.filePath);
                    makeSelectionActive();
                    firstItem.focus();
                }
            }
        } else {
            const firstItem = elements.fileTree.querySelector('.tree-item');
            if (firstItem) {
                selectItem(firstItem, firstItem.dataset.filePath);
                makeSelectionActive();
                firstItem.focus();
            }
        }
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

    // 次にフォーカスするアイテムのパスを決定
    let nextFocusPath = null;
    if (targetElement) {
        let nextFocusEl = null;
        let sibling = targetElement.nextElementSibling;
        while (sibling) {
            if (sibling.classList.contains('tree-item')) {
                nextFocusEl = sibling;
                break;
            }
            sibling = sibling.nextElementSibling;
        }
        if (!nextFocusEl) {
            sibling = targetElement.previousElementSibling;
            while (sibling) {
                if (sibling.classList.contains('tree-item')) {
                    nextFocusEl = sibling;
                    break;
                }
                sibling = sibling.previousElementSibling;
            }
        }
        if (!nextFocusEl) {
            const parentContainer = targetElement.parentElement;
            if (parentContainer && parentContainer.classList.contains('tree-children')) {
                const parentItem = parentContainer.previousElementSibling;
                if (parentItem && parentItem.classList.contains('tree-item')) {
                    nextFocusEl = parentItem;
                }
            }
        }
        if (nextFocusEl) {
            nextFocusPath = nextFocusEl.dataset.filePath;
        }
    }

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

        // 次のアイテムを選択＆フォーカス
        if (nextFocusPath) {
            const normPath = normalizePathForComparison(nextFocusPath);
            const items = elements.fileTree.querySelectorAll('.tree-item');
            let targetEl = null;
            for (const item of items) {
                if (normalizePathForComparison(item.dataset.filePath) === normPath) {
                    targetEl = item;
                    break;
                }
            }
            if (targetEl) {
                selectItem(targetEl, nextFocusPath);
                makeSelectionActive();
                targetEl.focus();
            } else {
                const firstItem = elements.fileTree.querySelector('.tree-item');
                if (firstItem) {
                    selectItem(firstItem, firstItem.dataset.filePath);
                    makeSelectionActive();
                    firstItem.focus();
                }
            }
        } else {
            const firstItem = elements.fileTree.querySelector('.tree-item');
            if (firstItem) {
                selectItem(firstItem, firstItem.dataset.filePath);
                makeSelectionActive();
                firstItem.focus();
            }
        }

        updateStatus('完全に削除しました');
    } catch (e) {
        console.error('Failed to permanently delete item:', e);
        updateStatus(`削除に失敗しました: ${e}`, 'error', true);
    }
}

// クリップボード用の状態管理 (コピー / 切り取り)
export let clipboardState = {
    path: null,
    isDir: false,
    mode: null // 'copy' または 'cut'
};

export function clearCutPendingStyles() {
    elements.fileTree.querySelectorAll('.tree-item.cut-pending').forEach(el => {
        el.classList.remove('cut-pending');
    });
}

export function clearClipboard() {
    clipboardState.path = null;
    clipboardState.isDir = false;
    clipboardState.mode = null;
    clearCutPendingStyles();
}

function isItemVisible(el) {
    let parent = el.parentElement;
    while (parent && parent !== elements.fileTree) {
        if (parent.classList.contains('tree-children') && parent.classList.contains('hidden')) {
            return false;
        }
        parent = parent.parentElement;
    }
    return true;
}

export async function focusSidebarTree() {
    // もしツリーが非表示なら開く
    if (!appState.sidebarVisible) {
        appState.sidebarVisible = true;
        if (elements.sidebar) {
            elements.sidebar.classList.remove('hidden');
        }
        if (elements.sidebarResizeHandle) {
            elements.sidebarResizeHandle.classList.remove('hidden');
        }
        if (elements.iconBar) {
            elements.iconBar.style.width = 'var(--sidebar-width)';
        }
        saveSettingsDelay();
    }

    // 現在アクティブなタブの実ファイルを探す
    let activeFilePath = null;
    if (appState.tabs && appState.currentTab) {
        const activeTab = appState.tabs.find(t => t.id === appState.currentTab);
        if (activeTab && activeTab.filePath) {
            activeFilePath = activeTab.filePath;
        }
    }

    if (activeFilePath) {
        const normActive = normalizePathForComparison(activeFilePath).replace(/\\/g, '/');
        const homeNorm = normalizePathForComparison(appState.homeFolder).replace(/\\/g, '/');
        
        if (normActive.startsWith(homeNorm)) {
            // 親フォルダのパスを全て収集
            const openFolders = new Set();
            elements.fileTree.querySelectorAll('.tree-children:not(.hidden)').forEach(el => {
                const prev = el.previousElementSibling;
                if (prev && prev.dataset.filePath) {
                    openFolders.add(normalizePathForComparison(prev.dataset.filePath));
                }
            });

            const relativePart = normActive.substring(homeNorm.length).replace(/^\//, '');
            const segments = relativePart.split('/');
            
            let currentPath = homeNorm;
            for (let i = 0; i < segments.length - 1; i++) {
                currentPath = (currentPath + '/' + segments[i]).replace(/\/$/, '');
                openFolders.add(normalizePathForComparison(currentPath));
            }

            // ツリー全体を再描画（自動展開される）
            await loadDirectory(null, elements.fileTree, openFolders);

            const normTarget = normalizePathForComparison(activeFilePath);
            const items = elements.fileTree.querySelectorAll('.tree-item');
            let targetEl = null;
            for (const item of items) {
                if (normalizePathForComparison(item.dataset.filePath) === normTarget) {
                    targetEl = item;
                    break;
                }
            }

            if (targetEl) {
                selectItem(targetEl, activeFilePath);
                makeSelectionActive();
                targetEl.focus();
                targetEl.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
                return;
            }
        }
    }

    // 開いている実ファイルがない場合は先頭のアイテムを選択
    const firstItem = elements.fileTree.querySelector('.tree-item');
    if (firstItem) {
        selectItem(firstItem, firstItem.dataset.filePath);
        makeSelectionActive();
        firstItem.focus();
        firstItem.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
}

export async function createItemGlobally(isDir) {
    const activeEl = document.activeElement;
    // フォーカスがツリー上のアイテムにない、またはサイドバーが非表示の場合はルート直下に作成する
    const isTreeFocused = activeEl && activeEl.classList.contains('tree-item');
    const shouldCreateAtRoot = !appState.sidebarVisible || !isTreeFocused;

    // 1. ツリーが閉じていれば開く
    if (!appState.sidebarVisible) {
        appState.sidebarVisible = true;
        if (elements.sidebar) {
            elements.sidebar.classList.remove('hidden');
        }
        if (elements.sidebarResizeHandle) {
            elements.sidebarResizeHandle.classList.remove('hidden');
        }
        if (elements.iconBar) {
            elements.iconBar.style.width = 'var(--sidebar-width)';
        }
        saveSettingsDelay();
    }

    // 2. 現在選択されているアイテムがあればそれを対象にする。無ければルート直下（contextMenuTargetをクリア）
    if (!shouldCreateAtRoot && selectedElement && selectedPath) {
        contextMenuTarget = {
            filePath: selectedPath,
            isDir: selectedElement.dataset.isDir === "true",
            fileName: selectedElement.dataset.fileName,
            element: selectedElement
        };
    } else {
        contextMenuTarget = {
            filePath: null,
            isDir: false,
            fileName: null,
            element: null
        };
    }

    // 3. インライン作成開始
    createNewItemInTree(isDir);
}
