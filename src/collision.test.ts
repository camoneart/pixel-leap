// RED unit tests — derived from SPEC-001 / TICKET-001 behavior_oracle.
// 対象: 描画から分離した純粋関数のみ (Canvas/DOM 非依存)。
// 出典: src/collision.ts の JSDoc 契約 (実装本体は未読 = 忖度バイアス回避)。
// 座標系: 左上原点、y は下向きが正。Rect の天面=y, 底面=y+height。

import { describe, it, expect } from 'vitest';
import type { Platform, Player, Rect } from './types';
import { aabbIntersects, resolveCollisions } from './collision';

function mkRect(x: number, y: number, width: number, height: number): Rect {
  return { x, y, width, height };
}

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

// ----------------------------------------------------------------------------
// aabbIntersects(a, b): 交差判定。隙間 0 でちょうど接するだけは「非交差」。
// 境界値の核心: 1px 離れ (n-1) / 接触 gap0 (n) / 1px 重なり (n+1)
// ----------------------------------------------------------------------------
describe('aabbIntersects', () => {
  // [正常系] 明確に重なる矩形 -> true
  it('returns true for clearly overlapping rects', () => {
    expect(aabbIntersects(mkRect(0, 0, 10, 10), mkRect(5, 5, 10, 10))).toBe(true);
  });

  // [正常系] 完全に離れた矩形 -> false
  it('returns false for fully separated rects', () => {
    expect(aabbIntersects(mkRect(0, 0, 10, 10), mkRect(100, 100, 10, 10))).toBe(false);
  });

  // [境界値 n-1] 1px の隙間で離れている -> false
  it('returns false when rects are separated by a 1px gap', () => {
    expect(aabbIntersects(mkRect(0, 0, 10, 10), mkRect(11, 0, 10, 10))).toBe(false);
  });

  // [境界値 n] 右辺がちょうど接する (gap 0) -> 非交差扱いで false
  it('returns false when rects exactly touch on an edge (gap 0)', () => {
    expect(aabbIntersects(mkRect(0, 0, 10, 10), mkRect(10, 0, 10, 10))).toBe(false);
  });

  // [境界値 n+1] 1px だけ重なる -> true
  it('returns true when rects overlap by 1px', () => {
    expect(aabbIntersects(mkRect(0, 0, 10, 10), mkRect(9, 0, 10, 10))).toBe(true);
  });

  // [エッジ] 角だけ接触 (gap 0) -> false
  it('returns false when rects only touch at a corner', () => {
    expect(aabbIntersects(mkRect(0, 0, 10, 10), mkRect(10, 10, 10, 10))).toBe(false);
  });

  // [エッジ] 一方が他方に完全内包 -> true
  it('returns true when one rect is fully contained in the other', () => {
    expect(aabbIntersects(mkRect(0, 0, 100, 100), mkRect(10, 10, 5, 5))).toBe(true);
  });

  // [エッジ] 同一矩形 -> true
  it('returns true for identical rects', () => {
    expect(aabbIntersects(mkRect(0, 0, 10, 10), mkRect(0, 0, 10, 10))).toBe(true);
  });
});

