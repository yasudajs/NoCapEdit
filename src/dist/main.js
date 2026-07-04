// Tauri API
const { invoke } = window.__TAURI__.tauri;
const { ask } = window.__TAURI__.dialog;

// アプリケーション状態
let appState = {
    currentTab: null,
    tabs: [],
    homeFolder: null,
    isDirty: false,
    autosaveTimer: null,
};

// DOM要素キャッシュ
const elements = {
    app: document.getElementById('app'),
    tabsContainer: document.getElementById('tabsContainer'),
    addTabBtn: document.getElementById('addTabBtn'),
    editor: document.getElementById('editor'),
    statusText: document.getElementById('statusText'),
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
    
    try {
        // 設定を取得
        const settings = await invoke('get_settings');
        appState.homeFolder = settings.home_folder;
        
        // 初回起動チェック
        const isFirstLaunch = !settings.home_folder || settings.home_folder === '';
        
        if (isFirstLaunch) {
            showSettingsDialog();
        } else {
            updateStatus('準備完了');
            setupUIEventListeners();
        }
    } catch (error) {
        console.error('Failed to initialize:', error);
        updateStatus('初期化エラー', 'error');
    }
}

// 初回設定ダイアログ表示
function showSettingsDialog() {
    const defaultPath = 'C:\\Users\\' + getCurrentUsername() + '\\Documents\\nce';
    elements.homeFolderInput.value = defaultPath;
    elements.folderHint.textContent = 'ここにテキストファイルが保存されます';
    elements.settingsDialog.classList.remove('hidden');
    
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
        await invoke('save_settings', { homeFolder });
        appState.homeFolder = homeFolder;
        elements.settingsDialog.classList.add('hidden');
        updateStatus('準備完了');
        setupUIEventListeners();
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
    elements.addTabBtn.addEventListener('click', createNewTab);
    elements.editor.addEventListener('input', onEditorInput);
}

// 新規タブ作成
function createNewTab() {
    const timestamp = new Date().toISOString()
        .replace(/[-:]/g, '').replace(/\.\d+Z/, '');
    const fileName = timestamp + '.txt';
    
    const tab = {
        id: Math.random().toString(36).substr(2, 9),
        fileName: fileName,
        filePath: appState.homeFolder + '\\' + fileName,
        content: '',
        isDirty: false,
        isAutoCreated: true,
        createdInCurrentSession: true,
        hasNonWhitespaceInput: false,
    };
    
    appState.tabs.push(tab);
    switchTab(tab.id);
    renderTabs();
}

// タブ切り替え
function switchTab(tabId) {
    // 前のタブを保存
    if (appState.currentTab) {
        const currentIdx = appState.tabs.findIndex(t => t.id === appState.currentTab);
        if (currentIdx !== -1) {
            appState.tabs[currentIdx].content = elements.editor.value;
        }
    }
    
    // 新しいタブに切り替え
    appState.currentTab = tabId;
    const tab = appState.tabs.find(t => t.id === tabId);
    
    if (tab) {
        elements.editor.value = tab.content;
        renderTabs();
        updateStatus(tab.fileName + ' - 準備完了');
    }
}

// タブを削除
async function closeTab(tabId) {
    const idx = appState.tabs.findIndex(t => t.id === tabId);
    
    if (idx === -1) return;
    
    const tab = appState.tabs[idx];
    
    // 空白のみなら削除
    if (shouldDeleteEmptyFile(tab)) {
        appState.tabs.splice(idx, 1);
        if (appState.currentTab === tabId) {
            if (appState.tabs.length > 0) {
                switchTab(appState.tabs[0].id);
            } else {
                createNewTab();
            }
        }
        renderTabs();
        return;
    }
    
    // ファイルを保存してから削除
    if (tab.isDirty) {
        const confirmed = await ask('保存されていない変更があります。保存しますか？');
        if (confirmed) {
            // 将来の実装：ファイル保存
        }
    }
    
    appState.tabs.splice(idx, 1);
    
    if (appState.currentTab === tabId) {
        if (appState.tabs.length > 0) {
            switchTab(appState.tabs[0].id);
        } else {
            createNewTab();
        }
    }
    
    renderTabs();
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
    
    // 非空白文字を入力したか確認
    if (elements.editor.value.trim() !== '') {
        tab.hasNonWhitespaceInput = true;
    }
    
    updateStatus('編集中...');
    
    // 自動保存タイマーをリセット
    clearTimeout(appState.autosaveTimer);
    appState.autosaveTimer = setTimeout(() => {
        autoSave();
    }, 3000); // 3秒
}

// 自動保存
async function autoSave() {
    if (!appState.currentTab) return;
    
    const tab = appState.tabs.find(t => t.id === appState.currentTab);
    if (!tab || !tab.isDirty) return;
    
    try {
        updateStatus('保存中...', 'saving');
        
        // 将来の実装：ファイル保存
        // 現在はシミュレーション
        await new Promise(resolve => setTimeout(resolve, 500));
        
        tab.isDirty = false;
        updateStatus('保存済み', 'saved');
    } catch (error) {
        console.error('Auto-save failed:', error);
        updateStatus('保存失敗', 'error');
    }
}

// アプリケーション起動
document.addEventListener('DOMContentLoaded', () => {
    init();
});

// ウィンドウクローズ前の処理
window.addEventListener('beforeunload', async (e) => {
    // 将来の実装：終了前の保存処理
    // 現在は何もしない
});
