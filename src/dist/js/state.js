export const AUTOSAVE_DELAY_MS = 3000;
export const MAX_FONT_SIZE = 72;
export const MIN_FONT_SIZE = 8;
export const MAX_LINE_HEIGHT = 3.0;
export const MIN_LINE_HEIGHT = 1.0;
export const LINE_HEIGHT_STEP = 0.1;
export const DEFAULT_MONOSPACE_FONTS = "'Fira Code', 'Monaco', 'Menlo', monospace";
export const AUTO_FILE_REGEX = /^\d{8}_\d{6}(_\d{2})?\.nctx$/;
export const FILE_EXT_NCTX = 'nctx';
export const FILE_EXT_NCMD = 'ncmd';

// アプリケーション状態
export let appState = {
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
export let savedEditorCursor = null;

// セッション内の未保存タブ連番カウンタ（再起動でリセット）
export let unsavedTabCounter = 0;

export function setSavedEditorCursor(cursor) {
    savedEditorCursor = cursor;
}

export function incrementUnsavedTabCounter() {
    unsavedTabCounter++;
    return unsavedTabCounter;
}

export function setAppState(key, value) {
    appState[key] = value;
}

// DOM要素キャッシュ
export const elements = {
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

// DOM要素のキャッシュを再取得する関数（現状は起動時の一回でOK）
export function initElements() {
    for (const key in elements) {
        elements[key] = document.getElementById(key);
    }
}
