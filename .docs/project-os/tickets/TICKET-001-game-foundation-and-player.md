---
id: TICKET-001
title: ゲーム基盤・ゲームループ・プレイヤー操作・地形と衝突
type: ticket
status: in_progress
priority: high
created: 2026-05-26
updated: 2026-05-27

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
  pixel-leap (2D 横スクロールアクション最小縦スライス) を Canvas 2D + TypeScript + Vite で作る。
  本チケットはその土台: プロジェクト scaffold、ゲームループ (入力->更新->描画)、キーボード入力、
  プレイヤーの物理 (左右移動・ジャンプ・重力)、地形 (床 + 段差プラットフォーム 2-3 個) と
  着地/衝突判定までを実装し、「段差を移動・ジャンプして動き回れる」プレイ可能な土台を作る。

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
depends_on: []
blocks: [TICKET-002]
---

# TICKET-001: ゲーム基盤・ゲームループ・プレイヤー操作・地形と衝突

## 目的

pixel-leap の最小縦スライスの土台を作る。Canvas 2D + TypeScript + Vite のプロジェクトを
scaffold し、以下を実装する:

- ゲームループ (固定タイムステップ推奨: 入力 -> 更新 -> 描画)
- キーボード入力処理 (左右・ジャンプ)
- プレイヤーの物理: 左右移動・重力・ジャンプ・床/段差プラットフォーム (2-3 個) への着地と衝突解決
- 1 画面の描画土台 (背景・地形・プレイヤーの矩形描画でよい、見た目の作り込みは範囲外)

この時点では敵・ゴールは未実装でよい (TICKET-002 で追加)。

## 入力

- KPI: `KPI-001`
- Story: `STORY-001`
- Spec: `SPEC-001` (spec_snapshot_sha: `daa2d63dce7f207c90441d3842f3247fbb35ae99`)

## 受入条件 (2層オラクル)

### behavior_oracle (機能合格)

1. プレイヤーの物理ロジック (重力適用・ジャンプ初速・矩形 AABB 衝突解決) の unit test が通る (vitest 想定)
2. 床/段差への着地で y 速度が 0 になり地形を貫通しないことが test で確認できる
3. `pnpm dev` でローカル起動し、キー操作でプレイヤーが移動・ジャンプ・段差着地する (manual smoke 補助)

### structural_oracle (構造品質)

- **責務境界**: 変更は `src/**` と設定ファイル (package.json/vite/tsconfig) に収まる。敵/ゴールのゲーム的ロジックは含めない
- **テスト容易性**: 物理・衝突は描画から分離した純粋関数として unit test 可能な粒度
- **ファイルスコープ**: SPEC-001 の WHAT 範囲 (土台 + プレイヤー + 地形) に閉じる

## ステータス遷移想定

```
todo -> in_progress -> review -> done
                            -> failed (原因は logs/ に記録)
```

## 完了判定

- **behavior_oracle 結果**: vitest の実行出力 (artifact に test file path を記録)
- **structural_oracle 結果**: 3 項目全て pass の確認
- **reviewed_by**: done 遷移時に `assignee_team` と異なる team (例: team-reviewer or team-tester)

## 担当

- **assignee_team**: `team-implementer`
- **invocation**: Agent Teams 並列 spawn (orchestrating-team-development 経由)
- **reviewed_by (done 遷移時)**: `team-reviewer` 等 (assignee_team と異なる team)
