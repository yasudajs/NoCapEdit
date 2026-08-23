import { compareVersions } from '../utils/helpers.js';
import { showUpdateNotice } from '../ui/updaterUI.js';

export async function checkNewVersion(currentVersion) {
    if (!currentVersion) return;

    try {
        await new Promise(resolve => setTimeout(resolve, 3000));

        // 最新リリース一覧を取得 (ドラフト・プレリリースを除外した最新の正式リリースを特定)
        const response = await fetch('https://api.github.com/repos/yasudajs/NoCapEdit/releases');
        if (!response.ok) return;

        const data = await response.json();
        if (!Array.isArray(data)) return;

        let targetRelease = null;
        for (const release of data) {
            if (release.draft || release.prerelease) continue;
            if (release.tag_name) {
                targetRelease = release;
                break; // 先頭の正式リリースが最新
            }
        }

        if (!targetRelease) return;

        const latestTag = targetRelease.tag_name;
        const latestVersion = latestTag.replace(/^v/, '');

        if (compareVersions(latestVersion, currentVersion) > 0) {
            showUpdateNotice(currentVersion, latestTag, latestVersion);
        }
    } catch (error) {
        console.warn('Update check failed:', error);
    }
}
