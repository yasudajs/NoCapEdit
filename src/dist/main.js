// Tauri API (環境差異を吸収)
const tauriApi = window.__TAURI__ || null;
const invoke = tauriApi?.tauri?.invoke || tauriApi?.invoke || null;
const openDialog = tauriApi?.dialog?.open || null;
const saveDialog = tauriApi?.dialog?.save || null;
const appWindow = tauriApi?.window?.appWindow || null;
const listen = tauriApi?.event?.listen || null;

const AUTOSAVE_DELAY_MS = 3000;
const MAX_FONT_SIZE = 72;
const MIN_FONT_SIZE = 8;
const MAX_LINE_HEIGHT = 3.0;
const MIN_LINE_HEIGHT = 1.0;
const LINE_HEIGHT_STEP = 0.1;
const DEFAULT_MONOSPACE_FONTS = "'Fira Code', 'Monaco', 'Menlo', monospace";
const AUTO_FILE_REGEX = /^\d{8}_\d{6}(_\d{2})?\.nctx$/;
const FILE_EXT_NCTX = 'nctx';
const FILE_EXT_NCMD = 'ncmd';

// アプリケーション状態
let appState = {
    currentTab: null,
    tabs: [],
    homeFolder: null,
    theme: null,
    fontSize: null,
    fontFamily: null,
    lineHeight: null,
    tabBehavior: null,
    saveMode: null,
    charCountMode: null,
    isDirty: false,
    autosaveTimer: null,
    initialized: false,
    closeGuard: false,
    forceClosing: false,
    fontsLoaded: false,
    fontsLoading: false,
};

// 設定画面を開く前のエディタのカーソル状態を保持する
let savedEditorCursor = null;

// セッション内の未保存タブ連番カウンタ（再起動でリセット）
let unsavedTabCounter = 0;

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
    settingsBtn: document.getElementById('settingsBtn'),
    fontFamilySelectModal: document.getElementById('fontFamilySelectModal'),
    tabBehaviorSelectModal: document.getElementById('tabBehaviorSelectModal'),
    saveModeSelectModal: document.getElementById('saveModeSelectModal'),
    charCountModeSelectModal: document.getElementById('charCountModeSelectModal'),
    themeSelectModal: document.getElementById('themeSelectModal'),
    editor: document.getElementById('editor'),
    statusText: document.getElementById('statusText'),
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
    const caret = elements.editor.selectionStart || 0;
    const selectEnd = elements.editor.selectionEnd || 0;

    let chars = value.length;
    let selectedChars = 0;
    const isSelected = caret !== selectEnd;

    if (appState.charCountMode === 'no_newline') {
        const newlineCount = (value.match(/[\r\n]/g) || []).length;
        chars = value.length - newlineCount;

        if (isSelected) {
            const selectedText = value.substring(caret, selectEnd);
            const selectedNewlineCount = (selectedText.match(/[\r\n]/g) || []).length;
            selectedChars = selectedText.length - selectedNewlineCount;
        }
    } else {
        if (isSelected) {
            const selectedText = value.substring(caret, selectEnd);
            selectedChars = selectedText.length;
        }
    }

    let charDisplay = '';
    if (isSelected) {
        charDisplay = `${selectedChars} / ${chars} chars`;
    } else {
        charDisplay = `${chars} chars`;
    }

    const before = value.slice(0, caret);
    const lines = before.split('\n');
    const line = lines.length;
    const col = (lines[lines.length - 1] || '').length + 1;

    elements.statusMetrics.textContent = `Ln ${line}, Col ${col} | ${charDisplay} | Font ${appState.fontSize} pt | LH x ${appState.lineHeight.toFixed(1)}`;
}

function getFileNameFromPath(path) {
    if (!path) {
        return '';
    }
    const normalized = path.replace(/\\/g, '/');
    const chunks = normalized.split('/');
    return chunks[chunks.length - 1] || '';
}

