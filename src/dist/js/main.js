import { appState, elements, initElements } from './state.js';
import { invoke, appWindow, listen, ensureTauriApi } from './core/tauri.js';
import { createNewTab, updateStatus, renderTabs, switchTabByOffset } from './ui/tabs.js';
import { openExistingFile, triggerManualSave, persistAllTabsBeforeExit } from './core/fileSystem.js';
import { updateEditorMetrics, onEditorInput, zoomIn, zoomOut, applyFontSize, applyLineHeight, increaseLineHeight, decreaseLineHeight, handleTabKey } from './ui/editor.js';
import { toggleSettingsDialog, closeSettingsDialog, openSettingsDialog, applyThemeUI, onThemeChange, onFontFamilyChange, loadSystemFonts, checkNewVersion, applyFontFamily } from './ui/settings.js';

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
        updateStatus(`初期化エラー: ${error.message || error}`, 'error');
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

    if (elements.editor) {
        elements.editor.addEventListener('keydown', handleTabKey);
        elements.editor.addEventListener('input', onEditorInput);
        elements.editor.addEventListener('click', updateEditorMetrics);
        elements.editor.addEventListener('mouseup', updateEditorMetrics);
        elements.editor.addEventListener('keyup', updateEditorMetrics);
    }
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

    // 各種ショートカットキー監視
    window.addEventListener('keydown', async (e) => {
        // F5 キーによるリロードを禁止
        if (e.key === 'F5' || e.code === 'F5') {
            e.preventDefault();
            return;
        }

        // Ctrl + Tab / Ctrl + Shift + Tab でタブ切り替え
        if (e.key === 'Tab' && e.ctrlKey) {
            e.preventDefault();
            await switchTabByOffset(e.shiftKey ? -1 : 1);
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

            // 拡大条件
            if (e.key === '+' || e.key === '=' || e.key === ';' || e.code === 'NumpadAdd' || e.code === 'Equal' || (e.code === 'Semicolon' && e.shiftKey)) {
                e.preventDefault();
                zoomIn();
            }
            // 縮小条件
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

// アプリケーション起動
document.addEventListener('DOMContentLoaded', async () => {
    initElements();
    await init();
    updateEditorMetrics();
});

window.addEventListener('error', (event) => {
    console.error('Unhandled window error:', event.error || event.message);
});

window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
});
