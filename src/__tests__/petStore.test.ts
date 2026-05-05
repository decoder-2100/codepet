import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { usePetStore } from "../stores/petStore";

describe("petStore", () => {
  beforeEach(() => {
    vi.useRealTimers();
    // Reset store to initial state
    usePetStore.setState({
      pose: "idle",
      currentAnim: "idle",
      isVisible: true,
      isCrushing: false,
      bubbleText: "",
      bubbleVisible: false,
      kpm: 0,
      cumulativeCodingMinutes: 0,
      settings: null,
      petConfig: {
        parts: { body: "chubby", head: "cat", eyes: "normal", mouth: "smile", tail: "cat", accessories: [] },
        colors: { primary: "#FF8C42", secondary: "#FFB347", eye: "#2C3E50", accessory: "#8E44AD" },
      },
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("F1.3: Pose management", () => {
    it("should start with idle pose", () => {
      expect(usePetStore.getState().pose).toBe("idle");
    });

    it("should update pose via setPose", () => {
      usePetStore.getState().setPose("coding");
      expect(usePetStore.getState().pose).toBe("coding");

      usePetStore.getState().setPose("collapsed");
      expect(usePetStore.getState().pose).toBe("collapsed");

      usePetStore.getState().setPose("crushing");
      expect(usePetStore.getState().pose).toBe("crushing");

      usePetStore.getState().setPose("happy");
      expect(usePetStore.getState().pose).toBe("happy");

      usePetStore.getState().setPose("talking");
      expect(usePetStore.getState().pose).toBe("talking");
    });

    it("should update animation name via setAnim", () => {
      usePetStore.getState().setAnim("typing");
      expect(usePetStore.getState().currentAnim).toBe("typing");
    });

    it("should set crushing state", () => {
      expect(usePetStore.getState().isCrushing).toBe(false);
      usePetStore.getState().setCrushing(true);
      expect(usePetStore.getState().isCrushing).toBe(true);
    });
  });

  describe("F2.3: KPM and coding time tracking", () => {
    it("should start with 0 KPM", () => {
      expect(usePetStore.getState().kpm).toBe(0);
    });

    it("should update KPM", () => {
      usePetStore.getState().updateKpm(45);
      expect(usePetStore.getState().kpm).toBe(45);

      usePetStore.getState().updateKpm(120);
      expect(usePetStore.getState().kpm).toBe(120);
    });

    it("should accumulate coding minutes when KPM > 0", () => {
      usePetStore.getState().updateKpm(30);
      usePetStore.getState().tickMinute();
      expect(usePetStore.getState().cumulativeCodingMinutes).toBe(1);

      usePetStore.getState().tickMinute();
      expect(usePetStore.getState().cumulativeCodingMinutes).toBe(2);
    });

    it("should reset coding time when KPM is 0", () => {
      usePetStore.getState().updateKpm(30);
      usePetStore.getState().tickMinute();
      usePetStore.getState().tickMinute();
      expect(usePetStore.getState().cumulativeCodingMinutes).toBe(2);

      usePetStore.getState().updateKpm(0);
      usePetStore.getState().tickMinute();
      expect(usePetStore.getState().cumulativeCodingMinutes).toBe(0);
    });

    it("should reset coding time via resetCodingTime", () => {
      usePetStore.getState().updateKpm(30);
      usePetStore.getState().tickMinute();
      usePetStore.getState().resetCodingTime();
      expect(usePetStore.getState().cumulativeCodingMinutes).toBe(0);
    });
  });

  describe("F7.1: Speech bubble", () => {
    it("should start with no bubble", () => {
      expect(usePetStore.getState().bubbleVisible).toBe(false);
      expect(usePetStore.getState().bubbleText).toBe("");
    });

    it("should show bubble with text", () => {
      usePetStore.getState().showBubble("Hello!", 1000);
      expect(usePetStore.getState().bubbleVisible).toBe(true);
      expect(usePetStore.getState().bubbleText).toBe("Hello!");
    });

    it("should auto-hide bubble after duration", () => {
      vi.useFakeTimers();
      usePetStore.getState().showBubble("Test", 500);

      expect(usePetStore.getState().bubbleVisible).toBe(true);

      vi.advanceTimersByTime(500);
      expect(usePetStore.getState().bubbleVisible).toBe(false);
    });

    it("should keep bubble visible if duration is 0", () => {
      usePetStore.getState().showBubble("Persistent", 0);
      expect(usePetStore.getState().bubbleVisible).toBe(true);
      // Should not auto-hide
    });

    it("should hide bubble on demand", () => {
      usePetStore.getState().showBubble("Hide me", 5000);
      expect(usePetStore.getState().bubbleVisible).toBe(true);

      usePetStore.getState().hideBubble();
      expect(usePetStore.getState().bubbleVisible).toBe(false);
    });
  });

  describe("F1.1: Pet config", () => {
    it("should start with default pet config", () => {
      const config = usePetStore.getState().petConfig;
      expect(config.parts.body).toBe("chubby");
      expect(config.parts.head).toBe("cat");
      expect(config.colors.primary).toBe("#FF8C42");
    });

    it("should update pet config", () => {
      usePetStore.getState().setPetConfig({
        parts: { body: "robot", head: "robot", eyes: "dot", mouth: "straight", tail: "robot", accessories: ["keyboard"] },
        colors: { primary: "#2C3E50", secondary: "#34495E", eye: "#00ff41", accessory: "#7F8C8D" },
      });

      const config = usePetStore.getState().petConfig;
      expect(config.parts.body).toBe("robot");
      expect(config.colors.primary).toBe("#2C3E50");
    });
  });

  describe("F2.1: Visibility", () => {
    it("should start visible", () => {
      expect(usePetStore.getState().isVisible).toBe(true);
    });

    it("should toggle visibility", () => {
      usePetStore.getState().setVisible(false);
      expect(usePetStore.getState().isVisible).toBe(false);

      usePetStore.getState().setVisible(true);
      expect(usePetStore.getState().isVisible).toBe(true);
    });
  });

  describe("F8: Settings management", () => {
    it("should start with null settings", () => {
      expect(usePetStore.getState().settings).toBeNull();
    });

    it("should update settings", () => {
      const mockSettings: any = {
        skin: "matrix",
        soundEnabled: true,
        reminderInterval: 120,
        autoHide: true,
        llm: { provider: "deepseek", apiKey: "", model: "deepseek-chat", temperature: 0.7 },
        petConfig: {
          parts: { body: "chubby", head: "cat", eyes: "normal", mouth: "smile", accessories: [] },
          colors: { primary: "#FF8C42", secondary: "#FFB347", eye: "#2C3E50", accessory: "#8E44AD" },
        },
        petName: "橘宝",
        personality: "humorous",
        soulMd: "## Soul",
        skills: ["bug_analysis", "roast"],
      };
      usePetStore.getState().setSettings(mockSettings);
      expect(usePetStore.getState().settings).toEqual(mockSettings);
    });
  });
});
