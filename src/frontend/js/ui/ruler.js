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
 * @returns {number}
 */
export function getCharWidth() {
    const view = getEditorView();
    if (view && view.defaultCharacterWidth > 0) {
        cachedCharWidth = view.defaultCharacterWidth;
        return cachedCharWidth;
    }

    if (cachedCharWidth > 0) {
        return cachedCharWidth;
    }

    // フォールバック計測
    const span = document.createElement('span');
    span.style.fontFamily = getComputedStyle(document.documentElement).getPropertyValue('--editor-font-family') || 'monospace';
    span.style.fontSize = getComputedStyle(document.documentElement).getPropertyValue('--editor-font-size') || '20px';
    span.style.visibility = 'hidden';
    span.style.position = 'absolute';
    span.textContent = '0';
    document.body.appendChild(span);
    const width = span.getBoundingClientRect().width || 12;
    document.body.removeChild(span);
    cachedCharWidth = width;
    return cachedCharWidth;
}

/**
 * 行番号ガターおよびエディタ本文パディングの左オフセット幅（px）を取得
 * @returns {number}
 */
export function getGutterOffset() {
    const view = getEditorView();
    if (view && view.dom && elements.editor) {
        const container = elements.editor.closest('.editor-container') || elements.editor;
        const containerRect = container.getBoundingClientRect();

        const content = view.dom.querySelector('.cm-content');
        if (content) {
            const contentRect = content.getBoundingClientRect();
            const offset = contentRect.left - containerRect.left;
            if (offset > 0) {
                cachedGutterOffset = offset;
                return cachedGutterOffset;
            }
        }
    }

    // フォールバック計算
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

    // クリックされた要素が既にマーカーなら削除
    if (e.target.classList.contains('ruler-marker')) {
        const colToRemove = parseInt(e.target.dataset.col, 10);
        if (!isNaN(colToRemove)) {
            tab.rulerMarkers = tab.rulerMarkers.filter(c => c !== colToRemove);
            renderMarkersAndGuides();
        }
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
            console.warn(`[Ruler] マーカーの上限（${MAX_MARKERS}個）に達しています`);
            return;
        }
        tab.rulerMarkers.push(col);
        tab.rulerMarkers.sort((a, b) => a - b);
    }

    renderMarkersAndGuides();
}

/**
 * ルーラーの目盛り（短・中・長）を描画
 */
export function renderRulerTicks() {
    if (!elements.rulerTrack) return;

    const charWidth = getCharWidth();
    if (charWidth <= 0) return;

    const fragment = document.createDocumentFragment();
    const totalCols = DEFAULT_RULER_COLS;

    // 既存の目盛り・数字・マーカーをクリア
    elements.rulerTrack.innerHTML = '';

    // 0桁目の境界線（先頭文字の左端）
    const startTick = document.createElement('div');
    startTick.className = 'ruler-tick long';
    startTick.style.left = '0px';
    fragment.appendChild(startTick);

    for (let i = 1; i <= totalCols; i++) {
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
 */
export function renderMarkersAndGuides() {
    if (!elements.rulerTrack || !elements.rulerGuidesOverlay || !elements.rulerTrackWrapper) return;

    // 既存のマーカー要素とガイド線要素をクリア
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

        // ルーラー上のマーカー（▼）
        const marker = document.createElement('div');
        marker.className = 'ruler-marker';
        marker.dataset.col = String(col);
        marker.style.left = `${xInTrack}px`;
        marker.textContent = '▼';
        marker.title = `${col}桁目マーカー (クリックで削除)`;
        elements.rulerTrack.appendChild(marker);

        // エディタ本文上の縦破線ガイド（マーカー先端のX座標と完全一致）
        const guide = document.createElement('div');
        guide.className = 'ruler-guide-line';
        guide.dataset.col = String(col);
        guide.style.left = `${Math.round(baseLeft + xInTrack - currentScrollLeft)}px`;
        guideFragment.appendChild(guide);
    });

    elements.rulerGuidesOverlay.appendChild(guideFragment);
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
        // coords.left（キャレットの画面X座標）から trackWrapper の左端を引いた位置
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

    // ガイド線の水平位置をスクロール量に合わせて更新
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

    // スクロール時もカーソルインジケーターを再同期
    updateRulerCursor();
}

/**
 * フォント変更、ズーム、行番号ON/OFF等に伴うメトリクスの再同期
 */
export function syncRulerMetrics() {
    cachedCharWidth = 0; // キャッシュクリア
    const gutterOffset = getGutterOffset();

    if (elements.rulerGutterSpacer) {
        elements.rulerGutterSpacer.style.width = `${Math.max(0, Math.round(gutterOffset))}px`;
    }

    renderRulerTicks();
    syncRulerScroll(currentScrollLeft);
    updateRulerCursor();
}

/**
 * ルーラーの表示・非表示を適用
 * @param {boolean} enable
 */
export function applyRuler(enable) {
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
