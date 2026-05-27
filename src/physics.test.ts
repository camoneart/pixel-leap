// RED unit tests — derived from SPEC-001 / TICKET-001 behavior_oracle.
// 対象: 描画から分離した純粋関数のみ (Canvas/DOM 非依存)。
// 出典: src/physics.ts の JSDoc 契約 (実装本体は未読 = 忖度バイアス回避)。
// 座標系: 左上原点、y は下向きが正、vy>0 は落下、vx>0 は右方向。

import { describe, it, expect } from 'vitest';
import type { InputState, PhysicsConfig, Player } from './types';
import {
  applyGravity,
  horizontalVelocity,
  integrate,
  jump,
  stepPhysics,
} from './physics';

function mkPlayer(overrides: Partial<Player> = {}): Player {
  return {
    x: 0,
    y: 0,
    width: 10,
    height: 10,
    vx: 0,
    vy: 0,
    onGround: false,
    ...overrides,
  };
}

function mkInput(overrides: Partial<InputState> = {}): InputState {
  return { left: false, right: false, jump: false, ...overrides };
}

// ----------------------------------------------------------------------------
// applyGravity(vy, gravity, dt): vy' = vy + gravity * dt
// ----------------------------------------------------------------------------
describe('applyGravity', () => {
  // [正常系] 重力で y速度が増加する (spec: 重力適用)
  it('adds gravity*dt to vy starting from rest', () => {
    expect(applyGravity(0, 1000, 0.016)).toBeCloseTo(16);
  });

  // [正常系] 既に落下中の vy にも累積する
  it('keeps accelerating an already-falling vy', () => {
    expect(applyGravity(50, 1000, 0.1)).toBeCloseTo(150);
  });

  // [エッジ] 上昇中 (vy<0) は重力で 0 方向へ戻る
  it('reduces the magnitude of an upward (negative) vy', () => {
    expect(applyGravity(-300, 1000, 0.1)).toBeCloseTo(-200);
  });

  // [境界値] dt = 0 なら vy は不変
  it('returns vy unchanged when dt is 0', () => {
    expect(applyGravity(42, 1000, 0)).toBe(42);
  });

  // [境界値] gravity = 0 なら vy は不変
  it('returns vy unchanged when gravity is 0', () => {
    expect(applyGravity(42, 0, 0.016)).toBe(42);
  });

  // [正常系/性質] gravity>0 かつ dt>0 のとき vy は厳密に増加する
  it('produces a strictly larger vy than the input under positive gravity', () => {
    const before = 12;
    expect(applyGravity(before, 980, 0.016)).toBeGreaterThan(before);
  });
});

// ----------------------------------------------------------------------------
// horizontalVelocity(input, moveSpeed):
//   左のみ -> -moveSpeed / 右のみ -> +moveSpeed / 両押し or 無入力 -> 0
// ----------------------------------------------------------------------------
describe('horizontalVelocity', () => {
  // [正常系] 右入力で +moveSpeed
  it('returns +moveSpeed when only right is pressed', () => {
    expect(horizontalVelocity(mkInput({ right: true }), 200)).toBe(200);
  });

  // [正常系] 左入力で -moveSpeed
  it('returns -moveSpeed when only left is pressed', () => {
    expect(horizontalVelocity(mkInput({ left: true }), 200)).toBe(-200);
  });

  // [境界値/エッジ] 両押しは相殺して 0
  it('returns 0 when both left and right are pressed (cancel out)', () => {
    expect(horizontalVelocity(mkInput({ left: true, right: true }), 200)).toBe(0);
  });

  // [境界値] 無入力は 0
  it('returns 0 when neither left nor right is pressed', () => {
    expect(horizontalVelocity(mkInput(), 200)).toBe(0);
  });

  // [エッジ] jump フラグは横速度に影響しない
  it('ignores the jump flag when computing horizontal velocity', () => {
    expect(horizontalVelocity(mkInput({ right: true, jump: true }), 200)).toBe(200);
  });
});

// ----------------------------------------------------------------------------
// jump(player, jumpSpeed):
//   onGround=true -> vy=-jumpSpeed, onGround=false / 空中なら変化なし / 引数不変
// ----------------------------------------------------------------------------
describe('jump', () => {
  // [正常系] 接地時は vy = -jumpSpeed, onGround=false
  it('sets vy to -jumpSpeed and clears onGround when grounded', () => {
    const r = jump(mkPlayer({ vy: 0, onGround: true }), 400);
    expect(r.vy).toBe(-400);
    expect(r.onGround).toBe(false);
  });

  // [エッジ] 空中ではジャンプ不可 (変化なし)
  it('leaves an airborne player unchanged', () => {
    const r = jump(mkPlayer({ vy: 120, onGround: false }), 400);
    expect(r.vy).toBe(120);
    expect(r.onGround).toBe(false);
  });

  // [正常系] ジャンプは位置と横速度を保つ
  it('preserves position and horizontal velocity on a grounded jump', () => {
    const r = jump(mkPlayer({ x: 30, y: 40, vx: 150, vy: 0, onGround: true }), 400);
    expect(r.x).toBe(30);
    expect(r.y).toBe(40);
    expect(r.vx).toBe(150);
  });

  // [境界値] 引数 player を破壊的に変更しない (immutability 契約)
  it('does not mutate the input player', () => {
    const p = mkPlayer({ vy: 0, onGround: true });
    jump(p, 400);
    expect(p.vy).toBe(0);
    expect(p.onGround).toBe(true);
  });
});

