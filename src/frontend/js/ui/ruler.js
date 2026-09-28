import { t } from '../../i18n.js';
import { appState, elements } from '../state.js';
import { getEditorView } from './codemirror.js';
import { getCurrentTab } from './tabs.js';

const MAX_MARKERS = 10;
const DEFAULT_RULER_COLS = 300;

let currentScrollLeft = 0;
let cachedCharWidth = 0;
let cachedGutterOffset = 0;

/**
 * 等幅フォントの半角1文字幅（px）を取得
 * エディタ本文（.cm-content）と同一のCSSコンテキストで半角文字 '0' を直接実測
 * @returns {number}
 */
export function getCharWidth() {
    const view = getEditorView();
    if (view && view.dom) {
        const content = view.dom.querySelector('.cm-content');
        if (content) {
            const span = document.createElement('span');
            span.style.visibility = 'hidden';
            span.style.position = 'absolute';
            span.style.pointerEvents = 'none';
            span.textContent = '0';
            content.appendChild(span);
            const width = span.getBoundingClientRect().width;
            content.removeChild(span);
            if (width > 0) {
                cachedCharWidth = width;
                return cachedCharWidth;
            }
        }
    }

    if (cachedCharWidth > 0) {
        return cachedCharWidth;
    }

    return 12;
}

/**
 * テキスト本文の1文字目左端座標（px）を取得
 * view.coordsAtPos(0) または .cm-line の実際の描画左端座標から算出し、
 * 0桁目の目盛り線を1文字目の左端と完全に一致させる
 * @returns {number}
 */
export function getGutterOffset() {
    const view = getEditorView();
    if (view && view.dom && elements.editor) {
        const container = elements.editor.closest('.editor-container') || elements.editor;
        const containerRect = container.getBoundingClientRect();

        // 1. view.coordsAtPos(0) による1文字目の描画左端座標
        const pos0 = view.coordsAtPos(0);
        if (pos0) {
            const offset = pos0.left - containerRect.left + currentScrollLeft;
            if (offset > 0) {
                cachedGutterOffset = offset;
                return cachedGutterOffset;
            }
        }

        // 2. .cm-line の左端座標（line の paddingLeft 適用後の文字開始位置）
        const firstLine = view.dom.querySelector('.cm-line');
        if (firstLine) {
            const lineRect = firstLine.getBoundingClientRect();
            const paddingLeft = parseFloat(window.getComputedStyle(firstLine).paddingLeft) || 0;
            const offset = lineRect.left + paddingLeft - containerRect.left + currentScrollLeft;
            if (offset > 0) {
                cachedGutterOffset = offset;
                return cachedGutterOffset;
            }
        }
    }

    // フォールバック計算（ガター幅 + 16px padding）
    let fallback = 16;
    if (view && view.dom) {
        const gutters = view.dom.querySelector('.cm-gutters');
        if (gutters && gutters.offsetWidth > 0) {
            fallback = gutters.offsetWidth + 16;
        }
    }
    cachedGutterOffset = fallback;
    return cachedGutterOffset;
}

/**
 * ルーラーの初期化
 */
export function initRuler() {
    elements.rulerContainer = document.getElementById('rulerContainer');
    elements.rulerGutterSpacer = document.getElementById('rulerGutterSpacer');
    elements.rulerTrackWrapper = document.getElementById('rulerTrackWrapper');
    elements.rulerTrack = document.getElementById('rulerTrack');
    elements.rulerCursor = document.getElementById('rulerCursor');
    elements.rulerGuidesOverlay = document.getElementById('rulerGuidesOverlay');

    if (!elements.rulerTrackWrapper) return;

    // ルーラー上でのクリック処理（マーカーの追加/削除）
    elements.rulerTrackWrapper.addEventListener('click', onRulerClick);

    // ウィンドウリサイズ時の同期
    window.addEventListener('resize', () => {
        if (!isRulerActive()) return;
        syncRulerMetrics();
    });

    // エディタ領域のサイズ変動（行番号ガター幅変化、フォント変更等）を検知して自動同期
    if (window.ResizeObserver && elements.editor) {
        const ro = new ResizeObserver(() => {
            if (isRulerActive()) {
                syncRulerMetrics();
            }
        });
        ro.observe(elements.editor);
    }
}

