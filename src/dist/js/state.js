export const AUTOSAVE_DELAY_MS = 3000;
export const MAX_FONT_SIZE = 72;
export const MIN_FONT_SIZE = 8;
export const MAX_LINE_HEIGHT = 3.0;
export const MIN_LINE_HEIGHT = 1.0;
export const LINE_HEIGHT_STEP = 0.1;
export const DEFAULT_MONOSPACE_FONTS = "'Fira Code', 'Monaco', 'Menlo', monospace";

export const FILE_EXT_NCTX = 'nctx';
export const FILE_EXT_NCMD = 'ncmd';

// アプリケーション状態
export let appState = {
    currentTab: null,
    tabs: [],
    homeFolder: null,
    theme: null,
    fontSize: null,
    savedFontSize: null,
    fontFamily: null,
    lineHeight: null,
    savedLineHeight: null,
    tabBehavior: null,
    saveMode: null,
    charCountMode: null,
    wordWrap: true,
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
    app: null,
    tabsContainer: null,
    addTabBtn: null,
    settingsBtn: null,
    fontFamilySelectModal: null,
    fontSizeSelectModal: null,
    lineHeightSelectModal: null,
    tabBehaviorSelectModal: null,
    saveModeSelectModal: null,
    charCountModeSelectModal: null,
    wordWrapSelectModal: null,
    themeSelectModal: null,
    editor: null,
    editorBackdrop: null,
    editorHighlights: null,
    findReplaceWidget: null,
    findInput: null,
    matchCaseBtn: null,
    findMatchCount: null,
    findPrevBtn: null,
    findNextBtn: null,
    closeFindBtn: null,
    replaceRow: null,
    replaceInput: null,
    replaceOneBtn: null,
    replaceAllBtn: null,
    statusText: null,
    statusMetrics: null,
    settingsDialog: null,
    homeFolderInput: null,
    browseFolderBtn: null,
    confirmSettingsBtn: null,
    errorDialog: null,
    errorMessage: null,
    retryBtn: null,
    saveAsBtn: null,
    cancelExitBtn: null,
    folderHint: null,
    updateNoticeContainer: null,
    currentVerSpan: null,
    latestVerSpan: null,
    releaseLink: null,
};

// DOM要素のキャッシュを再取得する関数（現状は起動時の一回でOK）
export function initElements() {
    for (const key in elements) {
        elements[key] = document.getElementById(key);
    }
}
