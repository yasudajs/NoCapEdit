import { EditorView, keymap, placeholder as cmPlaceholder, drawSelection, dropCursor } from '@codemirror/view';
import { EditorState, Compartment } from '@codemirror/state';
import {
    defaultKeymap, history, historyKeymap,
    indentWithTab,
    moveLineUp, moveLineDown,
    copyLineUp, copyLineDown,
    deleteLine
} from '@codemirror/commands';
import { indentUnit, syntaxHighlighting, defaultHighlightStyle, LanguageDescription } from '@codemirror/language';
import { languages } from '@codemirror/language-data';
import { search, highlightSelectionMatches } from '@codemirror/search';

let editorView = null;
let currentPlaceholder = '';
let changeListeners = [];
let selectionListeners = [];

// 動的設定変更用 Compartments
export const wrapCompartment = new Compartment();
export const indentCompartment = new Compartment();
export const themeCompartment = new Compartment();
export const languageCompartment = new Compartment();

/**
 * ファイル名から対応する CodeMirror LanguageSupport を取得（非同期）
 * @param {string} fileName 
 * @returns {Promise<import('@codemirror/language').LanguageSupport|null>}
 */
export async function getLanguageSupport(fileName) {
    if (!fileName) return null;

    let targetName = fileName;
    if (fileName.toLowerCase().endsWith('.ncmd')) {
        targetName = fileName.slice(0, -5) + '.md';
    } else if (fileName.toLowerCase().endsWith('.nctx')) {
        return null;
    }

    const desc = LanguageDescription.matchFilename(languages, targetName);
    if (desc) {
        try {
            return await desc.load();
        } catch (e) {
            console.warn(`Failed to load language support for ${fileName}:`, e);
            return null;
        }
    }
    return null;
}

/**
 * タイムスタンプ挿入コマンド (F5)
 * @param {EditorView} view
 * @returns {boolean}
 */
export function insertTimestampCommand(view) {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const timestamp = `${year}/${month}/${day} ${hours}:${minutes}`;

    const mainSel = view.state.selection.main;
    const newPos = mainSel.from + timestamp.length;

    view.dispatch({
        changes: { from: mainSel.from, to: mainSel.to, insert: timestamp },
        selection: { anchor: newPos, head: newPos },
        scrollIntoView: true,
    });
    return true;
}

/**
 * エディタ操作用カスタムキーマップ
 */
export const customEditorKeymap = [
    indentWithTab,
    { key: "Alt-ArrowUp", run: moveLineUp },
    { key: "Alt-ArrowDown", run: moveLineDown },
    { key: "Shift-Alt-ArrowUp", run: copyLineUp },
    { key: "Shift-Alt-ArrowDown", run: copyLineDown },
    { key: "Alt-Shift-k", run: deleteLine },
    { key: "Alt-Shift-K", run: deleteLine },
    { key: "F5", run: (view) => {
        if (view.composing) return false;
        return insertTimestampCommand(view);
    }},
];

/**
 * 基本テーマ（CSS変数連動）
 */
