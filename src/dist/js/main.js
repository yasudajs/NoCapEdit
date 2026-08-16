import { t, applyI18nToDOM } from '../i18n.js';
import { appState, elements, initElements } from './state.js';
import { invoke, appWindow, listen, ensureTauriApi } from './core/tauri.js';
import { createNewTab, updateStatus, renderTabs, setupTabScrollWheel } from './ui/tabs.js';
import { openExistingFile, persistAllTabsBeforeExit } from './core/fileSystem.js';
import { updateEditorMetrics, onEditorInput, applyFontSize, applyLineHeight, handleTabKey, applyWordWrap } from './ui/editor.js';
import { toggleSettingsDialog, closeSettingsDialog, openSettingsDialog, onThemeChange, onFontFamilyChange, saveSettings, setupSettingsNavigation } from './ui/settings.js';
import { applyThemeUI, loadSystemFonts, applyFontFamily, setShouldOpenFontPicker } from './ui/theme.js';
import { setupKeyboardShortcuts } from './ui/shortcuts.js';
import { setupFindReplaceEvents } from './ui/findReplace.js';
import { checkNewVersion } from './core/updater.js';

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
            updateStatus(t('main.error.exitFailed'), 'error');
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
        appState.savedFontSize = settings.font_size || 20;
        appState.fontSize = appState.savedFontSize;
        appState.fontFamily = settings.font_family || 'default';
        appState.savedLineHeight = settings.line_height || 1.5;
        appState.lineHeight = appState.savedLineHeight;
        appState.tabBehavior = settings.tab_behavior || 'tab';
        appState.saveMode = settings.save_mode || 'auto';
        appState.charCountMode = settings.char_count_mode || 'with_newline';
        appState.wordWrap = settings.word_wrap !== undefined ? settings.word_wrap : true;

        if (elements.fontSizeSelectModal) {
            elements.fontSizeSelectModal.value = String(appState.fontSize);
        }
        if (elements.lineHeightSelectModal) {
            elements.lineHeightSelectModal.value = Number(appState.lineHeight).toFixed(1);
        }
        if (elements.tabBehaviorSelectModal) {
            elements.tabBehaviorSelectModal.value = appState.tabBehavior;
        }
        if (elements.saveModeSelectModal) {
            elements.saveModeSelectModal.value = appState.saveMode;
        }
        if (elements.charCountModeSelectModal) {
            elements.charCountModeSelectModal.value = appState.charCountMode;
        }
        if (elements.wordWrapSelectModal) {
            elements.wordWrapSelectModal.value = String(appState.wordWrap);
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

        // フォント・表示設定を適用
        applyFontSize();
        applyFontFamily();
        applyLineHeight();
        applyWordWrap(appState.wordWrap);

        // 前回の適用フォントが default 以外の場合、一覧をロードする前にモーダルドロップダウンに項目を追加しておく
        if (appState.fontFamily !== 'default' && elements.fontFamilySelectModal) {
            const option = document.createElement('option');
            option.value = appState.fontFamily;
            option.textContent = appState.fontFamily;
            option.selected = true;
            elements.fontFamilySelectModal.appendChild(option);
        }

        // UIイベントリスナーを一括登録
        setupUIEventListeners();

        if (elements.editor) {
            elements.editor.placeholder = t('editor.placeholder');
        }

        // 初回起動チェック
        const isFirstLaunch = !!settings.is_first_launch;
        const isHomeFolderMissing = settings.home_folder_exists === false;

        if (isFirstLaunch || isHomeFolderMissing) {
            openSettingsDialog(isHomeFolderMissing);
        } else {
            updateStatus(t('status.ready'));

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
        updateStatus(t('main.error.initFailed', { error: error.message || error }), 'error');
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

// UI イベントリスナー設定
function setupUIEventListeners() {
    if (appState.initialized) {
        return;
    }

    if (elements.addTabBtn) {
        elements.addTabBtn.addEventListener('click', createNewTab);
    }
    if (elements.settingsBtn) {
        elements.settingsBtn.addEventListener('click', toggleSettingsDialog);
    }
    if (elements.settingsDialog) {
        elements.settingsDialog.addEventListener('click', (e) => {
            if (e.target === elements.settingsDialog) {
                closeSettingsDialog();
            }
        });
    }
    if (elements.themeSelectModal) {
        elements.themeSelectModal.addEventListener('change', (e) => onThemeChange(e.target.value));
    }
    if (elements.fontFamilySelectModal) {
        elements.fontFamilySelectModal.addEventListener('change', onFontFamilyChange);
        elements.fontFamilySelectModal.addEventListener('mousedown', (e) => {
            if (!appState.fontsLoaded) {
                e.preventDefault();
                setShouldOpenFontPicker(true);
                if (!appState.fontsLoading) {
                    loadSystemFonts();
                }
            }
        });
        elements.fontFamilySelectModal.addEventListener('focus', () => {
            if (!appState.fontsLoaded && !appState.fontsLoading) {
                loadSystemFonts();
            }
        });
        elements.fontFamilySelectModal.addEventListener('keydown', (e) => {
            if (!appState.fontsLoaded && (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
                e.preventDefault();
                setShouldOpenFontPicker(true);
                if (!appState.fontsLoading) {
                    loadSystemFonts();
                }
            }
        });
    }
    if (elements.fontSizeSelectModal) {
        elements.fontSizeSelectModal.addEventListener('change', async () => {
            await saveSettings();
        });
    }
    if (elements.lineHeightSelectModal) {
        elements.lineHeightSelectModal.addEventListener('change', async () => {
            await saveSettings();
        });
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
    if (elements.wordWrapSelectModal) {
        elements.wordWrapSelectModal.addEventListener('change', async (e) => {
            await saveSettings();
        });
    }

    if (elements.editor) {
        elements.editor.addEventListener('keydown', handleTabKey);
        elements.editor.addEventListener('input', onEditorInput);
        elements.editor.addEventListener('click', updateEditorMetrics);
        elements.editor.addEventListener('mouseup', updateEditorMetrics);
        elements.editor.addEventListener('keyup', updateEditorMetrics);
    }
    registerCloseHandler();
    setupTabScrollWheel();
    setupSettingsNavigation();
    setupKeyboardShortcuts();
    setupFindReplaceEvents();

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

// アプリケーション起動
document.addEventListener('DOMContentLoaded', async () => {
    initElements();
    if (typeof applyI18nToDOM === 'function') {
        applyI18nToDOM();
    }
    await init();
    updateEditorMetrics();
});

window.addEventListener('error', (event) => {
    console.error('Unhandled window error:', event.error || event.message);
});

window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
});

