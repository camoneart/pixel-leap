// アプリのエントリポイント。canvas / input / loop / render を結線する。
import { createInitialState, update } from './game';
import { attachKeyboard, createInputState } from './input';
import { createGameLoop } from './loop';
import { render } from './render';

function main(): void {
  const canvas = document.getElementById('game');
  if (!(canvas instanceof HTMLCanvasElement)) {
    throw new Error('canvas #game not found');
  }
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('2d rendering context unavailable');
  }

  let state = createInitialState(canvas.width, canvas.height);
  const input = createInputState();
  attachKeyboard(input);

  const loop = createGameLoop({
    update: (dt) => {
      state = update(state, input, dt);
    },
    render: () => {
      render(ctx, state);
    },
  });

  loop.start();
}

main();
