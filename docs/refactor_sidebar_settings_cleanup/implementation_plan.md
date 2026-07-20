# サイドバーの依存関係解消 実装計画

## 目標
`sidebar.js`（UIコンポーネント）から `settings.js`（設定管理）への直接の依存（`import` および `saveSettingsDelay()` の呼び出し）を排除し、`sidebar-integration.js` を経由する正しいブリッジモジュールの形に修正する。（Phase 6のクリーンアップ残件）

## Proposed Changes

---

### UI Component (Sidebar)

#### [MODIFY] [sidebar.js](file:///c:/work/NoCapEdit/src/dist/js/ui/sidebar.js)
- `import { saveSettingsDelay } from './settings.js';` の削除。
- `saveSettingsDelay()` の呼び出しを、カスタムイベントの発火 `window.dispatchEvent(new CustomEvent('sidebar-settings-changed'))` に置き換える。

---

### Bridge Component (Sidebar Integration)

#### [MODIFY] [sidebar-integration.js](file:///c:/work/NoCapEdit/src/dist/js/ui/sidebar-integration.js)
- `import { saveSettingsDelay } from './settings.js';` を追加。
- `initSidebarIntegration` などの初期化処理内で、`window.addEventListener('sidebar-settings-changed', () => saveSettingsDelay())` を登録し、イベントを受け取って設定保存を代行するようにする。

## Verification Plan
### Automated Tests
- 今回の修正に対する自動テストはなし

### Manual Verification
手動でのUI動作確認を実施する。（詳細は `task.md` 参照）
