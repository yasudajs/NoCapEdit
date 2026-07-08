# NoCapEdit 仕様書整理および改定履歴の独立化計画

本計画は、肥大化した `docs/mvp-spec.md` をスリム化しつつ、すでに初期MVPの枠組みを超えた機能群も含まれているため、ファイル名を `docs/spec.md` に改名します。また、改定履歴を `docs/history.md` に独立させることで、ドキュメントの可読性とメンテナンス性を向上させることを目的とします。

ユーザーからの指示に基づき、作業用ブランチは作成せず、`master` ブランチ上で直接作業を行います。

## Proposed Changes

### ドキュメント

#### [DELETE] [mvp-spec.md](file:///c:/work/NoCapEdit/docs/mvp-spec.md)
- 古い仕様書ファイルを削除します。

#### [NEW] [spec.md](file:///c:/work/NoCapEdit/docs/spec.md)
- `mvp-spec.md` から履歴や重複した記述を削除・統合した、最新の仕様書ファイルを新規作成します。
- 改定履歴については `history.md` への参照リンクを追加します。
- 「8. 機能要件」と「13. 受け入れ基準」を統合し、「4. 機能仕様」として各機能ごとに要件と受け入れ基準を並べて再構成します。これにより重複を完全に排除します。
- 「14. 実装履歴および達成状況」のフェーズ履歴を削除します（すでに実装が完了しているため）。

#### [NEW] [history.md](file:///c:/work/NoCapEdit/docs/history.md)
- 旧 `mvp-spec.md` に記載されていたバージョン `0.1.0` から `0.1.14` までの改定履歴テーブルを移動します。
- 旧 `mvp-spec.md` の「14. 実装履歴および達成状況」にあった古いフェーズごとの実装完了履歴を整理して記録します。

## Verification Plan

### Manual Verification
- `docs/spec.md` および `docs/history.md` の記述が正確であり、重複が排除されていることを目視で確認します。
- マークダウンのリンクが正しく機能しているか確認します。