/**
 * 現在アクティブなタブでルーラーが表示中かどうか
 * @returns {boolean}
 */
export function isRulerActive() {
    const tab = getCurrentTab();
    if (!tab) return false;
    return tab.ruler !== undefined ? tab.ruler : appState.ruler;
}

/**
 * ルーラー上のクリックイベントハンドラ
 * @param {MouseEvent} e
 */
function onRulerClick(e) {
    const tab = getCurrentTab();
    if (!tab) return;
    if (!isRulerActive()) return;

    if (!tab.rulerMarkers) {
        tab.rulerMarkers = [];
    }

    const charWidth = getCharWidth();
    if (charWidth <= 0) return;

    // マーカー自体のクリック/ドラッグは setupMarkerDrag で個別に処理されるため除外
    if (e.target.classList.contains('ruler-marker')) {
        return;
    }

    // トラック内でのX座標から桁を計算
    const trackRect = elements.rulerTrackWrapper.getBoundingClientRect();
    const xInTrack = e.clientX - trackRect.left + currentScrollLeft;
    const col = Math.round(xInTrack / charWidth);

    if (col < 1) return;

    // すでに存在していれば削除、なければ追加
    const existingIndex = tab.rulerMarkers.indexOf(col);
    if (existingIndex !== -1) {
        tab.rulerMarkers.splice(existingIndex, 1);
    } else {
        if (tab.rulerMarkers.length >= MAX_MARKERS) {
            console.warn(`[Ruler] ${t('ruler.marker.maxReached', { max: MAX_MARKERS })}`);
            return;
        }
        tab.rulerMarkers.push(col);
        tab.rulerMarkers.sort((a, b) => a - b);
    }

    renderMarkersAndGuides();
}

/**
 * ルーラーの目盛り（短・中・長）を描画
 * - 0桁目: 1文字目の左端
 * - 1〜9桁目: 各文字と文字の境界
 * - 10桁目: 10文字目の右端境界（長目盛り＋数字「10」）
 */
export function renderRulerTicks() {
    if (!elements.rulerTrack) return;

    const charWidth = getCharWidth();
    if (charWidth <= 0) return;

    const fragment = document.createDocumentFragment();
    const totalCols = DEFAULT_RULER_COLS;

    // ルーラートラック幅を全目盛り＋余白分に動的設定（極大フォントでも途切れないようにする）
    elements.rulerTrack.style.width = `${Math.ceil(totalCols * charWidth) + 10}px`;

    elements.rulerTrack.innerHTML = '';

    // 0桁目の境界線（1文字目の左端）
    const startTick = document.createElement('div');
    startTick.className = 'ruler-tick long';
    startTick.style.left = '0px';
    fragment.appendChild(startTick);

    for (let i = 1; i <= totalCols; i++) {
        // 各文字の右境界位置（文字と文字の間）
        const left = Math.round(i * charWidth);

        const tick = document.createElement('div');
        tick.className = 'ruler-tick';
        tick.style.left = `${left}px`;

        if (i % 10 === 0) {
            tick.classList.add('long');
            const num = document.createElement('div');
            num.className = 'ruler-number';
            num.style.left = `${left}px`;
            num.textContent = String(i);
            fragment.appendChild(num);
        } else if (i % 5 === 0) {
            tick.classList.add('medium');
        } else {
            tick.classList.add('short');
        }

        fragment.appendChild(tick);
    }

    elements.rulerTrack.appendChild(fragment);
    renderMarkersAndGuides();
}

/**
 * マーカー（▼）と縦ガイド線を描画
 * 文字と文字の間の目盛り線位置にピタリと配置
 */
