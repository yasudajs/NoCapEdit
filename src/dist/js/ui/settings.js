import { appState, elements, savedEditorCursor, setSavedEditorCursor, DEFAULT_MONOSPACE_FONTS } from '../state.js';
import { invoke, appWindow, ensureTauriApi, openDialog } from '../core/tauri.js';
import { updateStatus, renderTabs, createNewTab } from './tabs.js';
import { autoSave } from '../core/fileSystem.js';
import { updateEditorMetrics } from './editor.js';
import { shouldDeleteEmptyFile } from '../core/fileSystem.js';
import { compareVersions } from '../utils/helpers.js';

let settingsSaveTimer = null;

const settingsExtraProviders = [];

/**
 * 外部モジュールからの設定追加用プロバイダーを登録
 * @param {Function} provider () => object 形式の関数
 */
export function registerSettingsExtraProvider(provider) {
    if (typeof provider === 'function') {
        settingsExtraProviders.push(provider);
    }
}

/**
 * 設定保存の遅延実行（デバウンス）
 * エディタ設定変更時やサイドバーUI変更時などに呼び出される
 */
export function saveSettingsDelay() {
    clearTimeout(settingsSaveTimer);
    settingsSaveTimer = setTimeout(async () => {
        await saveApplicationSettings();
    }, 1000);
}

export function toggleSettingsDialog() {
    if (elements.settingsDialog.classList.contains('hidden')) {
        openSettingsDialog(false);
    } else {
        closeSettingsDialog();
    }
}

export function closeSettingsDialog() {
    elements.settingsDialog.classList.add('hidden');
    if (elements.settingsBtn) {
        elements.settingsBtn.classList.remove('open');
    }

    if (savedEditorCursor !== null && elements.editor) {
        elements.editor.focus();
        elements.editor.selectionStart = savedEditorCursor.selectionStart;
        elements.editor.selectionEnd = savedEditorCursor.selectionEnd;
        elements.editor.scrollTop = savedEditorCursor.scrollTop;
        setSavedEditorCursor(null);
    }
}

export function openSettingsDialog(isMissingFolder = false) {
    if (elements.editor) {
        setSavedEditorCursor({
            selectionStart: elements.editor.selectionStart || 0,
            selectionEnd: elements.editor.selectionEnd || 0,
            scrollTop: elements.editor.scrollTop || 0,
        });
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

export async function saveApplicationSettings() {
    if (!ensureTauriApi() || !appState.homeFolder) {
        return;
    }
    try {
        const settingsPayload = {
            home_folder: appState.homeFolder,
            theme: appState.theme,
            font_size: appState.fontSize,
            font_family: appState.fontFamily,
            line_height: appState.lineHeight,
            tab_behavior: appState.tabBehavior,
            save_mode: appState.saveMode,
            char_count_mode: appState.charCountMode
        };

        for (const provider of settingsExtraProviders) {
            try {
                const extra = provider();
                if (extra && typeof extra === 'object') {
                    Object.assign(settingsPayload, extra);
                }
            } catch (err) {
                console.error('Failed to get extra settings from provider:', err);
            }
        }

        await invoke('save_settings', {
            settings: settingsPayload
        });
    } catch (error) {
        console.error('Failed to save settings:', error);
    }
}

export async function saveSettings() {
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
                    if (tab.fileName.startsWith('[未保存') && tab.fileName.endsWith(']')) {
                        tab.fileName = tab.fileName.slice(1, -1);
                    } else if (!tab.fileName.startsWith('未保存')) {
                        tab.fileName = `未保存${tab.unsavedNumber}`;
                    }
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
                    if (tab.fileName.startsWith('未保存')) {
                        tab.fileName = `[${tab.fileName}]`;
                    } else if (!tab.fileName.startsWith('[未保存')) {
                        tab.fileName = `[未保存${tab.unsavedNumber}]`;
                    }
                }
            }
            renderTabs();
        }
        
        updateStatus(appState.saveMode === 'manual' ? window.t('status_ready_manual') : window.t('status_ready_auto'));
        
        // This circular dependency is tricky. We'll import dynamically or just rely on main.js to setup listeners.
        // main.js will setup listeners initially. We don't need to setup listeners here again if they are attached to DOM.
        // setupUIEventListeners(); // We remove this because listeners are added once in main.js.

        updateEditorMetrics();
        if (appState.tabs.length === 0) {
            await createNewTab();
        }
    } catch (error) {
        console.error('Failed to save settings:', error);
        updateStatus('設定保存エラー', 'error');
    }
}

