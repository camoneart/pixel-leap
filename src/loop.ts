// 固定タイムステップのゲームループ (DOM 依存: requestAnimationFrame)。
// 入力 -> 更新 (固定 dt) -> 描画 を accumulator 方式で回す。

export interface LoopCallbacks {
  /** 固定ステップ更新。dt は固定秒 (既定 1/60)。 */
  update: (dt: number) => void;
  /** 描画。alpha は 0..1 の補間係数。 */
  render: (alpha: number) => void;
}

export interface GameLoop {
  start: () => void;
  stop: () => void;
}

// 1 フレームで処理する dt の上限 (タブ復帰時などの spiral of death 防止)。
const MAX_FRAME_SECONDS = 0.25;

/**
 * 固定タイムステップのゲームループを生成する。
 * @param callbacks update/render コールバック
 * @param step 固定ステップ秒 (既定 1/60)
 */
export function createGameLoop(callbacks: LoopCallbacks, step = 1 / 60): GameLoop {
  let rafId = 0;
  let running = false;
  let last = 0;
  let accumulator = 0;

  const frame = (now: number): void => {
    if (!running) return;

    let frameSeconds = (now - last) / 1000;
    last = now;
    if (frameSeconds > MAX_FRAME_SECONDS) frameSeconds = MAX_FRAME_SECONDS;

    accumulator += frameSeconds;
    while (accumulator >= step) {
      callbacks.update(step);
      accumulator -= step;
    }
    callbacks.render(accumulator / step);

    rafId = requestAnimationFrame(frame);
  };

  return {
    start(): void {
      if (running) return;
      running = true;
      last = performance.now();
      accumulator = 0;
      rafId = requestAnimationFrame(frame);
    },
    stop(): void {
      running = false;
      if (rafId) cancelAnimationFrame(rafId);
      rafId = 0;
    },
  };
}