export function renderMarkersAndGuides() {
    if (!elements.rulerTrack || !elements.rulerGuidesOverlay || !elements.rulerTrackWrapper) return;

    elements.rulerTrack.querySelectorAll('.ruler-marker').forEach(el => el.remove());
    elements.rulerGuidesOverlay.innerHTML = '';

    const tab = getCurrentTab();
    if (!tab || !tab.rulerMarkers || tab.rulerMarkers.length === 0) {
        return;
    }

    const charWidth = getCharWidth();
    if (charWidth <= 0) return;

    const container = elements.editor?.closest('.editor-container') || elements.editor;
    if (!container) return;
    const containerRect = container.getBoundingClientRect();
    const trackRect = elements.rulerTrackWrapper.getBoundingClientRect();
    const baseLeft = trackRect.left - containerRect.left;

    const guideFragment = document.createDocumentFragment();

    tab.rulerMarkers.forEach(col => {
        const xInTrack = Math.round(col * charWidth);

        // ルーラー上のマーカー（▼）: 文字と文字の間の目盛り線の真上
        const marker = document.createElement('div');
        marker.className = 'ruler-marker';
        marker.dataset.col = String(col);
        marker.style.left = `${xInTrack}px`;
        marker.textContent = '▼';
        marker.title = t('ruler.marker.tooltip', { col });
        elements.rulerTrack.appendChild(marker);

        // エディタ本文上の縦破線ガイド（マーカー先端のX座標と完全一致、文字と文字の間に垂直に伸びる）
        const guide = document.createElement('div');
        guide.className = 'ruler-guide-line';
        guide.dataset.col = String(col);
        guide.style.left = `${Math.round(baseLeft + xInTrack - currentScrollLeft)}px`;
        guideFragment.appendChild(guide);

        // ドラッグ移動＆クリック削除のハンドラを設定
        setupMarkerDrag(marker, col, baseLeft, guide);
    });

    elements.rulerGuidesOverlay.appendChild(guideFragment);
}

/**
 * マーカーのドラッグ移動およびクリック削除を設定
 * @param {HTMLElement} marker
 * @param {number} initialCol
 * @param {number} baseLeft
 * @param {HTMLElement} guide
 */
function setupMarkerDrag(marker, initialCol, baseLeft, guide) {
    marker.addEventListener('mousedown', (e) => {
        if (e.button !== 0) return; // 左ボタンのみ
        e.stopPropagation();
        e.preventDefault();

        const charWidth = getCharWidth();
        if (charWidth <= 0) return;

        const startX = e.clientX;
        let isDragging = false;
        let currentCol = initialCol;

        const onMouseMove = (moveEvent) => {
            const dx = Math.abs(moveEvent.clientX - startX);
            if (!isDragging && dx >= 3) {
                isDragging = true;
                marker.classList.add('is-dragging');
                document.body.classList.add('ruler-marker-dragging');
            }

            if (isDragging && elements.rulerTrackWrapper) {
                const trackRect = elements.rulerTrackWrapper.getBoundingClientRect();
                const xInTrack = moveEvent.clientX - trackRect.left + currentScrollLeft;
                const col = Math.max(1, Math.min(DEFAULT_RULER_COLS, Math.round(xInTrack / charWidth)));
                currentCol = col;

                const newMarkerLeft = Math.round(col * charWidth);
                marker.style.left = `${newMarkerLeft}px`;
                marker.title = t('ruler.marker.tooltip', { col });

                if (guide) {
                    guide.style.left = `${Math.round(baseLeft + newMarkerLeft - currentScrollLeft)}px`;
                }
            }
        };

        const onMouseUp = () => {
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('mouseup', onMouseUp);

            marker.classList.remove('is-dragging');
            document.body.classList.remove('ruler-marker-dragging');

            const tab = getCurrentTab();
            if (!tab || !tab.rulerMarkers) return;

            if (isDragging) {
                if (currentCol !== initialCol) {
                    tab.rulerMarkers = tab.rulerMarkers.filter(c => c !== initialCol);
                    if (!tab.rulerMarkers.includes(currentCol)) {
                        tab.rulerMarkers.push(currentCol);
                        tab.rulerMarkers.sort((a, b) => a - b);
                    }
                }
                renderMarkersAndGuides();
            } else {
                // クリック判定: マーカーを削除
                tab.rulerMarkers = tab.rulerMarkers.filter(c => c !== initialCol);
                renderMarkersAndGuides();
            }
        };

        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mouseup', onMouseUp);
    });
}