export const baseTheme = EditorView.theme({
    "&": {
        height: "100%",
        backgroundColor: "transparent",
        color: "var(--text-primary)",
        fontFamily: "var(--editor-font-family)",
        fontSize: "var(--editor-font-size)",
        lineHeight: "var(--editor-line-height)",
    },
    ".cm-scroller": {
        fontFamily: "inherit",
        lineHeight: "inherit",
        overflow: "auto",
    },
    ".cm-content": {
        padding: "16px",
        caretColor: "var(--accent)",
    },
    ".cm-line": {
        padding: "0",
    },
    ".cm-cursor, .cm-dropCursor": {
        borderLeftColor: "var(--accent, #4daafc)",
        borderLeftWidth: "2px",
    },
    "&.cm-focused .cm-selectionBackground, ::selection": {
        backgroundColor: "var(--editor-selection-bg) !important",
    },
    ".cm-placeholder": {
        color: "var(--text-secondary)",
        opacity: "0.6",
        fontStyle: "normal",
    },
    // 検索・選択マッチのハイライトスタイル
    ".cm-selectionMatch": {
        backgroundColor: "var(--search-match-bg)",
        borderRadius: "2px",
    },
    ".cm-searchMatch": {
        backgroundColor: "var(--search-match-bg)",
        boxShadow: "0 0 0 1px var(--search-match-border)",
        borderRadius: "2px",
    },
    ".cm-searchMatch.cm-searchMatch-selected": {
        backgroundColor: "var(--search-current-bg)",
        boxShadow: "0 0 0 2px var(--search-current-border)",
        borderRadius: "2px",
    },
    // CodeMirror 検索パネル
    ".cm-panels": {
        backgroundColor: "var(--bg-secondary)",
        color: "var(--text-primary)",
        borderBottom: "1px solid var(--border)",
        fontFamily: "var(--editor-font-family, sans-serif)",
        fontSize: "13px",
    },
    ".cm-panels.cm-panels-top": {
        borderBottom: "1px solid var(--border)",
    },
    ".cm-panel.cm-search": {
        padding: "6px 12px",
        display: "flex",
        flexWrap: "wrap",
        gap: "6px",
        alignItems: "center",
    },
    ".cm-panel.cm-search input[type=text]": {
        backgroundColor: "var(--bg-primary)",
        color: "var(--text-primary)",
        border: "1px solid var(--border)",
        borderRadius: "4px",
        padding: "3px 8px",
        fontSize: "12px",
        outline: "none",
        fontFamily: "inherit",
    },
    ".cm-panel.cm-search input[type=text]:focus": {
        borderColor: "var(--accent)",
    },
    ".cm-panel.cm-search button": {
        backgroundColor: "var(--bg-tertiary)",
        color: "var(--text-primary)",
        border: "1px solid var(--border)",
        borderRadius: "4px",
        padding: "3px 10px",
        fontSize: "12px",
        cursor: "pointer",
        transition: "all 0.15s ease",
    },
    ".cm-panel.cm-search button:hover": {
        backgroundColor: "var(--border)",
        borderColor: "var(--accent)",
    },
    ".cm-panel.cm-search label": {
        color: "var(--text-secondary)",
        fontSize: "12px",
        display: "inline-flex",
        alignItems: "center",
        gap: "4px",
        cursor: "pointer",
    },
    ".cm-panel.cm-search button[name=close]": {
        marginLeft: "auto",
        backgroundColor: "transparent",
        border: "none",
        color: "var(--text-secondary)",
        fontSize: "14px",
        cursor: "pointer",
        padding: "2px 6px",
    },
    ".cm-panel.cm-search button[name=close]:hover": {
        color: "var(--text-primary)",
    }
});

/**
 * インデント拡張を取得
 * @param {string} tabBehavior - 'tab' | 'space2' | 'space4'
 * @returns {import('@codemirror/state').Extension}
 */
export function getIndentExtension(tabBehavior = 'tab') {
    switch (tabBehavior) {
        case 'space2': return indentUnit.of('  ');
        case 'space4': return indentUnit.of('    ');
        case 'tab':
        default:
            return indentUnit.of('\t');
    }
}

/**
 * 共通の拡張機能（Extensions）を取得
 * @param {Object} [options]
 * @param {boolean} [options.wordWrap=true]
 * @param {string} [options.tabBehavior='tab']
 * @param {import('@codemirror/language').LanguageSupport|Array} [options.languageSupport=[]]
 * @returns {Array}
 */
export function getDefaultExtensions(options = {}) {
    const wrap = options.wordWrap !== undefined ? options.wordWrap : true;
    const tabBehavior = options.tabBehavior || 'tab';
    const languageSupport = options.languageSupport || [];

    const extensions = [
        history(),
        drawSelection(),
        dropCursor(),
        syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
        languageCompartment.of(languageSupport),
        search({ top: true }),
        highlightSelectionMatches(),
        themeCompartment.of(baseTheme),
        wrapCompartment.of(wrap ? EditorView.lineWrapping : []),
        indentCompartment.of(getIndentExtension(tabBehavior)),
        keymap.of([
            ...customEditorKeymap,
            ...defaultKeymap,
            ...historyKeymap,
        ]),
        EditorView.updateListener.of((update) => {
            if (update.docChanged) {
                changeListeners.forEach(listener => listener(update));
            }
            if (update.selectionSet || update.docChanged) {
                selectionListeners.forEach(listener => listener(update));
            }
        }),
    ];

    if (currentPlaceholder) {
        extensions.push(cmPlaceholder(currentPlaceholder));
    }

    return extensions;
}

