// Tauri API (環境差異を吸収)
const tauriApi = window.__TAURI__ || null;
const invoke = tauriApi?.tauri?.invoke || tauriApi?.invoke || null;
const openDialog = tauriApi?.dialog?.open || null;
const saveDialog = tauriApi?.dialog?.save || null;

const AUTOSAVE_DELAY_MS = 3000;

// アプリケーション状態
let appState = {
    currentTab: null,
    tabs: [],
    homeFolder: null,
    isDirty: false,
    autosaveTimer: null,
    initialized: false,
    closeHandlerRegistered: false,
    isHandlingClose: false,
    allowClose: false,
};

function generateTabId() {
    if (window.crypto && typeof window.crypto.randomUUID === 'function') {
        return window.crypto.randomUUID();
    }
    return 'tab-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8);
}

function ensureTauriApi() {
    if (!invoke) {
        console.error('Tauri invoke API is not available.', window.__TAURI__);
        updateStatus('Tauri API 初期化失敗', 'error');
        return false;
    }
    return true;
}

// DOM要素キャッシュ
const elements = {
    app: document.getElementById('app'),
    tabsContainer: document.getElementById('tabsContainer'),
    addTabBtn: document.getElementById('addTabBtn'),
    editor: document.getElementById('editor'),
    statusText: document.getElementById('statusText'),
    statusFile: document.getElementById('statusFile'),
    statusMetrics: document.getElementById('statusMetrics'),
    settingsDialog: document.getElementById('settingsDialog'),
    homeFolderInput: document.getElementById('homeFolderInput'),
    browseFolderBtn: document.getElementById('browseFolderBtn'),
    confirmSettingsBtn: document.getElementById('confirmSettingsBtn'),
    errorDialog: document.getElementById('errorDialog'),
    errorMessage: document.getElementById('errorMessage'),
    retryBtn: document.getElementById('retryBtn'),
    saveAsBtn: document.getElementById('saveAsBtn'),
    cancelExitBtn: document.getElementById('cancelExitBtn'),
    folderHint: document.getElementById('folderHint'),
};

function getCurrentTab() {
    if (!appState.currentTab) {
        return null;
    }
    return appState.tabs.find((t) => t.id === appState.currentTab) || null;
}

function updateEditorMetrics() {
    const value = elements.editor.value || '';
    const chars = value.length;
    const caret = elements.editor.selectionStart || 0;
    const before = value.slice(0, caret);
    const lines = before.split('\n');
    const line = lines.length;
    const col = (lines[lines.length - 1] || '').length + 1;

    elements.statusMetrics.textContent = `Ln ${line}, Col ${col} | ${chars} chars`;
}

function updateStatusFileLabel() {
    const tab = getCurrentTab();
    elements.statusFile.textContent = tab ? tab.fileName : '-';
}

function getFileNameFromPath(path) {
    if (!path) {
        return '';
    }
    const normalized = path.replace(/\\/g, '/');
    const chunks = normalized.split('/');
    return chunks[chunks.length - 1] || '';
}

function syncActiveTabContent() {
    const tab = getCurrentTab();
    if (!tab) {
        return;
    }
    tab.content = elements.editor.value;
}