export function applyThemeUI(theme) {
    document.body.classList.remove('light-theme', 'soft-dark-theme');
    if (theme === 'light') {
        document.body.classList.add('light-theme');
    } else if (theme === 'soft-dark') {
        document.body.classList.add('soft-dark-theme');
    }
    if (elements.themeSelectModal) {
        elements.themeSelectModal.value = theme;
    }
}

export async function onThemeChange(newTheme) {
    appState.theme = newTheme;
    applyThemeUI(newTheme);

    try {
        await invoke('apply_theme', { theme: newTheme });
    } catch (error) {
        console.error('Failed to apply theme to window:', error);
    }

    await saveApplicationSettings();
}

export async function loadSystemFonts() {
    if (!elements.fontFamilySelectModal) return;
    if (appState.fontsLoaded || appState.fontsLoading) return;

    try {
        if (!ensureTauriApi()) return;
        appState.fontsLoading = true;
        updateStatus('システムフォントを読み込み中...');
        const fonts = await invoke('get_system_fonts');

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

        elements.fontFamilySelectModal.value = appState.fontFamily;
        appState.fontsLoaded = true;
        updateStatus(appState.saveMode === 'manual' ? window.t('status_ready_manual') : window.t('status_ready_auto'));
    } catch (error) {
        console.error('Failed to load system fonts:', error);
        updateStatus('フォント読み込み失敗', 'error');
    } finally {
        appState.fontsLoading = false;
    }
}

export function applyFontFamily() {
    if (appState.fontFamily === 'default' || !appState.fontFamily) {
        document.documentElement.style.setProperty('--editor-font-family', DEFAULT_MONOSPACE_FONTS);
    } else {
        document.documentElement.style.setProperty('--editor-font-family', `"${appState.fontFamily}", ${DEFAULT_MONOSPACE_FONTS}`);
    }
}

export function onFontFamilyChange(event) {
    const selectEl = event && event.target ? event.target
        : (elements.fontFamilySelectModal);
    if (selectEl) {
        appState.fontFamily = selectEl.value;
    }
    applyFontFamily();
    saveSettings();
}

export async function checkNewVersion(currentVersion) {
    if (!currentVersion) return;

    try {
        await new Promise(resolve => setTimeout(resolve, 3000));

        // 最新リリース一覧を取得 (デフォルト30件)
        const response = await fetch('https://api.github.com/repos/yasudajs/NoCapEdit/releases');
        if (!response.ok) return;

        const data = await response.json();
        if (!Array.isArray(data)) return;

        // 起動中のバージョンから系列プレフィックスを抽出 (例: "0.1.34" -> "0.1.")
        const versionParts = currentVersion.split('.');
        if (versionParts.length < 2) return;
        const seriesPrefix = `${versionParts[0]}.${versionParts[1]}.`;

        // 系列に一致する最新のリリースを探索
        let targetRelease = null;
        for (const release of data) {
            const tagName = release.tag_name;
            if (!tagName) continue;
            const cleanTagName = tagName.replace(/^v/, '');
            if (cleanTagName.startsWith(seriesPrefix)) {
                targetRelease = release;
                break; // 最初に見つかったものが最新
            }
        }

        if (!targetRelease) return;

        const latestTag = targetRelease.tag_name;
        const latestVersion = latestTag.replace(/^v/, '');

        if (compareVersions(latestVersion, currentVersion) > 0) {
            const newTitle = `NoCapEdit [ Ver ${currentVersion} ] (Update: ${latestTag})`;
            document.title = newTitle;
            if (appWindow && typeof appWindow.setTitle === 'function') {
                appWindow.setTitle(newTitle);
            }

            const noticeContainer = document.getElementById('updateNoticeContainer');
            const currentVerSpan = document.getElementById('currentVerSpan');
            const latestVerSpan = document.getElementById('latestVerSpan');
            const releaseLink = document.getElementById('releaseLink');

            if (noticeContainer && currentVerSpan && latestVerSpan && releaseLink) {
                currentVerSpan.textContent = currentVersion;
                latestVerSpan.textContent = latestVersion;

                const releaseUrl = `https://github.com/yasudajs/NoCapEdit/releases/tag/${latestTag}`;
                releaseLink.href = releaseUrl;

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
        console.warn('Update check failed:', error);
    }
}