function isAutoCreatedFileName(fileName) {
    return AUTO_FILE_REGEX.test(fileName);
}

function formatTabDisplayName(fileName) {
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

function syncCurrentEditorToState() {
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

async function persistAllTabsBeforeExit() {
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
// ステータス更新
function updateStatus(message, status = 'normal', bypassPrefix = false) {
    let displayMessage = message;
    if (appState.saveMode === 'manual' && !bypassPrefix) {
        displayMessage = `[手動保存モード] ${message}`;
    }
    elements.statusText.textContent = displayMessage;
    elements.statusText.className = 'status-text';
    if (status !== 'normal') {
        elements.statusText.classList.add(status);
    }
}

// タブ個別ステータス表示用ヘルパー
function updateTabStatus(tab, state = null, statusType = 'normal') {
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

// 初期化
async function openExistingFile(filePath) {
    // 既に同じファイルが開いている場合は、切り替えるだけ
    const existingTab = appState.tabs.find((t) => t.filePath === filePath);
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
            id: generateTabId(),
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

async function init() {
    console.log('NoCapEdit initializing...');

    if (!ensureTauriApi()) {
        return;
    }

    try {
        // 設定を取得
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

        if (elements.tabBehaviorSelectModal) {
            elements.tabBehaviorSelectModal.value = appState.tabBehavior;
        }
        if (elements.saveModeSelectModal) {
            elements.saveModeSelectModal.value = appState.saveMode;
        }
        if (elements.charCountModeSelectModal) {
            elements.charCountModeSelectModal.value = appState.charCountMode;
        }

        // アプリケーションタイトルの動的設定
        if (settings.app_version) {
            const initialTitle = `NoCapEdit [ Ver ${settings.app_version} ]`;
            document.title = initialTitle;
            if (appWindow && typeof appWindow.setTitle === 'function') {
                appWindow.setTitle(initialTitle);
            }
        }

        // テーマを適用
        applyThemeUI(appState.theme);
        try {
            await invoke('apply_theme', { theme: appState.theme });
        } catch (themeError) {
            console.error('Failed to apply theme during init:', themeError);
        }

        // フォント設定を適用
        applyFontSize();
        applyFontFamily();
        applyLineHeight();

        // 前回の適用フォントが default 以外の場合、一覧をロードする前にモーダルドロップダウンに項目を追加しておく
        if (appState.fontFamily !== 'default' && elements.fontFamilySelectModal) {
            const option = document.createElement('option');
            option.value = appState.fontFamily;
            option.textContent = appState.fontFamily;
            option.selected = true;
            elements.fontFamilySelectModal.appendChild(option);
        }

        // 初回起動チェック
        const isFirstLaunch = !!settings.is_first_launch;
        const isHomeFolderMissing = settings.home_folder_exists === false;

        if (isFirstLaunch || isHomeFolderMissing) {
            openSettingsDialog(isHomeFolderMissing);
        } else {
            updateStatus('準備完了');
            setupUIEventListeners();

            // 起動時引数のチェック
            const launchFile = await invoke('get_launch_file');
            if (launchFile) {
                await openExistingFile(launchFile);
            } else {
                await createNewTab();
            }

            // アップデートチェックをバックグラウンドで開始
            if (settings.app_version) {
                checkNewVersion(settings.app_version);
            }
        }
    } catch (error) {
        console.error('Failed to initialize:', error);
        updateStatus('初期化エラー', 'error');
    } finally {
        // 初期化エラーなどの例外が発生した場合でも、確実にウィンドウを表示してユーザーに状態が見えるようにする（フェイルセーフ）
        if (appWindow && typeof appWindow.show === 'function') {
            try {
                await appWindow.show();
            } catch (showError) {
                console.error('Failed to show window:', showError);
            }
        }
    }
}

// 設定ドックの開閉トグル
function toggleSettingsDialog() {
    if (elements.settingsDialog.classList.contains('hidden')) {
        openSettingsDialog(false);
    } else {
        closeSettingsDialog();
    }
}

// 設定ドックを閉じる
function closeSettingsDialog() {
    elements.settingsDialog.classList.add('hidden');
    if (elements.settingsBtn) {
        elements.settingsBtn.classList.remove('open');
    }

    // エディタにフォーカスを戻し、カーソル位置を復元
    if (savedEditorCursor !== null && elements.editor) {
        elements.editor.focus();
        elements.editor.selectionStart = savedEditorCursor.selectionStart;
        elements.editor.selectionEnd = savedEditorCursor.selectionEnd;
        elements.editor.scrollTop = savedEditorCursor.scrollTop;
        savedEditorCursor = null;
    }
}

// 初回設定または設定ドックを開く
function openSettingsDialog(isMissingFolder = false) {
    // 設定画面を開く前にカーソル位置を保存
    if (elements.editor) {
        savedEditorCursor = {
            selectionStart: elements.editor.selectionStart || 0,
            selectionEnd: elements.editor.selectionEnd || 0,
            scrollTop: elements.editor.scrollTop || 0,
        };
    }

    elements.homeFolderInput.value = appState.homeFolder || '';
    if (elements.tabBehaviorSelectModal) {
        elements.tabBehaviorSelectModal.value = appState.tabBehavior;
    }
    if (elements.saveModeSelectModal) {
        elements.saveModeSelectModal.value = appState.saveMode || 'auto';
    }
    if (elements.charCountModeSelectModal) {
        elements.charCountModeSelectModal.value = appState.charCountMode || 'with_newline';
    }
    elements.folderHint.textContent = isMissingFolder
        ? '保存先フォルダが見つからないため、再設定してください'
        : 'ここにファイルが保存されます';
    
    elements.settingsDialog.classList.remove('hidden');
    if (elements.settingsBtn && !isMissingFolder) {
        elements.settingsBtn.classList.add('open');
    }

    elements.browseFolderBtn.onclick = async () => {
        if (!openDialog) {
            return;
        }

        try {
            const selected = await openDialog({ directory: true, multiple: false });
            if (typeof selected === 'string' && selected.trim() !== '') {
                elements.homeFolderInput.value = selected;
                await saveSettings();
            }
        } catch (error) {
            console.error('Folder browse failed:', error);
        }
    };
}

// アプリケーション設定を保存（共通処理）
async function saveApplicationSettings() {
    if (!ensureTauriApi() || !appState.homeFolder) {
        return;
    }
    try {
        await invoke('save_settings', {
            settings: {
                home_folder: appState.homeFolder,
                theme: appState.theme,
                font_size: appState.fontSize,
                font_family: appState.fontFamily,
                line_height: appState.lineHeight,
                tab_behavior: appState.tabBehavior,
                save_mode: appState.saveMode,
                char_count_mode: appState.charCountMode
            }
        });
    } catch (error) {
        console.error('Failed to save settings:', error);
    }
}

// 設定を保存
async function saveSettings() {
    const homeFolder = elements.homeFolderInput.value;
    const tabBehavior = elements.tabBehaviorSelectModal ? elements.tabBehaviorSelectModal.value : appState.tabBehavior;
    const saveMode = elements.saveModeSelectModal ? elements.saveModeSelectModal.value : appState.saveMode;
    const charCountMode = elements.charCountModeSelectModal ? elements.charCountModeSelectModal.value : appState.charCountMode;
    const previousSaveMode = appState.saveMode;

    if (!homeFolder) {
        alert('ホームフォルダを指定してください');
        return;
    }

    try {
        appState.homeFolder = homeFolder;
        appState.tabBehavior = tabBehavior;
        appState.saveMode = saveMode;
        appState.charCountMode = charCountMode;

        await saveApplicationSettings();

        if (previousSaveMode === 'manual' && saveMode === 'auto') {
            for (const tab of appState.tabs) {
                if (!tab.filePath) {
                    // [未保存N] -> 未保存N に置換
                    if (tab.fileName.startsWith('[未保存') && tab.fileName.endsWith(']')) {
                        tab.fileName = tab.fileName.slice(1, -1);
                    } else if (!tab.fileName.startsWith('未保存')) {
                        tab.fileName = `未保存${tab.unsavedNumber}`;
                    }
                    // 文字が入力されている場合は、自動保存の対象にする
                    if (tab.content.trim() !== '') {
                        tab.isDirty = true;
                    }
                }
            }
            renderTabs();
            autoSave();
        } else if (previousSaveMode === 'auto' && saveMode === 'manual') {
            for (const tab of appState.tabs) {
                if (shouldDeleteEmptyFile(tab)) {
                    try {
                        await invoke('delete_text_file', { filePath: tab.filePath });
                        tab.filePath = '';
                    } catch (err) {
                        console.error('Failed to delete empty file on mode switch:', err);
                    }
                }

                if (!tab.filePath) {
                    // 未保存N -> [未保存N] に置換
                    if (tab.fileName.startsWith('未保存')) {
                        tab.fileName = `[${tab.fileName}]`;
                    } else if (!tab.fileName.startsWith('[未保存')) {
                        tab.fileName = `[未保存${tab.unsavedNumber}]`;
                    }
                }
            }
            renderTabs();
        }
        
        updateStatus('準備完了');
        setupUIEventListeners();
        updateEditorMetrics();
        // タブが存在しない場合（初回起動時）のみ新規タブを作成
        if (appState.tabs.length === 0) {
            await createNewTab();
        }
    } catch (error) {
        console.error('Failed to save settings:', error);
        updateStatus('設定保存エラー', 'error');
    }
}

// 現在のWindowsユーザー名を取得（簡易版）は削除

// テーマの適用 (UI表示の切替)
function applyThemeUI(theme) {
    // 全テーマクラスを一度リセット
    document.body.classList.remove('light-theme', 'soft-dark-theme');

    if (theme === 'light') {
        document.body.classList.add('light-theme');
    } else if (theme === 'soft-dark') {
        document.body.classList.add('soft-dark-theme');
    }
    // 'dark' の場合はクラスなし（:root のデフォルトが適用される）

    // ドロップダウンの選択値を現在のテーマに同期
    if (elements.themeSelectModal) {
        elements.themeSelectModal.value = theme;
    }
}

// テーマの変更（ドロップダウン選択時）
async function onThemeChange(newTheme) {
    appState.theme = newTheme;

    applyThemeUI(newTheme);

    try {
        await invoke('apply_theme', { theme: newTheme });
    } catch (error) {
        console.error('Failed to apply theme to window:', error);
    }

    await saveApplicationSettings();
}

// UI イベントリスナー設定
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
            await saveSettings();
        });
    }
    if (elements.charCountModeSelectModal) {
        elements.charCountModeSelectModal.addEventListener('change', async (e) => {
            appState.charCountMode = e.target.value;
            await saveSettings();
            updateEditorMetrics();
        });
    }
    if (elements.saveModeSelectModal) {
        elements.saveModeSelectModal.addEventListener('change', async (e) => {
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

            // 選択範囲が複数行にまたがっているか判定
            const isMultiLine = value.substring(start, end).includes('\n') ||
                (start !== end && value.substring(0, start).lastIndexOf('\n') === start - 1);

            if (!e.shiftKey) {
                // -- 通常の Tab (インデント追加) --
                if (!isMultiLine) {
                    // 単一行: カーソル位置にインデントを挿入
                    elements.editor.value = value.substring(0, start) + indentStr + value.substring(end);
                    elements.editor.selectionStart = elements.editor.selectionEnd = start + indentStr.length;
                } else {
                    // 複数行: 選択行すべての先頭にインデントを追加
                    const startLinePos = value.substring(0, start).lastIndexOf('\n') + 1;
                    const endLinePos = value.indexOf('\n', end);
                    const actualEndLinePos = endLinePos === -1 ? value.length : endLinePos;

                    const targetText = value.substring(startLinePos, actualEndLinePos);
                    const lines = targetText.split('\n');

                    const newLines = lines.map(line => indentStr + line);
                    const newText = newLines.join('\n');

                    elements.editor.value = value.substring(0, startLinePos) + newText + value.substring(actualEndLinePos);

                    // 選択範囲を維持
                    const insertedCount = lines.length * indentStr.length;
                    elements.editor.selectionStart = start + indentStr.length;
                    elements.editor.selectionEnd = end + insertedCount;
                }
            } else {
                // -- Shift + Tab (インデント削除) --
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

                // カーソル選択範囲を調整
                elements.editor.selectionStart = Math.max(startLinePos, start - firstLineRemovedCount);
                elements.editor.selectionEnd = Math.max(startLinePos, end - totalRemovedCount);
            }

            // 自動保存等を連動させるための input イベント発火
            elements.editor.dispatchEvent(new Event('input'));
        }
    });

    elements.editor.addEventListener('input', onEditorInput);
    elements.editor.addEventListener('click', updateEditorMetrics);
    elements.editor.addEventListener('mouseup', updateEditorMetrics);
    elements.editor.addEventListener('keyup', updateEditorMetrics);
    registerCloseHandler();

    // Ctrl + マウスホイールでフォントサイズ拡大縮小、Ctrl + Shift + マウスホイールで行間調整
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

    // Ctrl + +/- でフォントサイズ拡大縮小、Ctrl + s で手動保存
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

            // Shift キーが押されている場合は行間の変更
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

            // 拡大条件: "+"キー、テンキーの"+", 英語配列の"=", 日本語配列の";" (Ctrl+;で拡大することも考慮)
            if (e.key === '+' || e.key === '=' || e.key === ';' || e.code === 'NumpadAdd' || e.code === 'Equal' || (e.code === 'Semicolon' && e.shiftKey)) {
                e.preventDefault();
                zoomIn();
            }
            // 縮小条件: "-"キー、テンキーの"-", "_"キー
            else if (e.key === '-' || e.key === '_' || e.code === 'NumpadSubtract' || e.code === 'Minus') {
                e.preventDefault();
                zoomOut();
            }
            // 手動保存: "s" / "S" キー
            else if (e.key === 's' || e.key === 'S' || e.code === 'KeyS') {
                e.preventDefault();
                triggerManualSave();
            }
        }
    });

    // シングルインスタンス動作でのファイル通知の購読
    if (listen) {
        listen('single-instance-file', async (event) => {
            const filePath = event.payload;
            if (filePath) {
                await openExistingFile(filePath);
            }
        });
    }

    appState.initialized = true;
}

