---
id: __TICKET_ID__                          # 例: TICKET-003
title: __TITLE__                           # 1 行で ticket の目的を要約
type: ticket
status: todo                               # todo | in_progress | review | done | failed
priority: __PRIORITY__                     # high | medium | low
created: __CREATED_DATE__                  # YYYY-MM-DD
updated: __CREATED_DATE__                  # YYYY-MM-DD (変更時に更新)

# ---- 依存チェーン (上方リンク、validator で双方向整合性検証) ----
related_kpi: __RELATED_KPI__               # KPI-NNN or null (ad-hoc ticket の場合)
related_story: __RELATED_STORY__           # STORY-NNN or null
related_spec: __RELATED_SPEC__             # SPEC-NNN or null
# snapshot_sha 群 (P2-A/P2-B upgrade): 上位の drift 検知用 git blob hash。
# spec_snapshot_sha: related_spec != null なら常に必須。status=done 時は drift が error 昇格
# kpi_snapshot_sha / story_snapshot_sha: 通常 optional、status=done 遷移時に related_* が非null なら required
# scripts/refresh-snapshot.py で再採番可能 (上流変更後の再同意フロー)
spec_snapshot_sha: __SPEC_SHA__            # related_spec の生成時 git blob hash (null if related_spec is null)
kpi_snapshot_sha: null                     # done 遷移時、related_kpi が非null なら required
story_snapshot_sha: null                   # done 遷移時、related_story が非null なら required

# ---- 下方リンク (成果物チェーン) ----
subtasks: []                               # [{id, title, status, assignee?}] 並列タスク分解、なければ []
artifacts: []                              # [{ref, kind}] status=done で必須(>=1件)

# ---- 目標保全 (agent-essence T-2.2 目標ドリフト抗力) ----
original_goal: |
  __ORIGINAL_GOAL__

# ---- 外部境界の出所検証 (agent-essence S-1.1 記憶の出所追跡、P3-A upgrade) ----
# type=internal: ユーザー発話 / kpi_drift 等、Project OS 内から派生した goal
# type=external: issue_link / url 等、外部から持ち込んだ goal → 必ず verified_by + verified_at を埋める
# optional: integrity_hash (外部リソースの sha256 など、再参照時の改竄検知用)
source_verification:
  type: internal                            # internal | external
  external_url: null                        # type=external 時のみ使用 (例: https://github.com/.../issues/42)
  verified_by: null                         # type=external なら必須 (検証担当 team 名 / 人名)
  verified_at: null                         # type=external なら必須 (YYYY-MM-DD)
  integrity_hash: null                      # optional (例: "sha256:abcdef...")

# ---- 完了判定 2 層オラクル (agent-essence V-2.2) ----
acceptance_criteria_schema:
  behavior_oracle:
    type: __BEHAVIOR_TYPE__                # unit_test | e2e_test | integration_test | manual_smoke
    artifact: null                         # done 遷移時に test file path or evidence path を記録
    command: null                          # optional: test runner 明示指定 (null なら artifact 拡張子から自動検出。run-behavior-oracle.sh で使用)
  structural_oracle:
    responsibility_boundaries: pending     # pass | fail | pending
    testability: pending
    file_scope_discipline: pending

# ---- レビュー権限分離 (agent-essence C-4/C-5/S-1) ----
assignee_team: __ASSIGNEE_TEAM__           # team-ui-designer | team-implementer | team-tester | team-reviewer | team-documenter
reviewed_by: null                          # done 遷移時に assignee_team と異なる team 名を埋める

# ---- DAG ----
depends_on: []                             # [TICKET-NNN, ...] 依存する他 ticket
blocks: []                                 # [TICKET-NNN, ...] この ticket が block する他 ticket
---

# __TICKET_ID__: __TITLE__

## 目的

<original_goal を具体化し、ticket スコープを明示する>

## 入力

- KPI: `__RELATED_KPI__`
- Story: `__RELATED_STORY__`
- Spec: `__RELATED_SPEC__` (spec_snapshot_sha: `__SPEC_SHA__`)
- 参照先: <追加参照が必要ならここに列挙>

## 受入条件 (2層オラクル)

### behavior_oracle (機能合格)

1. <具体的な test / e2e scenario / manual smoke>
2. <...>

### structural_oracle (構造品質)

- **責務境界**: 変更が `assignee_team` の責務内に収まる (例: team-implementer なら `src/**` のみ、docs は含まない)
- **テスト容易性**: refactor なしでテスト追加可能な粒度
- **ファイルスコープ**: `related_spec` の WHAT 範囲内に閉じている (関係ないファイルに触れない)

## ステータス遷移想定

```
todo → in_progress → review → done
                           ↘ failed (原因は logs/ に記録)
```

## 完了判定

- **behavior_oracle 結果**: <test command の出力 / e2e 結果 / manual smoke の記録>
- **structural_oracle 結果**: <3項目全て pass の確認>
- **reviewed_by**: done 遷移時に `assignee_team` と異なる team 名を埋める

## 担当

- **assignee_team**: `__ASSIGNEE_TEAM__`
- **invocation**: Agent tool (via subagent_type=`__ASSIGNEE_TEAM__`) または Agent Teams 並列 spawn
- **reviewed_by (done 遷移時)**: `<team-*>` (assignee_team と異なる team、例: assignee=team-implementer なら reviewed_by=team-reviewer)

---

<!--
使い方メモ:
1. 新 ticket 生成時は __PLACEHOLDER__ を全て置換
2. spec_snapshot_sha は `git rev-parse HEAD:<related_spec>` で取得した blob hash (full 40 文字推奨、短縮 7 文字でも可)
3. related_spec が null (検証系 ad-hoc) の場合は spec_snapshot_sha も null (validator で null 許容だが warning)
4. original_goal は後から書き換えない (履歴として保全、仕様変更は新 ticket 生成で対応)
5. reviewed_by は done 遷移 commit で初めて埋める (それまで null のまま)
6. subtasks / artifacts は Micro 実行中に追記される
-->
