import { t } from '../../i18n.js';
import { elements, appState } from '../state.js';
import { applyEditorTextWithUndo, updateEditorMetrics } from './editor.js';

let isMatchCase = false;
let matches = [];
let currentMatchIndex = -1;

function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function escapeHtml(str) {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

export function isFindWidgetOpen() {
    return elements.findReplaceWidget && !elements.findReplaceWidget.classList.contains('hidden');
}

export function syncBackdropScroll() {
    if (elements.editorBackdrop && elements.editor) {
        elements.editorBackdrop.scrollTop = elements.editor.scrollTop;
        elements.editorBackdrop.scrollLeft = elements.editor.scrollLeft;
    }
}

export function renderHighlights() {
    if (!elements.editorHighlights || !elements.editor) return;

    if (!isFindWidgetOpen() || matches.length === 0) {
        elements.editorHighlights.innerHTML = '';
        return;
    }

    const text = elements.editor.value;
    const query = elements.findInput ? elements.findInput.value : '';
    const qLen = query.length;
    if (qLen === 0) {
        elements.editorHighlights.innerHTML = '';
        return;
    }

    let html = '';
    let lastIndex = 0;

    for (let i = 0; i < matches.length; i++) {
        const start = matches[i];
        const end = start + qLen;
        const isCurrent = (i === currentMatchIndex);

        // 一致前のプレーンテキスト
        html += escapeHtml(text.substring(lastIndex, start));

        // 一致テキストを <mark> で囲む
        const matchText = escapeHtml(text.substring(start, end));
        html += `<mark class="search-match ${isCurrent ? 'current' : ''}">${matchText}</mark>`;

        lastIndex = end;
    }

    // 残りのテキスト
    html += escapeHtml(text.substring(lastIndex));

    // 末尾改行の表示崩れ防止
    if (text.endsWith('\n')) {
        html += '<br>';
    }

    elements.editorHighlights.innerHTML = html;
    syncBackdropScroll();
}

export function openFind(focusReplace = false) {
    if (!elements.findReplaceWidget) return;

    elements.findReplaceWidget.classList.remove('hidden');

    if (focusReplace) {
        if (elements.replaceRow) {
            elements.replaceRow.classList.remove('hidden');
        }
    }

    // エディタでテキストが選択されていれば検索文字列に設定
    if (elements.editor) {
        const selStart = elements.editor.selectionStart;
        const selEnd = elements.editor.selectionEnd;
        if (selStart !== selEnd) {
            const selectedText = elements.editor.value.substring(selStart, selEnd);
            if (!selectedText.includes('\n') && selectedText.length > 0 && selectedText.length <= 100) {
                if (elements.findInput) {
                    elements.findInput.value = selectedText;
                }
            }
        }
    }

    if (elements.editor) {
        elements.editor.classList.add('search-active');
    }

    updateMatches(true);

    if (focusReplace && elements.replaceInput) {
        elements.replaceInput.focus();
        elements.replaceInput.select();
    } else if (elements.findInput) {
        elements.findInput.focus();
        elements.findInput.select();
    }
}

export function closeFind() {
    if (!elements.findReplaceWidget) return;
    elements.findReplaceWidget.classList.add('hidden');
    if (elements.editorHighlights) {
        elements.editorHighlights.innerHTML = '';
    }
    if (elements.editor) {
        elements.editor.classList.remove('search-active');
        elements.editor.focus();
    }
}

function updateCountDisplay() {
    if (!elements.findMatchCount) return;
    if (matches.length === 0) {
        const query = elements.findInput ? elements.findInput.value : '';
        elements.findMatchCount.textContent = query ? (t('ui.find.noMatches') || '0 / 0') : '0 / 0';
        elements.findMatchCount.classList.toggle('no-matches', !!query);
    } else {
        elements.findMatchCount.classList.remove('no-matches');
        const displayIndex = currentMatchIndex >= 0 ? currentMatchIndex + 1 : 1;
        elements.findMatchCount.textContent = `${displayIndex} / ${matches.length}`;
    }
}

export function updateMatches(shouldJump = false) {
    if (!elements.findInput || !elements.editor) return;

    const query = elements.findInput.value;
    if (!query) {
        matches = [];
        currentMatchIndex = -1;
        updateCountDisplay();
        renderHighlights();
        return;
    }

    const text = elements.editor.value;
    const targetText = isMatchCase ? text : text.toLowerCase();
    const targetQuery = isMatchCase ? query : query.toLowerCase();

    matches = [];
    let pos = 0;
    const qLen = targetQuery.length;
    while ((pos = targetText.indexOf(targetQuery, pos)) !== -1) {
        matches.push(pos);
        pos += qLen;
    }

    if (matches.length === 0) {
        currentMatchIndex = -1;
        updateCountDisplay();
        renderHighlights();
        return;
    }

    const caret = elements.editor.selectionStart || 0;
    let nearest = matches.findIndex(idx => idx >= caret);
    if (nearest === -1) nearest = 0;
    currentMatchIndex = nearest;

    updateCountDisplay();

    if (shouldJump && currentMatchIndex >= 0) {
        highlightMatch(currentMatchIndex);
    } else {
        renderHighlights();
    }
}

function highlightMatch(index) {
    if (!elements.editor || index < 0 || index >= matches.length) return;
    currentMatchIndex = index;
    const start = matches[index];
    const query = elements.findInput ? elements.findInput.value : '';
    const end = start + query.length;

    elements.editor.setSelectionRange(start, end);
    updateEditorMetrics();
    renderHighlights();

    // 現在のハイライト要素に合わせてスクロール位置を調整
    if (elements.editorHighlights && elements.editor) {
        const currentMark = elements.editorHighlights.querySelector('mark.current');
        if (currentMark) {
            const markTop = currentMark.offsetTop;
            const targetScroll = markTop - (elements.editor.clientHeight / 2);
            elements.editor.scrollTop = Math.max(0, targetScroll);
            syncBackdropScroll();
        }
    }
}

export function findNext() {
    if (matches.length === 0) return;
    currentMatchIndex = (currentMatchIndex + 1) % matches.length;
    highlightMatch(currentMatchIndex);
    updateCountDisplay();
}

export function findPrev() {
    if (matches.length === 0) return;
    currentMatchIndex = (currentMatchIndex - 1 + matches.length) % matches.length;
    highlightMatch(currentMatchIndex);
    updateCountDisplay();
}

export function replaceOne() {
    if (!elements.editor || !elements.findInput || !elements.replaceInput) return;
    const query = elements.findInput.value;
    if (!query) return;

    if (matches.length === 0) {
        updateMatches(true);
        if (matches.length === 0) return;
    }

    const replaceText = elements.replaceInput.value;
    const selStart = elements.editor.selectionStart;
    const selEnd = elements.editor.selectionEnd;
    const currentPos = matches[currentMatchIndex];

    if (selStart === currentPos && selEnd === currentPos + query.length) {
        // 現在選択中のマッチを置換
        applyEditorTextWithUndo(selStart, selEnd, replaceText, selStart + replaceText.length, selStart + replaceText.length);
        updateMatches(true);
    } else {
        // 現在位置にフォーカスされていない場合はまずジャンプ
        highlightMatch(currentMatchIndex);
    }
}

export function replaceAll() {
    if (!elements.editor || !elements.findInput || !elements.replaceInput) return;
    const query = elements.findInput.value;
    if (!query) return;

    updateMatches(false);
    if (matches.length === 0) return;

    const replaceText = elements.replaceInput.value;
    const totalCount = matches.length;
    const fullText = elements.editor.value;

    let newFullText;
    if (isMatchCase) {
        newFullText = fullText.split(query).join(replaceText);
    } else {
        const regex = new RegExp(escapeRegExp(query), 'gi');
        newFullText = fullText.replace(regex, replaceText);
    }

    applyEditorTextWithUndo(0, fullText.length, newFullText, 0, 0);
    
    const msg = (t('ui.find.replacedCount') || '{count} 件を置換しました').replace('{count}', totalCount);
    if (elements.statusText) {
        elements.statusText.textContent = msg;
        elements.statusText.className = 'status-text';
    }
    updateMatches(false);
}

export function toggleMatchCase() {
    isMatchCase = !isMatchCase;
    if (elements.matchCaseBtn) {
        elements.matchCaseBtn.classList.toggle('active', isMatchCase);
    }
    updateMatches(true);
}

export function setupFindReplaceEvents() {
    if (!elements.findReplaceWidget) return;

    // エディタのスクロール同期および編集時のハイライト再計算
    if (elements.editor) {
        elements.editor.addEventListener('scroll', syncBackdropScroll);
        elements.editor.addEventListener('input', () => {
            if (isFindWidgetOpen()) {
                updateMatches(false);
            }
        });
    }

    // タブ切り替え時のハイライト同期
    window.addEventListener('tab-switched', () => {
        if (isFindWidgetOpen()) {
            updateMatches(false);
        }
    });

    // 入力監視
    if (elements.findInput) {
        elements.findInput.addEventListener('input', () => updateMatches(true));
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

    // ボタンクリック
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

    // ウィジェット内キーボードショートカット
    elements.findReplaceWidget.addEventListener('keydown', (e) => {
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
}