/**
 * 新規タブ用の EditorState を生成
 * @param {string} [initialContent=''] - 初期テキスト
 * @param {Object} [options={}] - オプション (wordWrap, tabBehavior, languageSupport 等)
 * @returns {EditorState}
 */
export function createTabState(initialContent = '', options = {}) {
    return EditorState.create({
        doc: initialContent,
        extensions: getDefaultExtensions(options),
    });
}

/**
 * ファイル名に応じて EditorView の言語ハイライトを動的に更新
 * @param {EditorView} view
 * @param {string} fileName
 */
export async function updateLanguageForFileName(view, fileName) {
    if (!view) return;
    const langSupport = await getLanguageSupport(fileName);
    view.dispatch({
        effects: languageCompartment.reconfigure(langSupport || [])
    });
}

/**
 * CodeMirror の初期化
 * @param {HTMLElement} parentEl - エディタを配置する親要素 (#editor)
 * @param {Object} options - 初期化オプション
 * @param {string} [options.initialContent=''] - 初期テキスト
 * @param {string} [options.placeholder=''] - プレースホルダー文字列
 * @param {boolean} [options.wordWrap=true] - 折り返し初期状態
 * @param {string} [options.tabBehavior='tab'] - インデント挙動
 * @param {EditorState} [options.state] - 初期 EditorState
 * @param {Function} [options.onDocChange] - ドキュメント変更時コールバック
 * @param {Function} [options.onSelectionChange] - 選択範囲・カーソル変更時コールバック
 * @returns {EditorView}
 */
export function initCodeMirror(parentEl, options = {}) {
    if (editorView) {
        editorView.destroy();
        editorView = null;
    }

    if (options.onDocChange) {
        changeListeners = [options.onDocChange];
    }
    if (options.onSelectionChange) {
        selectionListeners = [options.onSelectionChange];
    }
    if (options.placeholder) {
        currentPlaceholder = options.placeholder;
    }

    const state = options.state || createTabState(options.initialContent || '', {
        wordWrap: options.wordWrap,
        tabBehavior: options.tabBehavior,
    });

    editorView = new EditorView({
        state,
        parent: parentEl,
    });

    return editorView;
}

/**
 * 折り返し（Line Wrapping）の動的更新
 * @param {boolean} enable
 */
export function updateWrap(enable) {
    if (!editorView) return;
    editorView.dispatch({
        effects: wrapCompartment.reconfigure(enable ? EditorView.lineWrapping : [])
    });
}

/**
 * インデント設定の動的更新
 * @param {string} tabBehavior - 'tab' | 'space2' | 'space4'
 */
export function updateIndent(tabBehavior) {
    if (!editorView) return;
    editorView.dispatch({
        effects: indentCompartment.reconfigure(getIndentExtension(tabBehavior))
    });
}

/**
 * 現在の EditorView インスタンスを取得
 * @returns {EditorView|null}
 */
export function getEditorView() {
    return editorView;
}

/**
 * 現在の EditorState を取得
 * @returns {EditorState|null}
 */
export function getEditorState() {
    return editorView ? editorView.state : null;
}

/**
 * EditorState をエディタに丸ごと設定（タブ切り替え用）
 * @param {EditorState} state
 */
export function setEditorState(state) {
    if (!editorView || !state) return;
    editorView.setState(state);
}

/**
 * エディタ内のテキスト全文を取得
 * @returns {string}
 */
export function getContent() {
    if (!editorView) return '';
    return editorView.state.doc.toString();
}

/**
 * エディタ内のテキストを設定
 * @param {string} text - 設定するテキスト
 * @param {boolean} [clearHistory=false] - 履歴をクリアして新しい状態にするか
 */
export function setContent(text, clearHistory = false) {
    if (!editorView) return;

    if (clearHistory) {
        const newState = createTabState(text);
        editorView.setState(newState);
    } else {
        const currentDocLen = editorView.state.doc.length;
        editorView.dispatch({
            changes: { from: 0, to: currentDocLen, insert: text },
        });
    }
}

/**
 * 現在の選択範囲・カーソル位置を取得
 * @returns {{ from: number, to: number, head: number, anchor: number, empty: boolean }}
 */
