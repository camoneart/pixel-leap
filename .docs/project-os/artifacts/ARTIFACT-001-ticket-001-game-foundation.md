---
id: ARTIFACT-001
ticket: TICKET-001
kind: code
created: 2026-05-27
---

# ARTIFACT-001: TICKET-001 ゲーム基盤 (code pointer)

TICKET-001 の成果物。実コードは codebase (`src/` + 設定) に存在し、project-os は pointer のみ保持する
(designs/tests 置き先の方針: codebase に置き artifacts/ で参照。観測ログ「残タスクB」参照)。

## 成果物 (codebase)

- `src/types.ts` — 共有ドメイン型 (Vec2/Rect/Player/Platform/InputState、Canvas/DOM 非依存)
- `src/physics.ts` — 純粋関数 (applyGravity / horizontalVelocity / jump / integrate / stepPhysics)
- `src/collision.ts` — 純粋関数 (aabbIntersects / resolveCollisions、スイープで tunneling 防止)
- `src/loop.ts` `src/input.ts` `src/terrain.ts` `src/render.ts` `src/game.ts` `src/main.ts` — ループ/入力/地形/描画/起動 (DOM 層)
- `src/physics.test.ts` `src/collision.test.ts` — 42 単体テスト
- 設定: `package.json` `vite.config.ts` `tsconfig.json` `vitest.config.ts` `index.html`

## 検証

- **behavior_oracle**: `pnpm vitest run` → 42/42 PASS
- **build**: `pnpm build` (tsc && vite build) 成功、dist/ 生成、型エラーゼロ
- **E2E**: `pnpm dev` でブラウザ起動、プレイヤー移動/ジャンプ/床着地を実機確認
- **既知の gap (別 ticket 候補)**: 横方向のワールド境界 clamp が無く、プレイヤーが画面端を越えて場外に出られる (finding #7、SPEC-001 の範囲外)
