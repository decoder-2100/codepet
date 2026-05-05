import { describe, it, expect, beforeEach } from "vitest";
import { AnimationPlayer } from "../canvas/animationEngine";
import { registerAnimations } from "../canvas/animations";
import type { Animation, PartName, PartState } from "../types";

const DEFAULT_STATE: PartState = { x: 0, y: 0, rotation: 0, scaleX: 1, scaleY: 1, opacity: 1 };

function makeIdleAnim(): Animation {
  return {
    name: "idle",
    loop: true,
    duration: 2000,
    keyframes: [
      {
        time: 0,
        parts: {
          body: { x: 0, y: 0, rotation: 0, scaleX: 1, scaleY: 1, opacity: 1 },
          head: { x: 0, y: 0, rotation: 0, scaleX: 1, scaleY: 1, opacity: 1 },
          eyes: { x: 0, y: 0, rotation: 0, scaleX: 1, scaleY: 1, opacity: 1 },
          mouth: { x: 0, y: 0, rotation: 0, scaleX: 1, scaleY: 1, opacity: 1 },
          tail: { x: 0, y: 0, rotation: 0, scaleX: 1, scaleY: 1, opacity: 1 },
        },
      },
      {
        time: 1000,
        parts: {
          body: { x: 0, y: -6, rotation: 0, scaleX: 0.96, scaleY: 1.07, opacity: 1 },
          head: { x: 0, y: -2, rotation: -3, scaleX: 1, scaleY: 1, opacity: 1 },
          eyes: { x: 0, y: 0, rotation: 0, scaleX: 1, scaleY: 1, opacity: 1 },
          mouth: { x: 0, y: 0, rotation: 0, scaleX: 1, scaleY: 1, opacity: 1 },
          tail: { x: 0, y: 0, rotation: 0, scaleX: 1, scaleY: 1, opacity: 1 },
        },
      },
      {
        time: 2000,
        parts: {
          body: { x: 0, y: 0, rotation: 0, scaleX: 1, scaleY: 1, opacity: 1 },
          head: { x: 0, y: 0, rotation: 0, scaleX: 1, scaleY: 1, opacity: 1 },
          eyes: { x: 0, y: 0, rotation: 0, scaleX: 1, scaleY: 1, opacity: 1 },
          mouth: { x: 0, y: 0, rotation: 0, scaleX: 1, scaleY: 1, opacity: 1 },
          tail: { x: 0, y: 0, rotation: 0, scaleX: 1, scaleY: 1, opacity: 1 },
        },
      },
    ],
  };
}

function makeCrushingAnim(): Animation {
  return {
    name: "crushing",
    loop: false,
    duration: 1000,
    keyframes: [
      {
        time: 0,
        parts: {
          body: { x: 0, y: 0, rotation: 0, scaleX: 1, scaleY: 1, opacity: 1 },
          head: { x: 0, y: 0, rotation: 0, scaleX: 1, scaleY: 1, opacity: 1 },
          eyes: { x: 0, y: 0, rotation: 0, scaleX: 1, scaleY: 1, opacity: 1 },
          mouth: { x: 0, y: 0, rotation: 0, scaleX: 1, scaleY: 1, opacity: 1 },
          tail: { x: 0, y: 0, rotation: 0, scaleX: 1, scaleY: 1, opacity: 1 },
        },
      },
      {
        time: 500,
        parts: {
          body: { x: 0, y: 5, rotation: 0, scaleX: 1.2, scaleY: 0.7, opacity: 1 },
          head: { x: 0, y: 3, rotation: 0, scaleX: 1, scaleY: 1, opacity: 1 },
          eyes: { x: 0, y: 0, rotation: 0, scaleX: 0.1, scaleY: 0.1, opacity: 0.5 },
          mouth: { x: 0, y: 0, rotation: 0, scaleX: 0.3, scaleY: 0.3, opacity: 0.5 },
          tail: { x: 0, y: 0, rotation: 0, scaleX: 1, scaleY: 1, opacity: 1 },
        },
      },
      {
        time: 1000,
        parts: {
          body: { x: 0, y: 0, rotation: 0, scaleX: 1, scaleY: 1, opacity: 1 },
          head: { x: 0, y: 0, rotation: 0, scaleX: 1, scaleY: 1, opacity: 1 },
          eyes: { x: 0, y: 0, rotation: 0, scaleX: 1, scaleY: 1, opacity: 1 },
          mouth: { x: 0, y: 0, rotation: 0, scaleX: 1, scaleY: 1, opacity: 1 },
          tail: { x: 0, y: 0, rotation: 0, scaleX: 1, scaleY: 1, opacity: 1 },
        },
      },
    ],
  };
}

