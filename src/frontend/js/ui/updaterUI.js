import { elements } from '../state.js';
import { appWindow } from '../core/tauri.js';

export function showUpdateNotice(currentVersion, latestTag, latestVersion) {
    const newTitle = `NoCapEdit [ Ver ${currentVersion} ] (Update: ${latestTag})`;
    document.title = newTitle;
    if (appWindow && typeof appWindow.setTitle === 'function') {
        appWindow.setTitle(newTitle);
    }

    if (elements.updateNoticeContainer && elements.currentVerSpan && elements.latestVerSpan && elements.releaseLink) {
        elements.currentVerSpan.textContent = currentVersion;
        elements.latestVerSpan.textContent = latestVersion;

        const releaseUrl = `https://github.com/yasudajs/NoCapEdit/releases/tag/${latestTag}`;
        elements.releaseLink.href = releaseUrl;

        elements.releaseLink.onclick = (e) => {
            e.preventDefault();
            if (window.__TAURI__ && window.__TAURI__.shell && window.__TAURI__.shell.open) {
                window.__TAURI__.shell.open(releaseUrl);
            } else {
                window.open(releaseUrl, '_blank');
            }
        };

        elements.updateNoticeContainer.classList.remove('hidden');
    }
}