// システムフォントを取得してドロップダウンを構築
async function loadSystemFonts() {
    if (!elements.fontFamilySelectModal) return;
    if (appState.fontsLoaded || appState.fontsLoading) return;

    try {
        if (!ensureTauriApi()) return;
        appState.fontsLoading = true;
        updateStatus('システムフォントを読み込み中...');
        const fonts = await invoke('get_system_fonts');

        // 既存の動的オプションをクリア (デフォルトの「デフォルト (Monospace)」は残す)
        while (elements.fontFamilySelectModal.options.length > 1) {
            elements.fontFamilySelectModal.remove(1);
        }

        const monoGroup = document.createElement('optgroup');
        monoGroup.label = '等幅フォント';

        const otherGroup = document.createElement('optgroup');
        otherGroup.label = 'その他のフォント';

        fonts.forEach(font => {
            const option = document.createElement('option');
            option.value = font.family;
            option.textContent = font.family;

            if (font.is_monospace) {
                monoGroup.appendChild(option);
            } else {
                otherGroup.appendChild(option);
            }
        });

        if (monoGroup.children.length > 0) {
            elements.fontFamilySelectModal.appendChild(monoGroup);
        }
        if (otherGroup.children.length > 0) {
            elements.fontFamilySelectModal.appendChild(otherGroup);
        }

        // 現在値を選択
        elements.fontFamilySelectModal.value = appState.fontFamily;
        appState.fontsLoaded = true;
        updateStatus('準備完了');
    } catch (error) {
        console.error('Failed to load system fonts:', error);
        updateStatus('フォント読み込み失敗', 'error');
    } finally {
        appState.fontsLoading = false;
    }
}


