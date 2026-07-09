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
    isDirty: false,
    autosaveTimer: null,
    initialized: false,
    closeGuard: false,
    forceClosing: false,
    fontsLoaded: false,
    fontsLoading: false,
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
    settingsBtn: document.getElementById('settingsBtn'),
    fontFamilySelectModal: document.getElementById('fontFamilySelectModal'),
    tabBehaviorSelectModal: document.getElementById('tabBehaviorSelectModal'),
    themeToggleModal: document.getElementById('themeToggleModal'),
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
    const chars = value.length;
    const caret = elements.editor.selectionStart || 0;
    const before = value.slice(0, caret);
    const lines = before.split('\n');
    const line = lines.length;
    const col = (lines[lines.length - 1] || '').length + 1;

    elements.statusMetrics.textContent = `Ln ${line}, Col ${col} | ${chars} chars | Font ${appState.fontSize} pt | LH ${appState.lineHeight.toFixed(1)} pt`;
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
function updateStatus(message, status = 'normal') {
    elements.statusText.textContent = message;
    elements.statusText.className = 'status-text';
    if (status !== 'normal') {
        elements.statusText.classList.add(status);
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
        appState.homeFolder = settings.home_folder;
        appState.theme = settings.theme || 'dark';
        appState.fontSize = settings.font_size || 13;
        appState.fontFamily = settings.font_family || 'default';
        appState.lineHeight = settings.line_height || 1.5;
        appState.tabBehavior = settings.tab_behavior || 'tab';
        
        if (elements.tabBehaviorSelectModal) {
            elements.tabBehaviorSelectModal.value = appState.tabBehavior;
        }
        
        // アプリケーションタイトルの動的設定
        if (settings.app_version) {
            document.title = `NoCapEdit [ Ver ${settings.app_version} ]`;
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
            showSettingsDialog(isHomeFolderMissing);
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
        }
    } catch (error) {
        console.error('Failed to initialize:', error);
        updateStatus('初期化エラー', 'error');
    }
}

// 初回設定ダイアログ表示
function showSettingsDialog(isMissingFolder = false) {
    elements.homeFolderInput.value = appState.homeFolder || '';
    if (elements.tabBehaviorSelectModal) {
        elements.tabBehaviorSelectModal.value = appState.tabBehavior;
    }
    elements.folderHint.textContent = isMissingFolder
        ? '保存先フォルダが見つからないため、再設定してください'
        : 'ここにテキストファイルが保存されます';
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
    const tabBehavior = elements.tabBehaviorSelectModal ? elements.tabBehaviorSelectModal.value : appState.tabBehavior;
    
    if (!homeFolder) {
        alert('ホームフォルダを指定してください');
        return;
    }
    
    try {
        if (!ensureTauriApi()) {
            return;
        }

        await invoke('save_settings', {
            homeFolder,
            theme: appState.theme,
            fontSize: appState.fontSize,
            fontFamily: appState.fontFamily,
            lineHeight: appState.lineHeight,
            tabBehavior
        });
        appState.homeFolder = homeFolder;
        appState.tabBehavior = tabBehavior;
        elements.settingsDialog.classList.add('hidden');
        updateStatus('準備完了');
        setupUIEventListeners();
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
    if (theme === 'light') {
        document.body.classList.add('light-theme');
        // モーダル内のテーマトグルボタンのアイコンを更新
        if (elements.themeToggleModal) {
            const iconEl = elements.themeToggleModal.querySelector('.theme-icon');
            if (iconEl) iconEl.textContent = '☀';
        }
    } else {
        document.body.classList.remove('light-theme');
        if (elements.themeToggleModal) {
            const iconEl = elements.themeToggleModal.querySelector('.theme-icon');
            if (iconEl) iconEl.textContent = '🌙';
        }
    }
}

// テーマのトグル切り替え
async function toggleTheme() {
    const newTheme = appState.theme === 'dark' ? 'light' : 'dark';
    appState.theme = newTheme;
    
    applyThemeUI(newTheme);
    
    try {
        await invoke('apply_theme', { theme: newTheme });
    } catch (error) {
        console.error('Failed to apply theme to window:', error);
    }
    
    try {
        await invoke('save_settings', {
            homeFolder: appState.homeFolder,
            theme: newTheme,
            fontSize: appState.fontSize,
            fontFamily: appState.fontFamily,
            lineHeight: appState.lineHeight
        });
    } catch (error) {
        console.error('Failed to save settings during theme toggle:', error);
    }
}

// UI イベントリスナー設定
function setupUIEventListeners() {
    if (appState.initialized) {
        return;
    }

    elements.addTabBtn.addEventListener('click', createNewTab);
    elements.settingsBtn && elements.settingsBtn.addEventListener('click', () => showSettingsDialog(false));
    elements.themeToggleModal && elements.themeToggleModal.addEventListener('click', toggleTheme);
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
        elements.tabBehaviorSelectModal.addEventListener('change', (e) => {
            appState.tabBehavior = e.target.value;
            saveSettingsDelay();
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
        if (e.ctrlKey) {
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
    saveSettingsDelay();
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
            isSaving: false,
            savePromise: null,
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

    if (tab.isSaving) {
        if (tab.savePromise) {
            await tab.savePromise;
        }
        return;
    }

    if (!ensureTauriApi()) {
        return;
    }

    tab.isSaving = true;
    tab.savePromise = (async () => {
        try {
            await invoke('save_text_file', {
                filePath: tab.filePath,
                content: tab.content,
            });
            tab.isDirty = false;
            renderTabs();
        } finally {
            tab.isSaving = false;
            tab.savePromise = null;
        }
    })();

    await tab.savePromise;
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
    updateEditorMetrics();
}

// 空白のみファイルを削除すべきか判定
function shouldDeleteEmptyFile(tab) {
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
    updateEditorMetrics();
    
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
    
    // 強制的に保存させるため未保存フラグを設定して保存処理を走らせる
    tab.isDirty = true;
    renderTabs();
    
    try {
        updateStatus('保存中...', 'saving');
        await saveTabIfDirty(tab);
        updateStatus('保存済み', 'saved');
    } catch (error) {
        console.error('Manual save failed:', error);
        updateStatus('保存失敗', 'error');
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
const MIN_FONT_SIZE = 8;
const MAX_FONT_SIZE = 72;
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
        try {
            if (ensureTauriApi() && appState.homeFolder) {
                await invoke('save_settings', {
                    homeFolder: appState.homeFolder,
                    theme: appState.theme,
                    fontSize: appState.fontSize,
                    fontFamily: appState.fontFamily,
                    lineHeight: appState.lineHeight,
                    tabBehavior: appState.tabBehavior
                });
            }
        } catch (error) {
            console.error('Failed to save settings:', error);
        }
    }, 1000);
}