// ----------------------------------------------------------------------------
// resolveCollisions(player, platforms, prevPlayer):
//   落下中(vy>0) 天面着地 -> y=天面に合わせ vy=0, onGround=true
//   上昇中(vy<0) 底面衝突 -> y を底面の下へ戻し vy=0
//   prevPlayer (移動前) でスイープ判定し高速移動の貫通を防ぐ / 引数不変
// ----------------------------------------------------------------------------
describe('resolveCollisions', () => {
  // [正常系: 床着地] 落下中のプレイヤーが床天面に着地する
  it('lands a falling player on the floor: bottom rests on top, vy=0, onGround=true', () => {
    const floor = mkRect(0, 100, 1000, 20); // top=100
    const prev = mkPlayer({ x: 50, y: 85, vy: 100 }); // bottom=95 (上方)
    const moved = mkPlayer({ x: 50, y: 95, vy: 100 }); // bottom=105 (貫通)
    const r = resolveCollisions(moved, [floor], prev);
    expect(r.y).toBe(90); // 100 - height(10)
    expect(r.vy).toBe(0);
    expect(r.onGround).toBe(true);
    expect(r.x).toBe(50); // x は保持
  });

  // [正常系: 段差プラットフォーム] 実際に重なる段差に着地し、下の床には落ちない
  it('lands on the step platform it overlaps, not the floor below it', () => {
    const floor = mkRect(0, 200, 1000, 20);
    const step1 = mkRect(100, 150, 80, 20); // top=150
    const step2 = mkRect(250, 100, 80, 20);
    const prev = mkPlayer({ x: 110, y: 135, vy: 200 }); // bottom=145
    const moved = mkPlayer({ x: 110, y: 145, vy: 200 }); // bottom=155 (step1 へ貫通)
    const r = resolveCollisions(moved, [floor, step1, step2], prev);
    expect(r.y).toBe(140); // 150 - 10
    expect(r.vy).toBe(0);
    expect(r.onGround).toBe(true);
  });

  // [境界値: 着地直前 n-1] 天面より厳密に上にいる間は解決しない
  it('does not resolve while the player is still strictly above the platform top', () => {
    const floor = mkRect(0, 100, 1000, 20);
    const prev = mkPlayer({ x: 50, y: 80, vy: 100 }); // bottom=90
    const moved = mkPlayer({ x: 50, y: 89, vy: 100 }); // bottom=99 < top=100
    const r = resolveCollisions(moved, [floor], prev);
    expect(r.y).toBe(89); // 不変
    expect(r.vy).toBe(100); // まだ落下中
    expect(r.onGround).toBe(false);
  });

  // [エッジ: トンネリング防止] 1 フレームで薄い床を飛び越える高速落下でも着地する
  it('prevents tunneling: a fast faller overshooting a thin platform still lands on it', () => {
    const plat = mkRect(0, 100, 1000, 10); // top=100, bottom=110 (薄い)
    const prev = mkPlayer({ x: 50, y: 80, vy: 1200 }); // bottom=90 (上方)
    const moved = mkPlayer({ x: 50, y: 200, vy: 1200 }); // bottom=210 (床の完全下方 = 貫通)
    const r = resolveCollisions(moved, [plat], prev);
    expect(r.y).toBe(90); // 100 - 10
    expect(r.vy).toBe(0);
    expect(r.onGround).toBe(true);
  });

  // [エッジ: 複数候補] 2 枚を跨ぐ高速落下では最初に当たる上側に着地する (配列順に依存しない)
  it('lands on the upper of two stacked platforms when overshooting both', () => {
    const upper = mkRect(0, 100, 1000, 10); // top=100
    const lower = mkRect(0, 200, 1000, 10); // top=200
    const prev = mkPlayer({ x: 50, y: 80, vy: 2000 }); // bottom=90 (upper の上)
    const moved = mkPlayer({ x: 50, y: 300, vy: 2000 }); // bottom=310 (両方の下)
    const r = resolveCollisions(moved, [lower, upper], prev); // 配列順を意図的に逆
    expect(r.y).toBe(90); // upper(100-10) に着地、lower ではない
    expect(r.vy).toBe(0);
    expect(r.onGround).toBe(true);
  });

  // [エッジ: 底面衝突] 上昇中にプラットフォーム底面へぶつかると止まり vy=0 (接地はしない)
  it('stops a rising player at the underside of a platform and zeroes vy', () => {
    const ceiling = mkRect(0, 50, 1000, 20); // bottom=70
    const prev = mkPlayer({ x: 50, y: 75, vy: -300 }); // top=75 (底面の下)
    const moved = mkPlayer({ x: 50, y: 65, vy: -300 }); // top=65 (底面へ貫通)
    const r = resolveCollisions(moved, [ceiling], prev);
    expect(r.y).toBe(70); // top が底面に揃う
    expect(r.vy).toBe(0);
    expect(r.onGround).toBe(false); // 頭ぶつけは接地しない
  });

  // [エッジ: 水平非重複] プラットフォームの真上にいなければ着地しない
  it('does not land when the player is not horizontally over any platform', () => {
    const plat = mkRect(500, 100, 80, 20);
    const prev = mkPlayer({ x: 0, y: 85, vy: 100 });
    const moved = mkPlayer({ x: 0, y: 95, vy: 100 });
    const r = resolveCollisions(moved, [plat], prev);
    expect(r.y).toBe(95); // 不変
    expect(r.vy).toBe(100);
    expect(r.onGround).toBe(false);
  });

  // [エラー系: 空配列] プラットフォームが無ければプレイヤーは不変 (クラッシュしない)
  it('returns the player unchanged when there are no platforms', () => {
    const platforms: Platform[] = [];
    const moved = mkPlayer({ x: 50, y: 95, vy: 100 });
    const prev = mkPlayer({ x: 50, y: 85, vy: 100 });
    const r = resolveCollisions(moved, platforms, prev);
    expect(r.y).toBe(95);
    expect(r.vy).toBe(100);
    expect(r.onGround).toBe(false);
  });

  // [境界値: immutability] moved / prevPlayer を破壊的に変更しない
  it('does not mutate the moved player nor prevPlayer', () => {
    const floor = mkRect(0, 100, 1000, 20);
    const prev = mkPlayer({ x: 50, y: 85, vy: 100 });
    const moved = mkPlayer({ x: 50, y: 95, vy: 100 });
    resolveCollisions(moved, [floor], prev);
    expect(moved.y).toBe(95);
    expect(moved.vy).toBe(100);
    expect(moved.onGround).toBe(false);
    expect(prev.y).toBe(85);
  });
});
