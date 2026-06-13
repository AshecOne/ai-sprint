import type { GameSpeed } from './types';

/** Called on every simulation tick with the current tick counter and real elapsed ms. */
export type TickCallback = (tick: number, deltaMs: number) => void;

/**
 * requestAnimationFrame-based game loop.
 * One "tick" = one in-game second.
 * At 1× speed: 1 tick per real second.
 * At 5× speed: 5 ticks per real second.
 * At 60× speed: 60 ticks per real second (1 real second = 1 in-game minute).
 */
export class GameLoop {
  private _tick = 0;
  private _speed: GameSpeed = 1;
  private _paused = false;
  private lastTimestamp = 0;
  private rafId: number | null = null;
  private subscribers = new Set<TickCallback>();
  private accumulated = 0;

  get tick(): number { return this._tick; }
  get speed(): GameSpeed { return this._speed; }
  get paused(): boolean { return this._paused; }

  subscribe(cb: TickCallback): () => void {
    this.subscribers.add(cb);
    return () => this.subscribers.delete(cb);
  }

  setSpeed(speed: GameSpeed): void {
    this._speed = speed;
  }

  pause(): void {
    this._paused = true;
  }

  resume(): void {
    this._paused = false;
    if (this.rafId === null) {
      this.lastTimestamp = performance.now();
      this.rafId = requestAnimationFrame(this.loop);
    }
  }

  start(): void {
    if (this.rafId !== null) return;
    this.lastTimestamp = performance.now();
    this.rafId = requestAnimationFrame(this.loop);
  }

  stop(): void {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  reset(): void {
    this.stop();
    this._tick = 0;
    this.accumulated = 0;
  }

  private loop = (timestamp: number): void => {
    this.rafId = requestAnimationFrame(this.loop);

    if (this._paused) {
      this.lastTimestamp = timestamp;
      return;
    }

    const rawDelta = timestamp - this.lastTimestamp;
    this.lastTimestamp = timestamp;

    // Cap at 200ms to prevent spiral-of-death after tab was backgrounded.
    const delta = Math.min(rawDelta, 200);
    this.accumulated += delta * this._speed;

    // Each tick represents 1000 real-ms worth of in-game time at 1× speed.
    const MS_PER_TICK = 1000;
    while (this.accumulated >= MS_PER_TICK) {
      this.accumulated -= MS_PER_TICK;
      this._tick++;
      for (const cb of this.subscribers) {
        cb(this._tick, MS_PER_TICK);
      }
    }
  };
}

/** Lazy singleton — only created in browser environments. */
let _instance: GameLoop | null = null;

export function getGameLoop(): GameLoop {
  if (typeof window === 'undefined') {
    throw new Error('GameLoop is browser-only');
  }
  if (!_instance) _instance = new GameLoop();
  return _instance;
}