/**
 * カーソル追従インジケーターの位置を更新（全角・半角・タブ混在でも画面上のキャレット真上に完全一致）
 */
export function updateRulerCursor() {
    if (!elements.rulerCursor) return;
    if (!isRulerActive()) {
        elements.rulerCursor.classList.add('hidden');
        return;
    }

    const view = getEditorView();
    if (!view || !elements.rulerTrackWrapper) {
        elements.rulerCursor.classList.add('hidden');
        return;
    }

    const head = view.state.selection.main.head;
    const coords = view.coordsAtPos(head);

    if (coords && elements.rulerTrackWrapper) {
        const trackRect = elements.rulerTrackWrapper.getBoundingClientRect();
        const cursorX = coords.left - trackRect.left;
        elements.rulerCursor.style.left = `${Math.round(cursorX)}px`;
        elements.rulerCursor.classList.remove('hidden');
    } else {
        elements.rulerCursor.classList.add('hidden');
    }
}

/**
 * エディタの横スクロールとルーラーおよびガイド線の位置を同期
 * @param {number} scrollLeft
 */
export function syncRulerScroll(scrollLeft) {
    currentScrollLeft = scrollLeft;

    if (elements.rulerTrack) {
        elements.rulerTrack.style.transform = `translateX(-${scrollLeft}px)`;
    }

    if (elements.rulerGuidesOverlay && elements.rulerTrackWrapper) {
        const container = elements.editor?.closest('.editor-container') || elements.editor;
        if (!container) return;
        const containerRect = container.getBoundingClientRect();
        const trackRect = elements.rulerTrackWrapper.getBoundingClientRect();
        const baseLeft = trackRect.left - containerRect.left;
        const charWidth = getCharWidth();

        const guides = elements.rulerGuidesOverlay.querySelectorAll('.ruler-guide-line');
        guides.forEach(guide => {
            const col = parseInt(guide.dataset.col, 10);
            if (!isNaN(col)) {
                const xInTrack = Math.round(col * charWidth);
                guide.style.left = `${Math.round(baseLeft + xInTrack - scrollLeft)}px`;
            }
        });
    }

    updateRulerCursor();
}

/**
 * フォント変更、ズーム、行番号ON/OFF等に伴うメトリクスの再同期
 */
export function syncRulerMetrics() {
    cachedCharWidth = 0; // キャッシュクリアして正確に再実測
    const gutterOffset = getGutterOffset();

    if (elements.rulerGutterSpacer) {
        elements.rulerGutterSpacer.style.width = `${Math.max(0, Math.round(gutterOffset))}px`;
    }

    renderRulerTicks();
    syncRulerScroll(currentScrollLeft);
    updateRulerCursor();
}

/**
 * ルーラーの表示・非表示を適用（DOMの表示切替）
 * @param {boolean} enable
 */
export function setRulerVisibility(enable) {
    if (!elements.rulerContainer || !elements.rulerGuidesOverlay) {
        initRuler();
    }

    if (enable) {
        elements.rulerContainer.classList.remove('hidden');
        elements.rulerGuidesOverlay.classList.remove('hidden');
        syncRulerMetrics();
    } else {
        elements.rulerContainer.classList.add('hidden');
        elements.rulerGuidesOverlay.classList.add('hidden');
        if (elements.rulerCursor) {
            elements.rulerCursor.classList.add('hidden');
        }
    }
}