function showSaveErrorDialog(message) {
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

async function saveTabAs(tab) {
    if (!saveDialog) {
        throw new Error('別名保存ダイアログを利用できません');
    }

    const targetPath = await saveDialog({ defaultPath: tab.filePath });
    if (!targetPath || typeof targetPath !== 'string') {
        return false;
    }

    await invoke('save_text_file', {
        filePath: targetPath,
        content: tab.content,
    });

    tab.filePath = targetPath;
    tab.fileName = getFileNameFromPath(targetPath);
    tab.isAutoCreated = false;
    tab.createdInCurrentSession = true;
    tab.isDirty = false;
    renderTabs();
    updateStatusFileLabel();
    updateStatus('別名で保存済み', 'saved');
    return true;
}

async function persistTabWithRecovery(tab, contextLabel) {
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

async function handleAppCloseRequested(closeEvent) {
    if (appState.allowClose) {
        return;
    }

    closeEvent?.preventDefault?.();

    if (appState.isHandlingClose) {
        return;
    }

    appState.isHandlingClose = true;
    syncActiveTabContent();
    clearTimeout(appState.autosaveTimer);

    try {
        for (const tab of [...appState.tabs]) {
            const ok = await persistTabWithRecovery(tab, 'app-exit');
            if (!ok) {
                appState.isHandlingClose = false;
                return;
            }
        }

        appState.allowClose = true;
        setTimeout(() => {
            window.close();
        }, 0);
    } catch (error) {
        console.error('Failed while processing app close:', error);
        updateStatus('終了処理失敗', 'error');
        appState.isHandlingClose = false;
    }
}

function registerCloseHandlerOnce() {
    if (appState.closeHandlerRegistered) {
        return;
    }

    if (appWindow && typeof appWindow.onCloseRequested === 'function') {
        appWindow.onCloseRequested(handleAppCloseRequested);
    }

    appState.closeHandlerRegistered = true;
}

// ステータス更新
function updateStatus(message, status = 'normal') {
    elements.statusText.textContent = message;
    elements.statusText.className = 'status-text';
    if (status !== 'normal') {
        elements.statusText.classList.add(status);
    }
}

// 初期化
async function init() {
    console.log('NoCapEdit initializing...');

    if (!ensureTauriApi()) {
        return;
    }
    
    try {
        // 設定を取得
        const settings = await invoke('get_settings');
        appState.homeFolder = settings.home_folder;
        
        // 初回起動チェック
        const isFirstLaunch = !!settings.is_first_launch;
        
        if (isFirstLaunch) {
            showSettingsDialog();
        } else {
            updateStatus('準備完了');
            setupUIEventListeners();
            await createNewTab();
        }
    } catch (error) {
        console.error('Failed to initialize:', error);
        updateStatus('初期化エラー', 'error');
    }
}

// 初回設定ダイアログ表示
function showSettingsDialog() {
    const defaultPath = 'C:\\Users\\' + getCurrentUsername() + '\\Documents\\nce';
    elements.homeFolderInput.value = appState.homeFolder || defaultPath;
    elements.folderHint.textContent = 'ここにテキストファイルが保存されます';
    elements.settingsDialog.classList.remove('hidden');

    elements.browseFolderBtn.onclick = async () => {
        if (!openDialog) {
            return;
        }

        try {
            const selected = await openDialog({ directory: true, multiple: false });
            if (typeof selected === 'string' && selected.trim() !== '') {
                elements.homeFolderInput.value = selected;
            }
        } catch (error) {
            console.error('Folder browse failed:', error);
        }
    };
    
    elements.confirmSettingsBtn.onclick = async () => {
        await saveSettings();
    };
}

// 設定を保存
async function saveSettings() {
    const homeFolder = elements.homeFolderInput.value;
    
    if (!homeFolder) {
        alert('ホームフォルダを指定してください');
        return;
    }
    
    try {
        if (!ensureTauriApi()) {
            return;
        }

        await invoke('save_settings', { homeFolder });
        appState.homeFolder = homeFolder;
        elements.settingsDialog.classList.add('hidden');
        updateStatus('準備完了');
        setupUIEventListeners();
        await createNewTab();
    } catch (error) {
        console.error('Failed to save settings:', error);
        updateStatus('設定保存エラー', 'error');
    }
}

// 現在のWindowsユーザー名を取得（簡易版）
function getCurrentUsername() {
    return 'User'; // 実装では环境変数から取得
}

// UI イベントリスナー設定
function setupUIEventListeners() {
    if (appState.initialized) {
        return;
    }

    elements.addTabBtn.addEventListener('click', createNewTab);
    elements.editor.addEventListener('input', onEditorInput);
    elements.editor.addEventListener('click', updateEditorMetrics);
    elements.editor.addEventListener('keyup', updateEditorMetrics);
    registerCloseHandlerOnce();
    appState.initialized = true;
}

// 新規タブ作成
async function createNewTab() {
    if (!appState.homeFolder) {
        updateStatus('ホームフォルダ未設定', 'error');
        return;
    }

    try {
        if (!ensureTauriApi()) {
            return;
        }

        updateStatus('新規ファイル作成中...', 'saving');

        const file = await invoke('create_auto_file', {
            homeFolder: appState.homeFolder,
        });

        const tab = {
            id: generateTabId(),
            fileName: file.file_name,
            filePath: file.file_path,
            content: '',
            isDirty: false,
            isAutoCreated: true,
            createdInCurrentSession: true,
            hasNonWhitespaceInput: false,
        };

        appState.tabs.push(tab);
        await switchTab(tab.id);
        renderTabs();
        updateStatus(tab.fileName + ' を作成', 'saved');
    } catch (error) {
        console.error('Failed to create new file:', error);
        updateStatus('新規ファイル作成失敗', 'error');
    }
}

// タブ切り替え
async function switchTab(tabId) {
    try {
        // 前のタブを保存
        if (appState.currentTab) {
            const currentIdx = appState.tabs.findIndex(t => t.id === appState.currentTab);
            if (currentIdx !== -1) {
                appState.tabs[currentIdx].content = elements.editor.value;
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
            elements.editor.value = tab.content;
            renderTabs();
            updateStatusFileLabel();
            updateEditorMetrics();
            updateStatus(tab.fileName + ' - 準備完了');
        }
    } catch (error) {
        console.error('Failed to switch tab:', error);
        updateStatus('タブ切替失敗', 'error');
    }
}

async function saveTabIfDirty(tab) {
    if (!tab || !tab.isDirty) {
        return;
    }

    if (!ensureTauriApi()) {
        return;
    }

    await invoke('save_text_file', {
        filePath: tab.filePath,
        content: tab.content,
    });
    tab.isDirty = false;
    renderTabs();
}

// タブを削除
async function closeTab(tabId) {
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
            appState.currentTab = appState.tabs[0].id;
            const active = getCurrentTab();
            if (active) {
                elements.editor.value = active.content;
            }
        } else {
            appState.currentTab = null;
            elements.editor.value = '';
            await createNewTab();
        }
    }

    renderTabs();
    updateStatusFileLabel();
    updateEditorMetrics();
}

// 空白のみファイルを削除すべきか判定
function shouldDeleteEmptyFile(tab) {
    if (!tab.isAutoCreated || !tab.createdInCurrentSession) {
        return false;
    }
    
    const content = tab.content;
    const trimmed = content.trim();
    
    return trimmed === '' && !tab.hasNonWhitespaceInput;
}

// タブを再描画
function renderTabs() {
    elements.tabsContainer.innerHTML = '';
    
    appState.tabs.forEach(tab => {
        const tabEl = document.createElement('div');
        tabEl.className = 'tab' + (tab.id === appState.currentTab ? ' active' : '');
        
        const nameEl = document.createElement('span');
        nameEl.className = 'tab-name';
        if (tab.isDirty) {
            nameEl.classList.add('dirty');
        }
        nameEl.textContent = tab.fileName;
        
        const closeEl = document.createElement('span');
        closeEl.className = 'tab-close';
        closeEl.textContent = '×';
        closeEl.addEventListener('click', (e) => {
            e.stopPropagation();
            closeTab(tab.id);
        });
        
        tabEl.appendChild(nameEl);
        tabEl.appendChild(closeEl);
        tabEl.addEventListener('click', () => switchTab(tab.id));
        
        elements.tabsContainer.appendChild(tabEl);
    });
}

// エディタ入力イベント
function onEditorInput(e) {
    if (!appState.currentTab) return;
    
    const tab = appState.tabs.find(t => t.id === appState.currentTab);
    if (!tab) return;
    
    tab.content = elements.editor.value;
    tab.isDirty = true;
    renderTabs();
    updateStatusFileLabel();
    updateEditorMetrics();
    
    // 非空白文字を入力したか確認
    if (elements.editor.value.trim() !== '') {
        tab.hasNonWhitespaceInput = true;
    }
    
    updateStatus('編集中...');
    
    // 自動保存タイマーをリセット
    clearTimeout(appState.autosaveTimer);
    appState.autosaveTimer = setTimeout(() => {
        autoSave();
    }, AUTOSAVE_DELAY_MS);
}

// 自動保存
async function autoSave() {
    if (!appState.currentTab) return;
    
    const tab = appState.tabs.find(t => t.id === appState.currentTab);
    if (!tab || !tab.isDirty) return;
    
    try {
        updateStatus('保存中...', 'saving');

        await saveTabIfDirty(tab);
        
        updateStatus('保存済み', 'saved');
    } catch (error) {
        console.error('Auto-save failed:', error);
        updateStatus('保存失敗', 'error');
    }
}

// アプリケーション起動
document.addEventListener('DOMContentLoaded', () => {
    init();
    updateEditorMetrics();
});

// ウィンドウクローズ前の処理
window.addEventListener('beforeunload', (e) => {
    syncActiveTabContent();
});
