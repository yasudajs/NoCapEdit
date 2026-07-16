import { appState, elements, incrementUnsavedTabCounter } from '../state.js';
import { generateTabId, isAutoCreatedFileName, normalizePathForComparison } from '../utils/helpers.js';
import { ensureTauriApi } from '../core/tauri.js';
import { persistTabWithRecovery } from '../core/fileSystem.js';
import { updateEditorMetrics } from './editor.js';

export function getCurrentTab() {
    if (!appState.currentTab) {
        return null;
    }
    return appState.tabs.find((t) => t.id === appState.currentTab) || null;
}

export function formatTabDisplayName(fileName) {
    if (/^(\[)?未保存\d+(\])?$/.test(fileName)) {
        return fileName;
    }
    if (isAutoCreatedFileName(fileName)) {
        const match = fileName.match(/^(\d{4})(\d{2})(\d{2})_(\d{2})(\d{2})(\d{2})(?:_(\d{2}))?\.nctx$/);
        if (match) {
            const [_, year, month, day, hour, min, sec, index] = match;
            let formatted = `${year}/${month}/${day} ${hour}:${min}:${sec}`;
            if (index) {
                const numIdx = parseInt(index, 10);
                formatted += `-${numIdx}`;
            }
            if (appState.saveMode === 'manual') {
                formatted = `[${formatted}]`;
            }
            return formatted;
        }
    }

    const lastDotIdx = fileName.lastIndexOf('.');
    if (lastDotIdx <= 0) {
        return fileName;
    }
    return fileName.substring(0, lastDotIdx);
}

// ステータス更新
export function updateStatus(message, status = 'normal', bypassPrefix = false) {
    let displayMessage = message;
    if (appState.saveMode === 'manual' && !bypassPrefix) {
        displayMessage = `[手動保存モード] ${message}`;
    }
    if (elements.statusText) {
        elements.statusText.textContent = displayMessage;
        elements.statusText.className = 'status-text';
        if (status !== 'normal') {
            elements.statusText.classList.add(status);
        }
    }
}

// タブ個別ステータス表示用ヘルパー
export function updateTabStatus(tab, state = null, statusType = 'normal') {
    if (!tab) return;

    let targetState = state;
    if (!targetState) {
        if (tab.isSaving) {
            targetState = '保存中...';
        } else if (tab.isDirty) {
            targetState = '編集中';
        } else {
            targetState = '保存済み';
        }
    }

    if (!tab.filePath) {
        // ファイル未作成（初期状態）
        if (appState.saveMode === 'manual') {
            updateStatus('※Ctrl+Sで保存できます', statusType);
        } else {
            updateStatus('保存準備完了', statusType);
        }
    } else {
        // ファイル作成済み
        let prefix = '';
        if (appState.saveMode === 'manual') {
            prefix = '[手動保存:Ctrl+S] ';
        }
        updateStatus(`${prefix}${tab.fileName} - ${targetState}`, statusType, true);
    }
}

// 新規タブ作成
export async function createNewTab() {
    if (!appState.homeFolder) {
        updateStatus('ホームフォルダ未設定', 'error');
        return;
    }

    try {
        if (!ensureTauriApi()) {
            return;
        }

        const currentUnsaved = incrementUnsavedTabCounter();
        let fileName = '';
        let filePath = '';

        if (appState.saveMode === 'manual') {
            fileName = `[未保存${currentUnsaved}]`;
        } else {
            fileName = `未保存${currentUnsaved}`;
        }

        const tab = {
            id: generateTabId(),
            fileName: fileName,
            filePath: filePath,
            content: '',
            isDirty: false,
            isSaving: false,
            savePromise: null,
            createdTimestamp: '',
            unsavedNumber: currentUnsaved,
        };

        appState.tabs.push(tab);
        await switchTab(tab.id);
        renderTabs();
    } catch (error) {
        console.error('Failed to create new file:', error);
        updateStatus('新規ファイル作成失敗', 'error');
    }
}

