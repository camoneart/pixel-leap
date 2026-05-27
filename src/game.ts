// ゲーム状態の生成・更新。物理 (physics) と衝突 (collision) を合成する薄い純粋層。
import { resolveCollisions } from './collision';
import { stepPhysics } from './physics';
import { createTerrain } from './terrain';
import type { GameState, InputState, PhysicsConfig, Player } from './types';

/** デフォルト物理定数 (gravity から逆算したジャンプ到達高 ≈ 105px) */
export const DEFAULT_PHYSICS: PhysicsConfig = {
  gravity: 2000,
  moveSpeed: 220,
  jumpSpeed: 650,
};

const PLAYER_WIDTH = 28;
const PLAYER_HEIGHT = 36;

/**
 * 初期ゲーム状態を生成する (地形 + 床上に立つ初期プレイヤー)。
 * @param width 画面幅 (px)
 * @param height 画面高さ (px)
 */
export function createInitialState(width: number, height: number): GameState {
  const platforms = createTerrain(width, height);
  const floor = platforms[0];
  const player: Player = {
    x: 40,
    y: floor.y - PLAYER_HEIGHT,
    width: PLAYER_WIDTH,
    height: PLAYER_HEIGHT,
    vx: 0,
    vy: 0,
    onGround: true,
  };
  return { player, platforms, width, height };
}

/**
 * 1 ステップ分のゲーム更新 (純粋関数)。
 * stepPhysics -> (接地フラグを一旦 false) -> resolveCollisions -> 画面端クランプ を合成する。
 * @returns 新しい GameState (引数は不変)
 */
export function update(state: GameState, input: InputState, dt: number): GameState {
  const prev = state.player;

  // 物理積分。着地は衝突解決で再判定するため、一旦 onGround=false (空中と仮定)。
  const moved: Player = { ...stepPhysics(prev, input, DEFAULT_PHYSICS, dt), onGround: false };
  const resolved = resolveCollisions(moved, state.platforms, prev);

  // 画面端クランプ (横方向のみ)。
  const maxX = state.width - resolved.width;
  const clampedX = Math.max(0, Math.min(maxX, resolved.x));
  const player: Player =
    clampedX === resolved.x ? resolved : { ...resolved, x: clampedX, vx: 0 };

  return { ...state, player };
}
