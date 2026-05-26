---
id: TICKET-002
title: 敵 (往復AI)・接触判定・ゴール旗・勝敗表示
type: ticket
status: todo
priority: high
created: 2026-05-26
updated: 2026-05-26

# ---- 依存チェーン (上方リンク、validator で双方向整合性検証) ----
related_kpi: KPI-001
related_story: STORY-001
related_spec: SPEC-001
spec_snapshot_sha: daa2d63dce7f207c90441d3842f3247fbb35ae99
kpi_snapshot_sha: null
story_snapshot_sha: null

# ---- 下方リンク (成果物チェーン) ----
subtasks: []
artifacts: []

# ---- 目標保全 ----
original_goal: |
  TICKET-001 のプレイヤー + 地形の土台の上に、勝敗が成立する要素を追加して最小縦スライスを完成させる:
  左右に往復する敵 1 体、プレイヤーとの接触判定 (接触でゲームオーバー or リスポーン)、
  ゴール旗 1 個 (到達でクリア表示)、クリア / ゲームオーバーの状態表示。
  これにより「移動/ジャンプ・敵接触・ゴール到達・ゲームループ」のコア 4 要素が揃う。

# ---- 外部境界の出所検証 ----
source_verification:
  type: internal
  external_url: null
  verified_by: null
  verified_at: null
  integrity_hash: null

# ---- 完了判定 2 層オラクル ----
acceptance_criteria_schema:
  behavior_oracle:
    type: unit_test
    artifact: null
    command: null
  structural_oracle:
    responsibility_boundaries: pending
    testability: pending
    file_scope_discipline: pending

# ---- レビュー権限分離 ----
assignee_team: team-implementer
reviewed_by: null

# ---- DAG ----
depends_on: [TICKET-001]
blocks: []
---

# TICKET-002: 敵 (往復AI)・接触判定・ゴール旗・勝敗表示

## 目的

TICKET-001 の土台 (プレイヤー + 地形 + ゲームループ) の上に、勝敗の成立する要素を追加する:

- 敵 1 体: 一定範囲を左右に往復する単純 AI
- 接触判定: プレイヤーと敵の AABB 衝突でゲームオーバー (またはリスポーン)
- ゴール旗 1 個: プレイヤー到達でクリア状態に遷移
- 状態表示: プレイ中 / クリア / ゲームオーバー の表示と、リスタート手段

これで SPEC-001 の受入条件が全て満たされ、ブラウザで始めから終わりまで遊べる状態になる。

## 入力

- KPI: `KPI-001`
- Story: `STORY-001`
- Spec: `SPEC-001` (spec_snapshot_sha: `daa2d63dce7f207c90441d3842f3247fbb35ae99`)
- 依存: `TICKET-001` (プレイヤー + 地形 + ゲームループ) の完了が前提

## 受入条件 (2層オラクル)

### behavior_oracle (機能合格)

1. 敵の往復 AI (端で反転) の unit test が通る
2. プレイヤー-敵接触でゲームオーバー状態へ、ゴール到達でクリア状態へ遷移する状態機械の unit test が通る
3. `pnpm dev` でローカル起動し、敵を避けてゴール到達でクリア表示、接触でゲームオーバー表示になる (manual smoke 補助)

### structural_oracle (構造品質)

- **責務境界**: 変更は `src/**` に収まり、TICKET-001 のプレイヤー/地形ロジックを壊さず拡張する
- **テスト容易性**: 敵 AI・接触・勝敗状態機械は描画から分離した純粋関数として unit test 可能
- **ファイルスコープ**: SPEC-001 の WHAT 範囲 (敵 + ゴール + 勝敗) に閉じる

## ステータス遷移想定

```
todo -> in_progress -> review -> done
                            -> failed (原因は logs/ に記録)
```

## 完了判定

- **behavior_oracle 結果**: vitest の実行出力 (artifact に test file path を記録)
- **structural_oracle 結果**: 3 項目全て pass の確認
- **reviewed_by**: done 遷移時に `assignee_team` と異なる team

## 担当

- **assignee_team**: `team-implementer`
- **invocation**: Agent Teams 並列 spawn (orchestrating-team-development 経由)
- **reviewed_by (done 遷移時)**: `team-reviewer` 等 (assignee_team と異なる team)