// タブ切り替え
export async function switchTab(tabId) {
    try {
        // 前のタブを保存
        if (appState.currentTab) {
            const currentIdx = appState.tabs.findIndex(t => t.id === appState.currentTab);
            if (currentIdx !== -1) {
                if (elements.editor) {
                    appState.tabs[currentIdx].content = elements.editor.value;
                    
                    // 切り替え前のタブのカーソル状態を記憶
                    appState.tabs[currentIdx].cursorState = {
                        selectionStart: elements.editor.selectionStart || 0,
                        selectionEnd: elements.editor.selectionEnd || 0,
                        scrollTop: elements.editor.scrollTop || 0,
                    };
                }

                const ok = await persistTabWithRecovery(appState.tabs[currentIdx], 'tab-switch');
                if (!ok) {
                    return;
                }
            }
        }

        // 新しいタブに切り替え
        appState.currentTab = tabId;
        const tab = appState.tabs.find(t => t.id === tabId);

        if (tab) {
            if (elements.editor) {
                elements.editor.value = tab.content;
            }
            renderTabs();
            updateEditorMetrics();
            updateTabStatus(tab);

            // エディタにフォーカスを戻し、カーソル状態を復元する
            if (elements.editor) {
                elements.editor.focus();
                
                if (tab.cursorState) {
                    // 記憶されたカーソル位置とスクロール位置を復元
                    elements.editor.selectionStart = tab.cursorState.selectionStart;
                    elements.editor.selectionEnd = tab.cursorState.selectionEnd;
                    elements.editor.scrollTop = tab.cursorState.scrollTop;
                } else {
                    // 記憶がない場合（新規タブなど）は、テキストの末尾にカーソルを設定
                    const len = elements.editor.value.length;
                    elements.editor.selectionStart = len;
                    elements.editor.selectionEnd = len;
                    elements.editor.scrollTop = 0;
                }
            }
        }
    } catch (error) {
        console.error('Failed to switch tab:', error);
        updateStatus('タブ切替失敗', 'error');
    }
}

// タブを削除
export async function closeTab(tabId) {
    const idx = appState.tabs.findIndex(t => t.id === tabId);

    if (idx === -1) return;

    const tab = appState.tabs[idx];
    const ok = await persistTabWithRecovery(tab, 'tab-close');
    if (!ok) {
        return;
    }

    appState.tabs.splice(idx, 1);

    if (appState.currentTab === tabId) {
        if (appState.tabs.length > 0) {
            await switchTab(appState.tabs[0].id);
        } else {
            appState.currentTab = null;
            if (elements.editor) {
                elements.editor.value = '';
            }
            await createNewTab();
        }
    }

    renderTabs();
    updateEditorMetrics();
}

// 削除されたファイルのタブを保存をスキップして強制的に閉じる
export async function closeTabByPathWithoutSaving(filePath) {
    const targetNormalized = normalizePathForComparison(filePath);
    const idx = appState.tabs.findIndex(t => {
        return normalizePathForComparison(t.filePath) === targetNormalized && targetNormalized !== '';
    });
    if (idx === -1) return;

    const tab = appState.tabs[idx];
    appState.tabs.splice(idx, 1);

    if (appState.currentTab === tab.id) {
        if (appState.tabs.length > 0) {
            await switchTab(appState.tabs[0].id);
        } else {
            appState.currentTab = null;
            if (elements.editor) {
                elements.editor.value = '';
            }
            await createNewTab();
        }
    }

    renderTabs();
    updateEditorMetrics();
}

// タブを再描画
export function renderTabs() {
    if (!elements.tabsContainer) return;

    elements.tabsContainer.innerHTML = '';

    appState.tabs.forEach(tab => {
        const tabEl = document.createElement('div');
        tabEl.className = 'tab' + (tab.id === appState.currentTab ? ' active' : '');

        const nameEl = document.createElement('span');
        nameEl.className = 'tab-name';
        if (tab.isDirty) {
            nameEl.classList.add('dirty');
        }
        nameEl.textContent = formatTabDisplayName(tab.fileName);

        const closeEl = document.createElement('span');
        closeEl.className = 'tab-close';
        closeEl.textContent = '×';
        closeEl.addEventListener('click', (e) => {
            e.stopPropagation();
            closeTab(tab.id);
        });

        tabEl.appendChild(nameEl);
        tabEl.appendChild(closeEl);
        elements.tabsContainer.appendChild(tabEl);
    });

    // アクティブなタブを可視領域へ自動スクロールする
    const activeTab = elements.tabsContainer.querySelector('.tab.active');
    if (activeTab) {
        requestAnimationFrame(() => {
            const container = elements.tabsContainer;
            const activeRect = activeTab.getBoundingClientRect();
            const containerRect = container.getBoundingClientRect();

            const relativeLeft = activeRect.left - containerRect.left;
            const relativeRight = activeRect.right - containerRect.left;

            if (relativeLeft < 0) {
                // タブが左に隠れている場合
                container.scrollBy({ left: relativeLeft, behavior: 'smooth' });
            } else if (relativeRight > containerRect.width) {
                // タブが右に隠れている場合
                container.scrollBy({ left: relativeRight - containerRect.width, behavior: 'smooth' });
            }
        });
    }
}
