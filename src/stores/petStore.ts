import { create } from "zustand";
import type { PetPose, PetConfig, AppSettings } from "../types";

let bubbleTimer: ReturnType<typeof setTimeout> | null = null;

interface PetStore {
  // Visual state
  pose: PetPose;
  currentAnim: string;
  isVisible: boolean;
  isCrushing: boolean;
  bubbleText: string;
  bubbleVisible: boolean;
  bubbleAnimClass: string | null;

  // Activity
  kpm: number;
  cumulativeCodingMinutes: number;

  // Config
  settings: AppSettings | null;
  petConfig: PetConfig;

  // Actions
  setPose: (pose: PetPose) => void;
  setAnim: (name: string) => void;
  setVisible: (v: boolean) => void;
  setCrushing: (v: boolean) => void;
  showBubble: (text: string, durationMs?: number, animClass?: string) => void;
  hideBubble: () => void;
  updateKpm: (kpm: number) => void;
  tickMinute: () => void;
  resetCodingTime: () => void;
  setSettings: (s: AppSettings) => void;
  setPetConfig: (c: PetConfig) => void;
}

export const usePetStore = create<PetStore>((set) => ({
  pose: "lying",
  currentAnim: "lying",
  isVisible: true,
  isCrushing: false,
  bubbleText: "",
  bubbleVisible: false,
  bubbleAnimClass: null,
  kpm: 0,
  cumulativeCodingMinutes: 0,
  settings: null,
  petConfig: {
    parts: { body: "chubby", head: "cat", eyes: "normal", mouth: "smile", tail: "cat", accessories: [] },
    colors: { primary: "#F0A070", secondary: "#FAD0B0", eye: "#3D3835", accessory: "#8EA0B0" },
  },

  setPose: (pose) => set({ pose }),
  setAnim: (currentAnim) => set({ currentAnim }),
  setVisible: (isVisible) => set({ isVisible }),
  setCrushing: (isCrushing) => set({ isCrushing }),
  showBubble: (text, durationMs = 4000, animClass?: string) => {
    if (bubbleTimer) clearTimeout(bubbleTimer);
    set({ bubbleText: text, bubbleVisible: true, bubbleAnimClass: animClass ?? null });
    if (durationMs > 0) {
      bubbleTimer = setTimeout(() => {
        bubbleTimer = null;
        set({ bubbleVisible: false, bubbleAnimClass: null });
      }, durationMs);
    }
  },
  hideBubble: () => set({ bubbleVisible: false, bubbleAnimClass: null }),
  updateKpm: (kpm) => set({ kpm }),
  tickMinute: () =>
    set((s) => ({ cumulativeCodingMinutes: s.kpm > 0 ? s.cumulativeCodingMinutes + 1 : 0 })),
  resetCodingTime: () => set({ cumulativeCodingMinutes: 0 }),
  setSettings: (settings) => set({ settings }),
  setPetConfig: (petConfig) => set({ petConfig }),
}));
