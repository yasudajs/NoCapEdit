/**
 * 検索・置換UIモジュール (findReplace.js)
 * CodeMirror 6 と連携し、右上フロート型のコンパクトな2行レイアウトで検索・置換機能を提供します。
 */

import {
    getEditorView,
    getContent,
    getSelectionText,
    selectAndScrollTo,
    replaceRange,
    replaceAllMatches,
    focusEditor,
    getCursorMetrics,
} from './codemirror.js';
import { t } from '../../i18n.js';
import { updateEditorMetrics } from './editor.js';
import { updateStatus } from './tabs.js';

let elements = {
    widget: null,
    findRow: null,
    replaceRow: null,
    findInput: null,
    replaceInput: null,
    matchCount: null,
    findPrevBtn: null,
    findNextBtn: null,
    closeFindBtn: null,
    matchCaseBtn: null,
    replaceOneBtn: null,
    replaceAllBtn: null,
};

let matches = []; // [{ from, to }]
let currentMatchIndex = -1;
let isMatchCase = false;
let debounceTimer = null;

/**
 * 検索・置換モジュールの初期化
 */
export function initFindReplace() {
    elements.widget = document.getElementById('findReplaceWidget');
    if (!elements.widget) return;

    elements.findRow = elements.widget.querySelector('.find-row');
    elements.replaceRow = document.getElementById('replaceRow');
    elements.findInput = document.getElementById('findInput');
    elements.replaceInput = document.getElementById('replaceInput');
    elements.matchCount = document.getElementById('findMatchCount');
    elements.findPrevBtn = document.getElementById('findPrevBtn');
    elements.findNextBtn = document.getElementById('findNextBtn');
    elements.closeFindBtn = document.getElementById('closeFindBtn');
    elements.matchCaseBtn = document.getElementById('matchCaseBtn');
    elements.replaceOneBtn = document.getElementById('replaceOneBtn');
    elements.replaceAllBtn = document.getElementById('replaceAllBtn');

    setupEventListeners();
}

/**
 * 検索パネルが開いているか
 * @returns {boolean}
 */
export function isFindWidgetOpen() {
    return elements.widget && !elements.widget.classList.contains('hidden');
}

/**
 * 検索パネルを開く (Ctrl+F)
 */
export function openFind() {
    if (!elements.widget) return;

    elements.widget.classList.remove('hidden');
    // 置換行は隠す（Ctrl+H で展開）
    if (elements.replaceRow) {
        elements.replaceRow.classList.add('hidden');
    }

    applySelectionToFindInput();
    updateMatches(true);

    if (elements.findInput) {
        elements.findInput.focus();
        elements.findInput.select();
    }
}

/**
 * 検索・置換パネルを開く (Ctrl+H)
 */
export function openReplace() {
    if (!elements.widget) return;

    elements.widget.classList.remove('hidden');
    if (elements.replaceRow) {
        elements.replaceRow.classList.remove('hidden');
    }

    applySelectionToFindInput();
    updateMatches(true);

    if (elements.findInput) {
        elements.findInput.focus();
        elements.findInput.select();
    }
}

/**
 * 検索・置換パネルを閉じる (Esc)
 */
export function closeFind() {
    if (!elements.widget) return;

    elements.widget.classList.add('hidden');
    matches = [];
    currentMatchIndex = -1;
    updateCountDisplay();
    focusEditor();
}

/**
 * エディタの選択中テキストを検索欄にセットする
 */
function applySelectionToFindInput() {
    if (!elements.findInput) return;
    const selectedText = getSelectionText();
    // 改行を含まない短い選択範囲であれば検索テキストに自動採用
    if (selectedText && selectedText.indexOf('\n') === -1 && selectedText.length <= 100) {
        elements.findInput.value = selectedText;
    }
}

/**
 * マッチ件数の表示更新
 */
function updateCountDisplay() {
    if (!elements.matchCount) return;

    const query = elements.findInput ? elements.findInput.value : '';
    if (!query || matches.length === 0) {
        elements.matchCount.textContent = '0 / 0';
        elements.matchCount.classList.toggle('no-matches', !!query);
    } else {
        elements.matchCount.classList.remove('no-matches');
        const displayIndex = currentMatchIndex >= 0 ? currentMatchIndex + 1 : 1;
        elements.matchCount.textContent = `${displayIndex} / ${matches.length}`;
    }
}

/**
 * テキスト内のマッチ位置を検索・更新
 * @param {boolean} [shouldJump=false] - 現在のマッチ箇所にジャンプ・選択するか
 */
export function updateMatches(shouldJump = false) {
    if (!elements.findInput) return;

    const query = elements.findInput.value;
    if (!query) {
        matches = [];
        currentMatchIndex = -1;
        updateCountDisplay();
        return;
    }

    const fullText = getContent();
    const targetText = isMatchCase ? fullText : fullText.toLowerCase();
    const targetQuery = isMatchCase ? query : query.toLowerCase();

    matches = [];
    let pos = 0;
    const qLen = targetQuery.length;
    while ((pos = targetText.indexOf(targetQuery, pos)) !== -1) {
        matches.push({ from: pos, to: pos + qLen });
        pos += qLen;
    }

    if (matches.length === 0) {
        currentMatchIndex = -1;
        updateCountDisplay();
        return;
    }

    // 現在のカーソル位置から最も近いマッチを特定
    const view = getEditorView();
    const currentCursor = view ? view.state.selection.main.from : 0;

    let nearest = matches.findIndex(m => m.from >= currentCursor);
    if (nearest === -1) nearest = 0;
    currentMatchIndex = nearest;

    updateCountDisplay();

    if (shouldJump && currentMatchIndex >= 0) {
        highlightMatch(currentMatchIndex);
    }
}

