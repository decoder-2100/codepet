/**
 * Robustness & Edge-Case Tests
 *
 * Covers: boundary conditions, null/empty inputs, concurrent operations,
 * error recovery, data integrity under stress.
 */
import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { usePetStore } from "../stores/petStore";
import { getRandomCompliment, getRandomRoast, FALLBACK_ROASTS, getCrushAscii } from "../canvas/ascii";
import { normalizeSettings } from "../utils/normalizeSettings";
import { AnimationPlayer } from "../canvas/animationEngine";
import { registerAnimations } from "../canvas/animations";
import { bodyVariants } from "../canvas/parts/body";
import { headVariants } from "../canvas/parts/head";

// streamStore is imported lazily to avoid circular dependency with chatStore
// (chatStore imports @tauri-apps/api/core which is undefined in jsdom)

// ============================================================
// Store Robustness Tests
// ============================================================

describe("Robustness: petStore edge cases", () => {
  beforeEach(() => {
    vi.useRealTimers();
    usePetStore.setState({
      pose: "idle",
      currentAnim: "idle",
      isVisible: true,
      isCrushing: false,
      bubbleText: "",
      bubbleVisible: false,
      bubbleAnimClass: "",
      kpm: 0,
      cumulativeCodingMinutes: 0,
      settings: null,
      petConfig: {
        parts: { body: "chubby", head: "cat", eyes: "normal", mouth: "smile", tail: "cat", accessories: [] },
        colors: { primary: "#FF8C42", secondary: "#FFB347", eye: "#2C3E50", accessory: "#8E44AD" },
      },
      chatOpen: false,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should handle negative KPM gracefully", () => {
    usePetStore.getState().updateKpm(-10);
    expect(usePetStore.getState().kpm).toBe(-10);
  });

  it("should handle very large KPM", () => {
    usePetStore.getState().updateKpm(999999);
    expect(usePetStore.getState().kpm).toBe(999999);
  });

  it("should handle tickMinute with zero coding minutes accumulated", () => {
    usePetStore.getState().updateKpm(0);
    usePetStore.getState().tickMinute();
    expect(usePetStore.getState().cumulativeCodingMinutes).toBe(0);
  });

  it("should handle tickMinute with negative cumulative minutes (should not crash)", () => {
    usePetStore.getState().updateKpm(10);
    usePetStore.getState().tickMinute();
    (usePetStore as any).getState().cumulativeCodingMinutes = -5;
    usePetStore.getState().updateKpm(0);
    usePetStore.getState().tickMinute();
    expect(usePetStore.getState().cumulativeCodingMinutes).toBe(0);
  });

  it("showBubble should handle empty text", () => {
    usePetStore.getState().showBubble("", 1000);
    expect(usePetStore.getState().bubbleText).toBe("");
    expect(usePetStore.getState().bubbleVisible).toBe(true);
  });

  it("showBubble should handle very long text", () => {
    const longText = "a".repeat(10000);
    usePetStore.getState().showBubble(longText, 1000);
    expect(usePetStore.getState().bubbleText).toBe(longText);
  });

  it("showBubble should handle negative duration (should not crash)", () => {
    vi.useFakeTimers();
    usePetStore.getState().showBubble("test", -1000);
    expect(usePetStore.getState().bubbleVisible).toBe(true);
    vi.advanceTimersByTime(100);
  });

  it("showBubble should replace previous bubble immediately", () => {
    usePetStore.getState().showBubble("first", 5000);
    expect(usePetStore.getState().bubbleText).toBe("first");
    usePetStore.getState().showBubble("second", 5000);
    expect(usePetStore.getState().bubbleText).toBe("second");
  });

  it("hideBubble when already hidden should not crash", () => {
    usePetStore.getState().hideBubble();
    usePetStore.getState().hideBubble();
    expect(usePetStore.getState().bubbleVisible).toBe(false);
  });

  it("setPose with invalid pose string should still update state", () => {
    (usePetStore.getState().setPose as any)("invalid_pose");
    expect(usePetStore.getState().pose).toBe("invalid_pose");
  });

  it("toggleChat should work regardless of current state", () => {
    usePetStore.getState().toggleChat();
    expect(usePetStore.getState().chatOpen).toBe(true);
    usePetStore.getState().toggleChat();
    expect(usePetStore.getState().chatOpen).toBe(false);
    usePetStore.getState().toggleChat();
    expect(usePetStore.getState().chatOpen).toBe(true);
  });

  it("setSettings should accept null", () => {
    (usePetStore.getState().setSettings as any)(null);
    expect(usePetStore.getState().settings).toBeNull();
  });

  it("setPetConfig should accept partial config without crash", () => {
    const partialConfig = {
      parts: { body: "golden" as const, head: "cat" as const, eyes: "normal" as const, mouth: "smile" as const, tail: "cat" as const, accessories: [] as string[] },
      colors: { primary: "#FF0000" },
    } as any;
    usePetStore.getState().setPetConfig(partialConfig);
    expect(usePetStore.getState().petConfig.colors.primary).toBe("#FF0000");
  });
});

// ============================================================
// streamRegistry Robustness Tests (imported dynamically)
// ============================================================

describe("Robustness: streamRegistry", () => {
  let streamRegistry: any;

  beforeEach(async () => {
    const mod = await import("../stores/streamStore");
    streamRegistry = mod.streamRegistry;
    streamRegistry.clear();
  });

  it("should handle emitToken when no handler is registered", () => {
    expect(() => streamRegistry.emitToken("token")).not.toThrow();
  });

  it("should handle emitDone when no handler is registered", () => {
    expect(() => streamRegistry.emitDone()).not.toThrow();
  });

  it("should handle emitError when no handler is registered", () => {
    expect(() => streamRegistry.emitError("error")).not.toThrow();
  });

  it("should handle register then clear then emit", async () => {
    const tokens: string[] = [];
    streamRegistry.register("chat", {
      onToken: (t: string) => tokens.push(t),
      onDone: () => {},
      onError: () => {},
    });
    streamRegistry.emitToken("a");
    streamRegistry.clear();
    streamRegistry.emitToken("b");
    expect(tokens).toEqual(["a"]);
  });

  it("should handle double clear without crash", () => {
    streamRegistry.clear();
    streamRegistry.clear();
    expect(streamRegistry.getActive()).toBeNull();
  });

  it("should replace existing handler on re-register", () => {
    const tokens1: string[] = [];
    const tokens2: string[] = [];
    streamRegistry.register("chat", {
      onToken: (t: string) => tokens1.push(t),
      onDone: () => {},
      onError: () => {},
    });
    streamRegistry.register("roast", {
      onToken: (t: string) => tokens2.push(t),
      onDone: () => {},
      onError: () => {},
    });
    streamRegistry.emitToken("x");
    expect(tokens1).toEqual([]);
    expect(tokens2).toEqual(["x"]);
  });

  it("should handle all stream types", () => {
    const types = ["chat", "roast", "compliment"] as const;
    for (const type of types) {
      streamRegistry.register(type, {
        onToken: () => {},
        onDone: () => {},
        onError: () => {},
      });
      expect(streamRegistry.getActive()).toBe(type);
    }
  });

  it("getActive should return null initially", () => {
    expect(streamRegistry.getActive()).toBeNull();
  });
});

// ============================================================
// Animation Engine Robustness
// ============================================================

describe("Robustness: AnimationPlayer edge cases", () => {
  let player: AnimationPlayer;

  beforeEach(() => {
    player = new AnimationPlayer();
    registerAnimations(player);
  });

  it("advance should handle 0ms delta", () => {
    player.play("idle");
    const state = player.advance(0);
    expect(state).not.toBeNull();
  });

  it("advance should handle negative delta without crash", () => {
    player.play("idle");
    const state = player.advance(-100);
    expect(state).not.toBeNull();
  });

  it("advance should handle very large delta", () => {
    player.play("idle");
    const state = player.advance(100000);
    expect(state).not.toBeNull();
  });

  it("advance without playing animation should return null", () => {
    const state = player.advance(16);
    expect(state).toBeNull();
  });

  it("rapid play calls should not crash", () => {
    for (let i = 0; i < 100; i++) {
      player.play(i % 2 === 0 ? "idle" : "typing");
    }
    const state = player.advance(16);
    expect(state).not.toBeNull();
  });

  it("play unknown animation name should not crash", () => {
    (player.play as any)("nonexistent_animation");
    const state = player.advance(16);
    expect(state).toBeNull();
  });

  it("blinkScale should always be between 0 and 1", () => {
    player.play("idle");
    for (let i = 0; i < 1000; i++) {
      player.advance(16);
      expect(player.blinkScale).toBeGreaterThanOrEqual(0);
      expect(player.blinkScale).toBeLessThanOrEqual(1);
    }
  });

  it("advance should return consistent PartState shape", () => {
    player.play("idle");
    for (let i = 0; i < 20; i++) {
      const state = player.advance(16);
      if (state) {
        expect(state).toHaveProperty("body");
        expect(state).toHaveProperty("head");
        expect(state).toHaveProperty("eyes");
        expect(state).toHaveProperty("mouth");
        expect(state).toHaveProperty("tail");
        expect(state.body).toHaveProperty("x");
        expect(state.body).toHaveProperty("y");
        expect(state.body).toHaveProperty("rotation");
        expect(state.body).toHaveProperty("scaleX");
        expect(state.body).toHaveProperty("scaleY");
      }
    }
  });
});

// ============================================================
// ASCII/Content Robustness
// ============================================================

describe("Robustness: ASCII content functions", () => {
  it("getRandomCompliment should always return a non-empty string", () => {
    for (let i = 0; i < 50; i++) {
      const result = getRandomCompliment();
      expect(typeof result).toBe("string");
      expect(result.length).toBeGreaterThan(0);
    }
  });

  it("getRandomRoast should always return a non-empty string", () => {
    for (let i = 0; i < 50; i++) {
      const result = getRandomRoast();
      expect(typeof result).toBe("string");
      expect(result.length).toBeGreaterThan(0);
    }
  });

  it("FALLBACK_ROASTS should contain only non-empty strings", () => {
    for (const roast of FALLBACK_ROASTS) {
      expect(typeof roast).toBe("string");
      expect(roast.length).toBeGreaterThan(0);
    }
  });

  it("getRandomCompliment should have variety (not always same result in 20 calls)", () => {
    const results = new Set<string>();
    for (let i = 0; i < 20; i++) {
      results.add(getRandomCompliment());
    }
    expect(results.size).toBeGreaterThan(1);
  });

  it("getCrushAscii should handle empty error text", () => {
    const result = getCrushAscii("");
    expect(typeof result).toBe("string");
    expect(result.length).toBeGreaterThan(0);
  });

  it("getCrushAscii should handle multiline error text", () => {
    const result = getCrushAscii("line1\nline2\nline3\nline4\nline5");
    expect(typeof result).toBe("string");
    expect(result).toContain("已粉碎");
  });

  it("getCrushAscii should handle very long error text (truncation)", () => {
    const longError = "x".repeat(5000);
    const result = getCrushAscii(longError);
    expect(result.length).toBeLessThan(longError.length);
    expect(result).toContain("已粉碎");
  });
});

// ============================================================
// normalizeSettings Robustness
// ============================================================

describe("Robustness: normalizeSettings", () => {
  it("should handle null input gracefully (return defaults)", () => {
    const result = normalizeSettings(null as any);
    expect(result).toBeDefined();
    expect(result.petName).toBe("橘宝");
    expect(result.skin).toBe("matrix");
  });

  it("should handle undefined input gracefully (return defaults)", () => {
    const result = normalizeSettings(undefined as any);
    expect(result).toBeDefined();
    expect(result.petName).toBe("橘宝");
  });

  it("should handle empty object", () => {
    const result = normalizeSettings({});
    expect(result).toBeDefined();
    expect(result.petName).toBe("橘宝");
  });

  it("should handle partial settings (missing nested objects)", () => {
    const result = normalizeSettings({
      petName: "test",
    } as any);
    expect(result.petName).toBe("test");
    expect(result.llm).toBeDefined();
  });

  it("should handle snake_case input", () => {
    const result = normalizeSettings({
      pet_name: "snake_case_pet",
      llm_config: {
        api_key: "test-key",
        provider: "deepseek",
        model: "deepseek-chat",
        temperature: 0.7,
      },
      pet_config: {
        parts: {
          body_type: "chubby",
          head_type: "cat",
          eye_type: "normal",
          mouth_type: "smile",
          accessories: [],
        },
        colors: {
          primary: "#FF8C42",
          secondary: "#FFB347",
          eye: "#2C3E50",
          accessory: "#8E44AD",
        },
      },
    } as any);
    expect(result.petName).toBe("snake_case_pet");
    expect(result.llm.apiKey).toBe("test-key");
  });

  it("should handle camelCase input", () => {
    const result = normalizeSettings({
      petName: "camelPet",
      llm: {
        apiKey: "camel-key",
        provider: "qwen",
        model: "qwen-plus",
        temperature: 0.8,
      },
    } as any);
    expect(result.petName).toBe("camelPet");
    expect(result.llm.apiKey).toBe("camel-key");
  });

  it("should preserve unknown fields", () => {
    const result = normalizeSettings({
      petName: "test",
      unknownField: "should_preserve",
    } as any);
    expect((result as any).unknownField).toBe("should_preserve");
  });
});

// ============================================================
// Utility functions
// ============================================================

describe("Robustness: utility functions", () => {
  it("body variants should exist and be callable", () => {
    expect(typeof bodyVariants.chubby).toBe("function");
  });

  it("head variants should exist and be callable", () => {
    expect(typeof headVariants.cat).toBe("function");
  });

  it("sound utilities should export expected functions", async () => {
    const sound = await import("../utils/sound");
    expect(typeof sound.Sound.click).toBe("function");
    expect(typeof sound.Sound.crush).toBe("function");
    expect(typeof sound.Sound.message).toBe("function");
  });
});
