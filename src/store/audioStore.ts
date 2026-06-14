"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { audio } from "@/audio/engine";

/**
 * Audio preferences — mute, music on/off and master volume.
 *
 * Persisted to localStorage (same Zustand `persist` pattern as the aquarium
 * store) so the player's choice survives reloads. The settings are pushed into
 * the synth engine on every change AND re-applied on the first user gesture via
 * `unlock()` — the AudioContext can't run before then (browser autoplay policy).
 */
interface AudioState {
  /** Master mute (silences SFX, ambient and music). */
  muted: boolean;
  /** Background chiptune loop on/off (independent of the SFX/ambient mute). */
  musicOn: boolean;
  /** Master volume, 0–1. */
  volume: number;

  toggleMuted: () => void;
  setMuted: (muted: boolean) => void;
  toggleMusic: () => void;
  setVolume: (volume: number) => void;
  /** Resume the context after a gesture and apply the persisted settings. */
  unlock: () => void;
}

export const useAudioStore = create<AudioState>()(
  persist(
    (set, get) => ({
      muted: false,
      musicOn: true,
      volume: 0.7,

      toggleMuted: () => {
        const muted = !get().muted;
        audio.setMuted(muted);
        set({ muted });
      },
      setMuted: (muted) => {
        audio.setMuted(muted);
        set({ muted });
      },
      toggleMusic: () => {
        const musicOn = !get().musicOn;
        audio.setMusicEnabled(musicOn);
        set({ musicOn });
      },
      setVolume: (volume) => {
        const v = Math.max(0, Math.min(1, volume));
        audio.setVolume(v);
        set({ volume: v });
      },

      unlock: () => {
        const { muted, volume, musicOn } = get();
        audio.setMuted(muted);
        audio.setVolume(volume);
        audio.setMusicEnabled(musicOn);
        void audio.unlock();
      },
    }),
    {
      name: "aquasim-audio",
      partialize: (s) => ({
        muted: s.muted,
        musicOn: s.musicOn,
        volume: s.volume,
      }),
    }
  )
);
