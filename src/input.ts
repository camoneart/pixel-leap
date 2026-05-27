// キーボード入力 (DOM 依存)。純粋層 (physics/collision) からは分離する。
import type { InputState } from './types';

/** 全フラグ false の入力状態を生成する。 */
export function createInputState(): InputState {
  return { left: false, right: false, jump: false };
}

const PREVENT_DEFAULT = new Set([
  'Space',
  'ArrowUp',
  'ArrowDown',
  'ArrowLeft',
  'ArrowRight',
]);

/**
 * キーボードを購読し InputState を更新する (DOM 依存)。
 * 左右: ArrowLeft/ArrowRight, A/D。ジャンプ: Space, ArrowUp, W。
 * @param state 更新対象の入力状態 (in-place 更新)
 * @param target 購読対象 (既定 window)
 * @returns 購読解除関数
 */
export function attachKeyboard(state: InputState, target: Window = window): () => void {
  const setKey = (code: string, pressed: boolean): void => {
    switch (code) {
      case 'ArrowLeft':
      case 'KeyA':
        state.left = pressed;
        break;
      case 'ArrowRight':
      case 'KeyD':
        state.right = pressed;
        break;
      case 'Space':
      case 'ArrowUp':
      case 'KeyW':
        state.jump = pressed;
        break;
      default:
        break;
    }
  };

  const onKeyDown = (e: KeyboardEvent): void => {
    if (PREVENT_DEFAULT.has(e.code)) e.preventDefault();
    setKey(e.code, true);
  };
  const onKeyUp = (e: KeyboardEvent): void => {
    setKey(e.code, false);
  };

  target.addEventListener('keydown', onKeyDown);
  target.addEventListener('keyup', onKeyUp);

  return () => {
    target.removeEventListener('keydown', onKeyDown);
    target.removeEventListener('keyup', onKeyUp);
  };
}