export function getSelection() {
    if (!editorView) {
        return { from: 0, to: 0, head: 0, anchor: 0, empty: true };
    }
    const mainSel = editorView.state.selection.main;
    return {
        from: mainSel.from,
        to: mainSel.to,
        head: mainSel.head,
        anchor: mainSel.anchor,
        empty: mainSel.empty,
    };
}

/**
 * 選択範囲・カーソル位置を設定
 * @param {number} anchor - 選択開始位置
 * @param {number} [head=anchor] - 選択終了位置
 */
export function setSelection(anchor, head = anchor) {
    if (!editorView) return;
    const docLen = editorView.state.doc.length;
    const safeAnchor = Math.max(0, Math.min(anchor, docLen));
    const safeHead = Math.max(0, Math.min(head, docLen));

    editorView.dispatch({
        selection: { anchor: safeAnchor, head: safeHead },
        scrollIntoView: true,
    });
}

/**
 * エディタにフォーカスを設定
 */
export function focusEditor() {
    if (editorView) {
        editorView.focus();
    }
}

/**
 * 現在のカーソル位置およびテキスト統計情報を取得（ステータスバー用）
 * @returns {{ line: number, col: number, totalChars: number, selectedChars: number, isSelected: boolean, docLength: number }}
 */
export function getCursorMetrics(charCountMode = 'with_newline') {
    if (!editorView) {
        return { line: 1, col: 1, totalChars: 0, selectedChars: 0, isSelected: false, docLength: 0 };
    }

    const state = editorView.state;
    const doc = state.doc;
    const mainSel = state.selection.main;
    const head = mainSel.head;

    // 行・列番号の算出
    const lineObj = doc.lineAt(head);
    const line = lineObj.number;
    const col = head - lineObj.from + 1;

    const docLength = doc.length;
    const isSelected = !mainSel.empty;

    let totalChars = docLength;
    let selectedChars = 0;

    if (charCountMode === 'no_newline') {
        const newlineCount = doc.lines - 1;
        totalChars = docLength - newlineCount;

        if (isSelected) {
            const selectedText = doc.sliceString(mainSel.from, mainSel.to);
            const selNewlines = (selectedText.match(/[\r\n]/g) || []).length;
            selectedChars = selectedText.length - selNewlines;
        }
    } else {
        if (isSelected) {
            selectedChars = mainSel.to - mainSel.from;
        }
    }

    return {
        line,
        col,
        totalChars,
        selectedChars,
        isSelected,
        docLength,
    };
}

/**
 * テキスト置換ヘルパー（Undo履歴対応）
 * @param {number} from - 置換開始インデックス
 * @param {number} to - 置換終了インデックス
 * @param {string} insertText - 挿入するテキスト
 * @param {number} [newCursorPos] - 置換後のカーソル位置
 */
export function replaceRange(from, to, insertText, newCursorPos) {
    if (!editorView) return;

    const transaction = {
        changes: { from, to, insert: insertText },
    };

    if (newCursorPos !== undefined) {
        transaction.selection = { anchor: newCursorPos, head: newCursorPos };
    }

    editorView.dispatch(transaction);
}

/**
 * 複数箇所を一括置換（1つのUndo履歴として記録）
 * @param {Array<{from: number, to: number, insert: string}>} changes
 */
export function replaceAllMatches(changes) {
    if (!editorView || !changes || changes.length === 0) return;

    editorView.dispatch({
        changes,
    });
}

/**
 * 指定範囲を選択し、中央付近へスムーズにスクロール
 * @param {number} from
 * @param {number} to
 */
export function selectAndScrollTo(from, to) {
    if (!editorView) return;
    const docLen = editorView.state.doc.length;
    const safeFrom = Math.max(0, Math.min(from, docLen));
    const safeTo = Math.max(0, Math.min(to, docLen));

    editorView.dispatch({
        selection: { anchor: safeFrom, head: safeTo },
        scrollIntoView: true,
    });
}

/**
 * 現在選択されている文字列を取得
 * @returns {string}
 */
export function getSelectionText() {
    if (!editorView) return '';
    const mainSel = editorView.state.selection.main;
    if (mainSel.empty) return '';
    return editorView.state.doc.sliceString(mainSel.from, mainSel.to);
}

