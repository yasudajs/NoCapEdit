# アップデート系統の分離 (v0.1系・v0.2系の並存)

v0.1系とv0.2系が並存する運用において、それぞれのアプリが自身のバージョン系統（`0.1.x` または `0.2.x`）の最新アップデートのみを受け取り、他系統のアップデート通知を受け取らないようにします。

## 課題と背景
現在のアップデートチェック処理は、GitHub API の `releases/latest` エンドポイントを呼び出しています。このエンドポイントはリポジトリ全体の最新の公開リリース（通常は最も新しいv0.2系の最新版）を1件だけ返します。そのため、v0.1系を起動しているユーザーに対してもv0.2系のアップデートが通知されてしまう問題があります。

本計画では、起動中のアプリのバージョン系統に基づいて適切な最新バージョンを検知する仕組みを導入します。

## ユーザーレビューが必要な事項
特になし（既存のユーザー体験を壊さず、正しいアップデート通知のみを行うようにします）。

## 提案する変更内容

### フロントエンド（JavaScript）

#### [MODIFY] [settings.js](file:///c:/work/NoCapEdit/src/dist/js/ui/settings.js)

`checkNewVersion` 関数のロジックを変更します。

- **GitHub API のエンドポイント変更**:
  `https://api.github.com/repos/yasudajs/NoCapEdit/releases/latest`
  から
  `https://api.github.com/repos/yasudajs/NoCapEdit/releases`
  （直近のリリースリスト）に変更します。
- **系列プレフィックスの抽出と判定**:
  引数 `currentVersion` (例: `"0.1.34"`) をドットで分割し、メジャー・マイナーのプレフィックス (例: `"0.1."`) を抽出します。
  取得したリリース一覧から、タグ名（`v` を除いたもの）がこのプレフィックスで始まる最初のリリース（＝その系列における最新リリース）を探索します。
- **バージョン比較と通知**:
  該当するリリースが見つかった場合、既存 of `compareVersions` 関数を用いて比較し、新しければ通知を表示します。

```javascript
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
```

## 検証計画

### 手動検証
1. **v0.1系での検証**:
   - アプリケーションのバージョンを一時的に古い `0.1.33` などに設定して起動し、v0.1系の最新リリース（例: `v0.1.34`）が正しく検知されることを確認する。
   - v0.2系のリリース（例: `v0.2.16`）は無視されることを確認する。
2. **v0.2系での検証**:
   - アプリケーションのバージョンを一時的に古い `0.2.15` などに設定して起動し、v0.2系の最新リリース（例: `v0.2.16`）が正しく検知されることを確認する。
   - v0.1系のリリースは無視されることを確認する。
3. **最新状態での検証**:
   - 各系統の最新バージョンで起動した際、アップデート通知が表示されないことを確認する。
