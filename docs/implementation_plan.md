# タブ追加ボタンの配置変更実装計画

## 概要

タブバーにある新規タブ作成の「＋」ボタンを、設定ボタン（歯車アイコン）の隣から、タブリストのすぐ右側に配置するようにレイアウトを変更します。
これにより、タブが増えるごとに「＋」ボタンが右へ押し出され、画面幅いっぱいに達した場合は右端で固定され、タブリストのみがスクロール可能となる直感的なUI（VSCode等のエディタに近い挙動）を実現します。

## 提案された変更 (推奨案: ラッパー要素でのグループ化)

HTML構造にグループ化のためのラッパー要素（`.tabs-group`）を導入し、CSSのFlexbox設定を調整することで安全にレイアウトを変更します。JavaScript側へのロジック変更は不要です。

### 1. `src/dist/index.html` の変更

`tabs-container` と `addTabBtn` を `<div class="tabs-group">` で囲みます。

#### [MODIFY] [index.html](file:///c:/work/NoCapEdit/src/dist/index.html)
```html
<div class="tab-bar">
    <div class="tabs-group">
        <div class="tabs-container" id="tabsContainer"></div>
        <button class="add-tab-btn" id="addTabBtn" title="新規タブを作成">
            <span class="plus-icon">+</span>
        </button>
    </div>
    <button class="settings-btn" id="settingsBtn" title="設定">
    ...
```

### 2. `src/dist/style.css` の変更

- 新設する `.tabs-group` に `flex: 1` と `overflow: hidden` などを設定し、全体の幅を確保します。
- 既存の `.tabs-container` から `flex: 1` を外し、タブの内容に合わせて伸びるようにします。また `overflow-x: auto` を維持し、溢れた際にスクロールできるようにします。
- `add-tab-btn` に `flex-shrink: 0` を付与し、ボタンが潰れたり隠れたりしないようにします。
- **[追加修正]** `add-tab-btn` の枠線を透明（`border-color: transparent`）に設定し、通常時およびホバー時ともに枠線が見えないすっきりとしたデザインにします。

#### [MODIFY] [style.css](file:///c:/work/NoCapEdit/src/dist/style.css)
```css
/* 新規追加 */
.tabs-group {
    display: flex;
    flex: 1;
    align-items: center;
    overflow: hidden;
}

/* 修正 */
.tabs-container {
    display: flex;
    /* flex: 1; を削除 */
    gap: 2px;
    padding: 0 8px;
    overflow-x: auto;
    overflow-y: hidden;
}

.add-tab-btn {
    /* 既存設定に加えて以下を追加・変更 */
    flex-shrink: 0;
    border-color: transparent;
}

.add-tab-btn:hover {
    /* 既存設定に加えて以下を変更 */
    border-color: transparent;
}
```

## 検証計画

### 手動検証
1. アプリを起動し、初期状態で「＋」ボタンが最初のタブのすぐ右側に配置されていることを確認する。
2. 「＋」ボタンを何度かクリックし、タブが増えるごとにボタンが右へ移動することを確認する。
3. タブを画面幅以上に増やし、「＋」ボタンが設定ボタンの左側で固定され隠れないことを確認する。
4. その状態で、タブリストのみが横スクロールできることを確認する。