/**
 * 指定インデックスのマッチ位置に移動・選択
 * @param {number} index
 */
function highlightMatch(index) {
    if (index < 0 || index >= matches.length) return;
    currentMatchIndex = index;
    const match = matches[index];

    selectAndScrollTo(match.from, match.to);
    updateEditorMetrics();
    updateCountDisplay();
}

/**
 * 次のマッチへ移動 (Enter / ▼)
 */
export function findNext() {
    if (matches.length === 0) {
        updateMatches(true);
        return;
    }
    currentMatchIndex = (currentMatchIndex + 1) % matches.length;
    highlightMatch(currentMatchIndex);
}

/**
 * 前のマッチへ移動 (Shift+Enter / ▲)
 */
export function findPrev() {
    if (matches.length === 0) {
        updateMatches(true);
        return;
    }
    currentMatchIndex = (currentMatchIndex - 1 + matches.length) % matches.length;
    highlightMatch(currentMatchIndex);
}

/**
 * 単一置換 (Enter in replace input)
 */
export function replaceOne() {
    if (!elements.findInput || !elements.replaceInput) return;
    const query = elements.findInput.value;
    if (!query) return;

    if (matches.length === 0 || currentMatchIndex < 0) {
        updateMatches(true);
        if (matches.length === 0) return;
    }

    const replaceText = elements.replaceInput.value;
    const match = matches[currentMatchIndex];
    const view = getEditorView();
    if (!view) return;

    const mainSel = view.state.selection.main;

    // 現在のマッチが選択されているか確認
    if (mainSel.from === match.from && mainSel.to === match.to) {
        // 置換実行
        replaceRange(match.from, match.to, replaceText, match.from + replaceText.length);
        updateMatches(true);
    } else {
        // 選択されていない場合はまずジャンプ
        highlightMatch(currentMatchIndex);
    }
}

/**
 * すべて置換 (Alt+A)
 */
export function replaceAll() {
    if (!elements.findInput || !elements.replaceInput) return;
    const query = elements.findInput.value;
    if (!query) return;

    updateMatches(false);
    if (matches.length === 0) return;

    const replaceText = elements.replaceInput.value;
    const totalCount = matches.length;

    // 後ろから順に置換することでインデックスのズレを防止
    const changes = [];
    for (let i = matches.length - 1; i >= 0; i--) {
        changes.push({
            from: matches[i].from,
            to: matches[i].to,
            insert: replaceText,
        });
    }

    replaceAllMatches(changes);

    const msg = (t('ui.find.replacedCount') || '{count} 件を置換しました').replace('{count}', totalCount);
    updateStatus(msg);

    updateMatches(false);
}

/**
 * 大文字・小文字区別の切り替え (Alt+C / Aaボタン)
 */
export function toggleMatchCase() {
    isMatchCase = !isMatchCase;
    if (elements.matchCaseBtn) {
        elements.matchCaseBtn.classList.toggle('active', isMatchCase);
    }
    updateMatches(true);
}

/**
 * UI イベントリスナーの登録
 */
function setupEventListeners() {
    // 検索入力欄のイベント
    if (elements.findInput) {
        elements.findInput.addEventListener('input', () => {
            if (debounceTimer) clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                updateMatches(true);
            }, 100);
        });

        elements.findInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                if (e.shiftKey) {
                    findPrev();
                } else {
                    findNext();
                }
            } else if (e.key === 'Escape') {
                e.preventDefault();
                closeFind();
            }
        });
    }

    // 置換入力欄のイベント
    if (elements.replaceInput) {
        elements.replaceInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                if (e.altKey) {
                    replaceAll();
                } else {
                    replaceOne();
                }
            } else if (e.key === 'Escape') {
                e.preventDefault();
                closeFind();
            }
        });
    }

    // ボタンイベント
    if (elements.findNextBtn) {
        elements.findNextBtn.addEventListener('click', () => findNext());
    }
    if (elements.findPrevBtn) {
        elements.findPrevBtn.addEventListener('click', () => findPrev());
    }
    if (elements.closeFindBtn) {
        elements.closeFindBtn.addEventListener('click', () => closeFind());
    }
    if (elements.matchCaseBtn) {
        elements.matchCaseBtn.addEventListener('click', () => toggleMatchCase());
    }
    if (elements.replaceOneBtn) {
        elements.replaceOneBtn.addEventListener('click', () => replaceOne());
    }
    if (elements.replaceAllBtn) {
        elements.replaceAllBtn.addEventListener('click', () => replaceAll());
    }

    // ウィジェット全体のキーボードショートカット
    elements.widget.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            e.preventDefault();
            closeFind();
        } else if (e.altKey && (e.key === 'c' || e.key === 'C' || e.code === 'KeyC')) {
            e.preventDefault();
            toggleMatchCase();
        } else if (e.altKey && (e.key === 'a' || e.key === 'A' || e.code === 'KeyA')) {
            e.preventDefault();
            replaceAll();
        }
    });

    // タブ切り替え時に検索マッチを同期
    window.addEventListener('tab-switched', () => {
        if (isFindWidgetOpen()) {
            updateMatches(false);
        }
    });
}