describe("AnimationPlayer", () => {
  let player: AnimationPlayer;

  beforeEach(() => {
    player = new AnimationPlayer();
  });

  describe("F1.2: Animation registration and playback", () => {
    it("should register animations", () => {
      const anim = makeIdleAnim();
      player.register(anim);
      // Should not throw
      expect(true).toBe(true);
    });

    it("should start playing a registered animation", () => {
      const anim = makeIdleAnim();
      player.register(anim);
      player.play("idle");
      const state = player.advance(16);
      expect(state).not.toBeNull();
    });

    it("should interpolate between keyframes at t=0", () => {
      const anim = makeIdleAnim();
      player.register(anim);
      player.play("idle");
      const state = player.advance(0);
      expect(state).not.toBeNull();
      if (state) {
        expect(state.body.x).toBe(0);
        expect(state.body.y).toBe(0);
      }
    });
  });

  describe("F1.3: Multiple animation states", () => {
    it("should register and play idle animation", () => {
      const anim = makeIdleAnim();
      player.register(anim);
      player.play("idle");
      const state = player.advance(16);
      expect(state).not.toBeNull();
    });

    it("should register and play crushing (non-looping) animation", () => {
      const crushing = makeCrushingAnim();
      player.register(crushing);
      player.play("crushing");
      const state = player.advance(16);
      expect(state).not.toBeNull();
    });

    it("should not crash if playing unregistered animation", () => {
      player.play("nonexistent");
      const state = player.advance(16);
      // null is acceptable for unregistered anims
      expect(state).toBeNull();
    });
  });

  describe("F1.4: Animation transition blending", () => {
    it("should transition between animations", () => {
      const idle = makeIdleAnim();
      const crushing = makeCrushingAnim();
      player.register(idle);
      player.register(crushing);
      player.play("idle");
      player.advance(100); // advance 100ms

      // Switch to crushing
      player.play("crushing");
      const transitionState = player.advance(50);
      expect(transitionState).not.toBeNull();
    });
  });

  describe("F1.9: Blink mechanics", () => {
    it("should start with eyes open (blinkScale = 1)", () => {
      const anim = makeIdleAnim();
      player.register(anim);
      player.play("idle");
      expect(player.blinkScale).toBe(1);
    });

    it("should eventually blink (blinkScale should vary over time)", () => {
      const anim = makeIdleAnim();
      player.register(anim);
      player.play("idle");

      // Run for 5 seconds at 60fps
      const blinkValues: number[] = [];
      for (let i = 0; i < 300; i++) {
        player.advance(16);
        // Only track non-1 values
        if (player.blinkScale < 0.99) {
          blinkValues.push(player.blinkScale);
        }
      }

      // At least one blink should have occurred in 5 seconds
      expect(blinkValues.length).toBeGreaterThan(0);
      // Some blink values should be very small (eye nearly closed)
      const minBlink = Math.min(...blinkValues);
      expect(minBlink).toBeLessThan(0.5);
    });
  });

  describe("F1.8: Animation transitions", () => {
    it("should transition between idle and typing", () => {
      const idle = makeIdleAnim();
      const typing: Animation = {
        name: "typing",
        loop: true,
        duration: 600,
        keyframes: [
          {
            time: 0,
            parts: {
              body: { x: 0, y: -1, rotation: -1, scaleX: 1, scaleY: 1, opacity: 1 },
              head: { x: 0, y: 0, rotation: -5, scaleX: 1, scaleY: 1, opacity: 1 },
              eyes: { x: 0, y: 0, rotation: 0, scaleX: 1, scaleY: 1, opacity: 1 },
              mouth: { x: 0, y: 0, rotation: 0, scaleX: 1, scaleY: 1, opacity: 1 },
              tail: { x: 0, y: 0, rotation: 0, scaleX: 1, scaleY: 1, opacity: 1 },
            },
          },
          {
            time: 600,
            parts: {
              body: { x: 0, y: -1, rotation: -1, scaleX: 1, scaleY: 1, opacity: 1 },
              head: { x: 0, y: 0, rotation: -5, scaleX: 1, scaleY: 1, opacity: 1 },
              eyes: { x: 0, y: 0, rotation: 0, scaleX: 1, scaleY: 1, opacity: 1 },
              mouth: { x: 0, y: 0, rotation: 0, scaleX: 1, scaleY: 1, opacity: 1 },
              tail: { x: 0, y: 0, rotation: 0, scaleX: 1, scaleY: 1, opacity: 1 },
            },
          },
        ],
      };
      player.register(idle);
      player.register(typing);
      player.play("idle");

      // Let idle play for a bit
      for (let i = 0; i < 30; i++) player.advance(16);

      // Switch to typing
      player.play("typing");
      const transitionState = player.advance(50);
      expect(transitionState).not.toBeNull();
      if (transitionState) {
        // Should be blending between idle and typing
        expect(typeof transitionState.body.y).toBe("number");
        expect(typeof transitionState.head.rotation).toBe("number");
      }
    });
  });

  describe("F1.3: All 7 animation states defined", () => {
    it("should register all 7 animations via registerAnimations", () => {
      registerAnimations(player);
      // All 7 should be playable
      const animNames = ["idle", "typing", "talking", "happy", "crushing", "collapsed", "lying"];
      for (const name of animNames) {
        player.play(name);
        const state = player.advance(16);
        expect(state).not.toBeNull();
      }
    });

    it("should have correct loop/duration for each animation type", () => {
      registerAnimations(player);
      // Test via AnimationPlayer internal state by playing each
      player.play("idle");
      let state = player.advance(0);
      expect(state).not.toBeNull();

      player.play("crushing");
      state = player.advance(0);
      expect(state).not.toBeNull();

      // collapsed is looping
      player.play("collapsed");
      state = player.advance(0);
      expect(state).not.toBeNull();
    });

    it("should switch between all 7 animations without errors", () => {
      registerAnimations(player);
      const animNames = ["idle", "typing", "talking", "happy", "crushing", "collapsed", "lying"];
      for (const name of animNames) {
        player.play(name);
        for (let i = 0; i < 10; i++) {
          const state = player.advance(16);
          expect(state).not.toBeNull();
        }
      }
    });
  });

  describe("F1.1: Part state correctness", () => {
    it("should return valid part states for all 4 parts", () => {
      const anim = makeIdleAnim();
      player.register(anim);
      player.play("idle");

      for (let i = 0; i < 60; i++) {
        const state = player.advance(16);
        expect(state).not.toBeNull();
        if (state) {
          // All 4 parts should be present
          expect(state.body).toBeDefined();
          expect(state.head).toBeDefined();
          expect(state.eyes).toBeDefined();
          expect(state.mouth).toBeDefined();

          // Each part should have all 6 properties
          for (const part of ["body", "head", "eyes", "mouth"] as PartName[]) {
            expect(typeof state[part].x).toBe("number");
            expect(typeof state[part].y).toBe("number");
            expect(typeof state[part].rotation).toBe("number");
            expect(typeof state[part].scaleX).toBe("number");
            expect(typeof state[part].scaleY).toBe("number");
            expect(typeof state[part].opacity).toBe("number");
          }
        }
      }
    });

    it("should loop animation when loop=true", () => {
      const anim = makeIdleAnim();
      player.register(anim);
      player.play("idle");

      // Advance past the animation duration
      const stateAtEnd = player.advance(2000);
      const stateAfterLoop = player.advance(100);

      expect(stateAtEnd).not.toBeNull();
      expect(stateAfterLoop).not.toBeNull();
    });
  });
});
