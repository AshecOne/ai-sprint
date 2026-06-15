/**
 * AQUASIM audio — everything is SYNTHESISED in-browser via the Web Audio API.
 * No mp3/wav assets ship with the game (deliberate decision): the whole point
 * is a tiny, license-free, "electric pixel / Pokémon-ish" palette plus a watery
 * aquarium ambient bed.
 *
 * The engine is a lazy singleton. The AudioContext is NOT created until the
 * first user gesture (browser autoplay policy) — and never on the server — so
 * importing this module from the Zustand store / sim loop is side-effect free.
 */

export type SfxName =
  | "feed" // little pixel "blip" up — food drops in
  | "clean" // water swish + sparkle shimmer
  | "coin" // money received (e.g. selling detritus on Clean)
  | "buy" // purchase jingle (fish / plant / gear)
  | "toggle" // tiny tick — flip equipment on/off, tweak gear
  | "error" // "denied" buzz — not enough cash
  | "warning"; // urgent alert — water parameters in the danger zone

const isBrowser = typeof window !== "undefined";

// ---- Background music ------------------------------------------------------
// A looping NES-style chiptune track ("Overworld Theme" by Louswan, CC0 /
// public domain, via OpenGameArt). Decoded once into an AudioBuffer and looped
// through the musicBus so mute/volume still apply and toggling it off is instant.
const MUSIC_URL = "/audio/overworld.ogg";

class AudioEngine {
  private ctx: AudioContext | null = null;
  /** Master → destination. Mute/volume ride here. */
  private master: GainNode | null = null;
  /** SFX, ambient and music each get their own sub-bus for independent mixing. */
  private sfxBus: GainNode | null = null;
  private ambientBus: GainNode | null = null;
  private musicBus: GainNode | null = null;

  private muted = false;
  private volume = 0.7;

  private ambientStarted = false;
  private ambientNodes: AudioNode[] = [];
  private bubbleTimer: ReturnType<typeof setTimeout> | null = null;

  /** Desired on/off (set even before unlock); playback only runs post-gesture. */
  private musicEnabled = true;
  private musicPlaying = false;
  /** Decoded track (loaded once, lazily) + the currently looping source node. */
  private musicBuffer: AudioBuffer | null = null;
  private musicSource: AudioBufferSourceNode | null = null;
  private musicLoading: Promise<AudioBuffer | null> | null = null;

  /** Lazily build the graph. Returns null on the server. */
  private ensure(): AudioContext | null {
    if (!isBrowser) return null;
    if (this.ctx) return this.ctx;

    const Ctx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!Ctx) return null;

    const ctx = new Ctx();
    const master = ctx.createGain();
    const sfxBus = ctx.createGain();
    const ambientBus = ctx.createGain();
    const musicBus = ctx.createGain();

    // Music sits clearly above the SFX/ambient layers so the soundtrack leads.
    sfxBus.gain.value = 0.5;
    ambientBus.gain.value = 0.3;
    musicBus.gain.value = 0.95;
    sfxBus.connect(master);
    ambientBus.connect(master);
    musicBus.connect(master);
    master.connect(ctx.destination);