// ----------------------------------------------------------------------------
// integrate(player, dt): x' = x + vx*dt, y' = y + vy*dt / 引数不変
// ----------------------------------------------------------------------------
describe('integrate', () => {
  // [正常系] 右かつ落下方向に積分される
  it('advances position by velocity*dt', () => {
    const r = integrate(mkPlayer({ x: 100, y: 50, vx: 200, vy: 100 }), 0.1);
    expect(r.x).toBeCloseTo(120);
    expect(r.y).toBeCloseTo(60);
  });

  // [正常系] 負の速度では左/上へ動く
  it('moves left/up for negative velocity components', () => {
    const r = integrate(mkPlayer({ x: 100, y: 50, vx: -200, vy: -300 }), 0.1);
    expect(r.x).toBeCloseTo(80);
    expect(r.y).toBeCloseTo(20);
  });

  // [境界値] dt=0 なら位置は不変
  it('leaves position unchanged when dt is 0', () => {
    const r = integrate(mkPlayer({ x: 100, y: 50, vx: 200, vy: 100 }), 0);
    expect(r.x).toBe(100);
    expect(r.y).toBe(50);
  });

  // [正常系] 速度成分は積分で変化しない
  it('does not change velocity components', () => {
    const r = integrate(mkPlayer({ vx: 200, vy: 100 }), 0.1);
    expect(r.vx).toBe(200);
    expect(r.vy).toBe(100);
  });

  // [境界値] 引数 player を破壊的に変更しない (immutability 契約)
  it('does not mutate the input player', () => {
    const p = mkPlayer({ x: 100, y: 50, vx: 200, vy: 100 });
    integrate(p, 0.1);
    expect(p.x).toBe(100);
    expect(p.y).toBe(50);
  });
});

// ----------------------------------------------------------------------------
// stepPhysics(player, input, config, dt):
//   横速度反映 -> ジャンプ反映 -> 重力 -> 位置積分 (衝突解決は含まない) / 引数不変
// ----------------------------------------------------------------------------
describe('stepPhysics', () => {
  const config: PhysicsConfig = { gravity: 1000, moveSpeed: 200, jumpSpeed: 400 };

  // [正常系] 接地 + 右 + ジャンプ: 4 ステップ合成の最終状態
  //   vx=+200 / jump: vy=-400, onGround=false / gravity: vy=-400+1000*0.1=-300
  //   integrate: x=0+200*0.1=20, y=0+(-300)*0.1=-30
  it('composes horizontal -> jump -> gravity -> integrate for a grounded jump+right', () => {
    const r = stepPhysics(
      mkPlayer({ x: 0, y: 0, vx: 0, vy: 0, onGround: true }),
      mkInput({ right: true, jump: true }),
      config,
      0.1,
    );
    expect(r.vx).toBe(200);
    expect(r.vy).toBeCloseTo(-300);
    expect(r.onGround).toBe(false);
    expect(r.x).toBeCloseTo(20);
    expect(r.y).toBeCloseTo(-30);
  });

  // [正常系] 接地 + 無入力: 重力で落下 (vy=0+1000*0.1=100, y=0+100*0.1=10)
  it('applies gravity and starts falling when grounded with no input', () => {
    const r = stepPhysics(
      mkPlayer({ x: 0, y: 0, vx: 0, vy: 0, onGround: true }),
      mkInput(),
      config,
      0.1,
    );
    expect(r.vx).toBe(0);
    expect(r.vy).toBeCloseTo(100);
    expect(r.y).toBeCloseTo(10);
  });

  // [エッジ] 空中でジャンプ入力があってもジャンプしない (重力のみ反映)
  it('does not jump while airborne even if jump is pressed', () => {
    const r = stepPhysics(
      mkPlayer({ x: 0, y: 0, vx: 0, vy: 0, onGround: false }),
      mkInput({ jump: true }),
      config,
      0.1,
    );
    expect(r.vy).toBeCloseTo(100);
  });

  // [エッジ] 両押しで横移動は相殺 (vx=0, x 不変)
  it('cancels horizontal movement when both left and right are pressed', () => {
    const r = stepPhysics(
      mkPlayer({ x: 0, y: 0, vx: 0, vy: 0, onGround: true }),
      mkInput({ left: true, right: true }),
      config,
      0.1,
    );
    expect(r.vx).toBe(0);
    expect(r.x).toBe(0);
  });

  // [境界値] 引数 player を破壊的に変更しない (immutability 契約)
  it('does not mutate the input player', () => {
    const p = mkPlayer({ x: 0, y: 0, vx: 0, vy: 0, onGround: true });
    stepPhysics(p, mkInput({ right: true, jump: true }), config, 0.1);
    expect(p.vx).toBe(0);
    expect(p.vy).toBe(0);
    expect(p.onGround).toBe(true);
    expect(p.x).toBe(0);
    expect(p.y).toBe(0);
  });
});