// フォントファミリーの適用
function applyFontFamily() {
    if (appState.fontFamily === 'default' || !appState.fontFamily) {
        document.documentElement.style.setProperty('--editor-font-family', DEFAULT_MONOSPACE_FONTS);
    } else {
        document.documentElement.style.setProperty('--editor-font-family', `"${appState.fontFamily}", ${DEFAULT_MONOSPACE_FONTS}`);
    }
}

// フォントファミリー変更時（タブバーのセレクトが削除されたためモーダルのセレクトを参照）
function onFontFamilyChange(event) {
    // イベントソースから値を取得。モーダルのセレクトが優先される
    const selectEl = event && event.target ? event.target
        : (elements.fontFamilySelectModal || elements.fontFamilySelect);
    if (selectEl) {
        appState.fontFamily = selectEl.value;
    }
    applyFontFamily();
    saveSettings();
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

        unsavedTabCounter++;
        let fileName = '';
        let filePath = '';

        if (appState.saveMode === 'manual') {
            fileName = `[未保存${unsavedTabCounter}]`;
        } else {
            fileName = `未保存${unsavedTabCounter}`;
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
            unsavedNumber: unsavedTabCounter,
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
async function switchTab(tabId) {
    try {
        // 前のタブを保存
        if (appState.currentTab) {
            const currentIdx = appState.tabs.findIndex(t => t.id === appState.currentTab);
            if (currentIdx !== -1) {
                appState.tabs[currentIdx].content = elements.editor.value;
                
                // 切り替え前のタブのカーソル状態を記憶
                if (elements.editor) {
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
            elements.editor.value = tab.content;
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

async function saveTabIfDirty(tab) {
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
            await switchTab(appState.tabs[0].id);
        } else {
            appState.currentTab = null;
            elements.editor.value = '';
            await createNewTab();
        }
    }

    renderTabs();
    updateEditorMetrics();
}

// 空白のみファイルを削除すべきか判定
function shouldDeleteEmptyFile(tab) {
    // ファイルが未作成の場合は削除不要
    if (!tab.filePath) {
        return false;
    }
    const trimmed = tab.content.trim();
    if (trimmed !== '') {
        return false;
    }
    return isAutoCreatedFileName(tab.fileName);
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
    updateEditorMetrics();

    updateTabStatus(tab, '編集中');

    // 自動保存タイマーをリセット
    if (appState.saveMode !== 'manual') {
        clearTimeout(appState.autosaveTimer);
        appState.autosaveTimer = setTimeout(() => {
            autoSave();
        }, AUTOSAVE_DELAY_MS);
    }
}

async function autoSave() {
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

// 手動保存
async function triggerManualSave() {
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

// アプリケーション起動
document.addEventListener('DOMContentLoaded', () => {
    init();
    updateEditorMetrics();
});

window.addEventListener('error', (event) => {
    console.error('Unhandled window error:', event.error || event.message);
});

window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
});

// ズーム（フォントサイズ変更）機能
let settingsSaveTimer = null;

function zoomIn() {
    if (appState.fontSize < MAX_FONT_SIZE) {
        appState.fontSize = Math.min(MAX_FONT_SIZE, appState.fontSize + 1);
        applyFontSize();
    }
}

function zoomOut() {
    if (appState.fontSize > MIN_FONT_SIZE) {
        appState.fontSize = Math.max(MIN_FONT_SIZE, appState.fontSize - 1);
        applyFontSize();
    }
}

function applyFontSize() {
    if (appState.fontSize) {
        document.documentElement.style.setProperty('--editor-font-size', `${appState.fontSize}px`);
    }
    updateEditorMetrics();
    saveSettingsDelay();
}

function applyLineHeight() {
    if (appState.lineHeight) {
        document.documentElement.style.setProperty('--editor-line-height', appState.lineHeight);
    }
    updateEditorMetrics();
    saveSettingsDelay();
}

function increaseLineHeight() {
    if (appState.lineHeight < MAX_LINE_HEIGHT) {
        appState.lineHeight = Math.min(MAX_LINE_HEIGHT, appState.lineHeight + LINE_HEIGHT_STEP);
        applyLineHeight();
    }
}

function decreaseLineHeight() {
    if (appState.lineHeight > MIN_LINE_HEIGHT) {
        appState.lineHeight = Math.max(MIN_LINE_HEIGHT, appState.lineHeight - LINE_HEIGHT_STEP);
        applyLineHeight();
    }
}

function saveSettingsDelay() {
    clearTimeout(settingsSaveTimer);
    settingsSaveTimer = setTimeout(async () => {
        await saveApplicationSettings();
    }, 1000);
}

// バージョン比較関数（v1 > v2 なら 1, v1 < v2 なら -1, 等しいなら 0）
function compareVersions(v1, v2) {
    const parts1 = String(v1).split('.').map(Number);
    const parts2 = String(v2).split('.').map(Number);
    for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
        const p1 = parts1[i] || 0;
        const p2 = parts2[i] || 0;
        if (p1 > p2) return 1;
        if (p1 < p2) return -1;
    }
    return 0;
}

// 自動アップデートチェック
async function checkNewVersion(currentVersion) {
    if (!currentVersion) return;

    try {
        // 起動時のUI描画を妨げないよう、3秒待機
        await new Promise(resolve => setTimeout(resolve, 3000));

        const response = await fetch('https://api.github.com/repos/yasudajs/NoCapEdit/releases/latest');
        if (!response.ok) return;

        const data = await response.json();
        const latestTag = data.tag_name;
        if (!latestTag) return;

        const latestVersion = latestTag.replace(/^v/, '');

        if (compareVersions(latestVersion, currentVersion) > 0) {
            // タイトルバーへの通知追加
            const newTitle = `NoCapEdit [ Ver ${currentVersion} ] (Update: ${latestTag})`;
            document.title = newTitle;
            if (appWindow && typeof appWindow.setTitle === 'function') {
                appWindow.setTitle(newTitle);
            }

            // 設定画面の最上段への表示
            const noticeContainer = document.getElementById('updateNoticeContainer');
            const currentVerSpan = document.getElementById('currentVerSpan');
            const latestVerSpan = document.getElementById('latestVerSpan');
            const releaseLink = document.getElementById('releaseLink');

            if (noticeContainer && currentVerSpan && latestVerSpan && releaseLink) {
                currentVerSpan.textContent = currentVersion;
                latestVerSpan.textContent = latestVersion;

                const releaseUrl = `https://github.com/yasudajs/NoCapEdit/releases/tag/${latestTag}`;
                releaseLink.href = releaseUrl;

                // Tauriのshell.openで外部ブラウザを開く
                releaseLink.onclick = (e) => {
                    e.preventDefault();
                    if (window.__TAURI__ && window.__TAURI__.shell && window.__TAURI__.shell.open) {
                        window.__TAURI__.shell.open(releaseUrl);
                    } else {
                        window.open(releaseUrl, '_blank');
                    }
                };

                noticeContainer.classList.remove('hidden');
            }
        }
    } catch (error) {
        // オフラインやAPIエラー時は握りつぶす
        console.warn('Update check failed:', error);
    }
}