    this.ctx = ctx;
    this.master = master;
    this.sfxBus = sfxBus;
    this.ambientBus = ambientBus;
    this.musicBus = musicBus;
    this.applyMasterGain();
    return ctx;
  }

  private applyMasterGain() {
    if (!this.master || !this.ctx) return;
    const target = this.muted ? 0 : this.volume;
    // Short ramp avoids clicks when toggling mute / dragging the slider.
    const now = this.ctx.currentTime;
    this.master.gain.cancelScheduledValues(now);
    this.master.gain.setTargetAtTime(target, now, 0.02);
  }

  /** True once a context exists and is running (post-gesture). */
  get unlocked() {
    return !!this.ctx && this.ctx.state === "running";
  }

  /**
   * Resume the context after a user gesture and kick off the ambient bed.
   * Safe to call repeatedly.
   */
  async unlock() {
    const ctx = this.ensure();
    if (!ctx) return;
    if (ctx.state === "suspended") {
      try {
        await ctx.resume();
      } catch {
        /* ignore — will retry on next gesture */
      }
    }
    this.startAmbient();
    if (this.musicEnabled) void this.startMusic();
  }

  setMuted(muted: boolean) {
    this.muted = muted;
    this.applyMasterGain();
  }

  setVolume(volume: number) {
    this.volume = Math.max(0, Math.min(1, volume));
    this.applyMasterGain();
  }

  // ---- low-level synth helpers -------------------------------------------

  /** A single enveloped oscillator note (optionally pitch-gliding). */
  private note(
    bus: GainNode,
    {
      type = "square",
      freq,
      to,
      start,
      dur,
      gain = 0.3,
      attack = 0.005,
    }: {
      type?: OscillatorType;
      freq: number;
      to?: number;
      start: number;
      dur: number;
      gain?: number;
      attack?: number;
    }
  ) {
    const ctx = this.ctx!;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, start);
    if (to !== undefined) osc.frequency.exponentialRampToValueAtTime(Math.max(1, to), start + dur);

    g.gain.setValueAtTime(0.0001, start);
    g.gain.exponentialRampToValueAtTime(gain, start + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, start + dur);

    osc.connect(g);
    g.connect(bus);
    osc.start(start);
    osc.stop(start + dur + 0.02);
  }

  /** A short noise burst pushed through a filter — used for water/scrub FX. */
  private noise(
    bus: GainNode,
    {
      start,
      dur,
      gain = 0.2,
      type = "bandpass",
      freq = 800,
      to,
      q = 1,
    }: {
      start: number;
      dur: number;
      gain?: number;
      type?: BiquadFilterType;
      freq?: number;
      to?: number;
      q?: number;
    }
  ) {
    const ctx = this.ctx!;
    const frames = Math.floor(ctx.sampleRate * dur);
    const buffer = ctx.createBuffer(1, frames, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < frames; i++) data[i] = Math.random() * 2 - 1;

    const src = ctx.createBufferSource();
    src.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = type;
    filter.frequency.setValueAtTime(freq, start);
    filter.Q.value = q;
    if (to !== undefined) filter.frequency.linearRampToValueAtTime(to, start + dur);

    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, start);
    g.gain.exponentialRampToValueAtTime(gain, start + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, start + dur);

    src.connect(filter);
    filter.connect(g);
    g.connect(bus);
    src.start(start);
    src.stop(start + dur + 0.02);
  }

  // ---- SFX ----------------------------------------------------------------

  play(name: SfxName) {
    if (this.muted) return;
    const ctx = this.ensure();
    if (!ctx || ctx.state !== "running" || !this.sfxBus) return;
    const t = ctx.currentTime;
    const bus = this.sfxBus;

    switch (name) {
      case "feed": {
        // happy two-note pixel blip up
        this.note(bus, { type: "square", freq: 523, start: t, dur: 0.07, gain: 0.22 });
        this.note(bus, { type: "square", freq: 784, start: t + 0.07, dur: 0.1, gain: 0.22 });
        break;
      }
      case "clean": {
        // watery scrub: a rising filtered-noise swish + a sparkle shimmer
        this.noise(bus, { start: t, dur: 0.32, gain: 0.16, type: "bandpass", freq: 500, to: 2600, q: 0.7 });
        this.note(bus, { type: "triangle", freq: 1568, start: t + 0.16, dur: 0.09, gain: 0.16 });
        this.note(bus, { type: "triangle", freq: 2093, start: t + 0.24, dur: 0.12, gain: 0.16 });
        break;
      }
      case "coin": {
        // classic two-note coin ding
        this.note(bus, { type: "square", freq: 988, start: t, dur: 0.08, gain: 0.2 });
        this.note(bus, { type: "square", freq: 1319, start: t + 0.08, dur: 0.18, gain: 0.2 });
        break;
      }
      case "buy": {
        // ascending C-E-G purchase jingle (pulse-ish square)
        this.note(bus, { type: "square", freq: 523, start: t, dur: 0.09, gain: 0.18 });
        this.note(bus, { type: "square", freq: 659, start: t + 0.09, dur: 0.09, gain: 0.18 });
        this.note(bus, { type: "square", freq: 784, start: t + 0.18, dur: 0.16, gain: 0.2 });
        break;
      }
      case "toggle": {
        // tiny two-step tick — flipping gear on / tweaking equipment
        this.note(bus, { type: "square", freq: 660, start: t, dur: 0.05, gain: 0.16 });
        this.note(bus, { type: "square", freq: 880, start: t + 0.05, dur: 0.06, gain: 0.16 });
        break;
      }
      case "error": {
        // low descending "denied" buzz
        this.note(bus, { type: "square", freq: 220, to: 160, start: t, dur: 0.12, gain: 0.18 });
        this.note(bus, { type: "square", freq: 165, to: 120, start: t + 0.12, dur: 0.16, gain: 0.18 });
        break;
      }
      case "warning": {
        // urgent two-tone alert, repeated — "water in the danger zone"
        const beep = (at: number, freq: number) =>
          this.note(bus, { type: "sawtooth", freq, start: at, dur: 0.12, gain: 0.16 });
        beep(t, 880);
        beep(t + 0.16, 660);
        beep(t + 0.32, 880);
        beep(t + 0.48, 660);
        break;
      }
    }
  }

  // ---- Ambient ------------------------------------------------------------

  /** Continuous watery hum + randomly scheduled bubble blips. */
  startAmbient() {
    if (this.ambientStarted) return;
    const ctx = this.ensure();
    if (!ctx || ctx.state !== "running" || !this.ambientBus) return;
    this.ambientStarted = true;

    // Looping brown-ish noise through a low-pass = the "water" bed.
    const frames = ctx.sampleRate * 2;
    const buffer = ctx.createBuffer(1, frames, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let last = 0;
    for (let i = 0; i < frames; i++) {
      const white = Math.random() * 2 - 1;
      last = (last + 0.02 * white) / 1.02;
      data[i] = last * 3.5;
    }
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    src.loop = true;

    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 420;

    const bedGain = ctx.createGain();
    bedGain.gain.value = 0.5;

    // Slow LFO gently breathes the filter so the hum isn't static.
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.frequency.value = 0.08;
    lfoGain.gain.value = 120;
    lfo.connect(lfoGain);
    lfoGain.connect(lp.frequency);

    src.connect(lp);
    lp.connect(bedGain);
    bedGain.connect(this.ambientBus);
    src.start();
    lfo.start();

    this.ambientNodes = [src, lp, bedGain, lfo, lfoGain];
    this.scheduleBubble();
  }

  private scheduleBubble() {
    if (!this.ambientStarted) return;
    const delay = 400 + Math.random() * 1600; // 0.4s–2.0s
    this.bubbleTimer = setTimeout(() => {
      this.bubble();
      this.scheduleBubble();
    }, delay);
  }

  /** A single rising-pitch "bloop". */
  private bubble() {
    const ctx = this.ctx;
    if (!ctx || ctx.state !== "running" || !this.ambientBus) return;
    const t = ctx.currentTime;
    const base = 160 + Math.random() * 220;
    this.note(this.ambientBus, {
      type: "sine",
      freq: base,
      to: base * 2.4,
      start: t,
      dur: 0.09 + Math.random() * 0.06,
      gain: 0.12,
      attack: 0.01,
    });
  }

  stopAmbient() {
    if (this.bubbleTimer) {
      clearTimeout(this.bubbleTimer);
      this.bubbleTimer = null;
    }
    for (const node of this.ambientNodes) {
      try {
        if ("stop" in node && typeof (node as OscillatorNode).stop === "function") {
          (node as OscillatorNode).stop();
        }
        node.disconnect();
      } catch {
        /* already stopped */
      }
    }
    this.ambientNodes = [];
    this.ambientStarted = false;
  }

  // ---- Music --------------------------------------------------------------

  /** Turn the chiptune loop on/off. Remembered even before the first gesture. */
  setMusicEnabled(on: boolean) {
    this.musicEnabled = on;
    if (on) void this.startMusic();
    else this.stopMusic();
  }

  /** Fetch + decode the track once. Subsequent calls reuse the buffer/promise. */
  private loadMusic(ctx: AudioContext): Promise<AudioBuffer | null> {
    if (this.musicBuffer) return Promise.resolve(this.musicBuffer);
    if (!this.musicLoading) {
      this.musicLoading = fetch(MUSIC_URL)
        .then((r) => r.arrayBuffer())
        .then((ab) => ctx.decodeAudioData(ab))
        .then((buf) => {
          this.musicBuffer = buf;
          return buf;
        })
        .catch(() => {
          // Network/decode failed — clear so a later attempt can retry.
          this.musicLoading = null;
          return null;
        });
    }
    return this.musicLoading;
  }

  /** Start the looping track. No-op until a context is running (post-gesture). */
  async startMusic() {
    if (this.musicPlaying) return;
    const ctx = this.ensure();
    if (!ctx || ctx.state !== "running" || !this.musicBus) return;
    // Claim the slot before the async load so a second call can't double-start.
    this.musicPlaying = true;
    const buf = await this.loadMusic(ctx);
    // The player may have toggled music off (or the context suspended) while
    // the track was loading — bail cleanly if so.
    if (!buf || !this.musicPlaying || !this.musicBus || ctx.state !== "running") {
      this.musicPlaying = false;
      return;
    }
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.loop = true;
    src.connect(this.musicBus);
    src.start();
    this.musicSource = src;
  }

  /** Stop instantly — a buffer source has no tail, so there's no lingering loop. */
  stopMusic() {
    this.musicPlaying = false;
    if (this.musicSource) {
      try {
        this.musicSource.stop();
        this.musicSource.disconnect();
      } catch {
        /* already stopped */
      }
      this.musicSource = null;
    }
  }
}

/** Singleton — inert on the server and until the first user gesture. */
export const audio = new AudioEngine();
