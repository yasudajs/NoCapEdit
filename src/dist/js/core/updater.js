import { compareVersions } from '../utils/helpers.js';
import { appWindow } from './tauri.js';

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
