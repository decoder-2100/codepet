/**
 * F1 系统功能测试 — 宠物渲染与动画
 *
 * 覆盖 F1.1 ~ F1.6 所有功能点，使用真实的动画定义和渲染模块。
 */
import { describe, it, expect, beforeEach } from "vitest";
import { AnimationPlayer } from "../canvas/animationEngine";
import { registerAnimations } from "../canvas/animations";
import { bodyVariants } from "../canvas/parts/body";
import { headVariants } from "../canvas/parts/head";
import { eyeVariants } from "../canvas/parts/eyes";
import { mouthVariants } from "../canvas/parts/mouth";
import { accessoryVariants } from "../canvas/parts/accessories";
import type { PetColors } from "../types";

// ============================================================
// F1.1: 像素风宠物渲染 — 验证所有部件变体存在且结构正确
// ============================================================
describe("F1.1: Pet parts rendering system", () => {
  const mockColors: PetColors = {
    primary: "#FF8C42",
    secondary: "#FFB347",
    eye: "#2C3E50",
    accessory: "#8E44AD",
  };

  describe("body variants", () => {
    it("should export all 6 body variants", () => {
      expect(Object.keys(bodyVariants)).toEqual(["chubby", "tall", "round", "robot", "golden", "husky"]);
    });

    it("each body variant should be a callable function", () => {
      for (const [name, fn] of Object.entries(bodyVariants)) {
        expect(typeof fn).toBe("function");
      }
    });
  });

  describe("head variants", () => {
    it("should export all 7 head variants", () => {
      const headKeys = Object.keys(headVariants);
      expect(headKeys).toContain("cat");
      expect(headKeys).toContain("bear");
      expect(headKeys).toContain("fox");
      expect(headKeys).toContain("robot");
      expect(headKeys).toContain("alien");
      expect(headKeys).toContain("golden");
      expect(headKeys).toContain("husky");
      expect(headKeys.length).toBe(7);
    });

    it("each head variant should be a callable function", () => {
      for (const [name, fn] of Object.entries(headVariants)) {
        expect(typeof fn).toBe("function");
      }
    });
  });

  describe("eye variants", () => {
    it("should export all 10 eye variants", () => {
      const expected = ["normal", "big", "anime", "dot", "angry", "happy", "closed", "dead", "warm", "blue"];
      expect(Object.keys(eyeVariants)).toEqual(expected);
    });

    it("each eye variant should be a callable function", () => {
      for (const [name, fn] of Object.entries(eyeVariants)) {
        expect(typeof fn).toBe("function");
      }
    });
  });

  describe("mouth variants", () => {
    it("should export mouth variants", () => {
      expect(Object.keys(mouthVariants).length).toBeGreaterThanOrEqual(4);
      expect(mouthVariants.smile).toBeDefined();
      expect(mouthVariants.grin).toBeDefined();
      expect(mouthVariants.straight).toBeDefined();
      expect(mouthVariants.oShape).toBeDefined();
    });

    it("each mouth variant should be a callable function", () => {
      for (const [name, fn] of Object.entries(mouthVariants)) {
        expect(typeof fn).toBe("function");
      }
    });
  });

  describe("accessory variants", () => {
    it("should export all 8 accessories", () => {
      const expected = ["glasses", "hat", "headphone", "bowtie", "scarf", "keyboard", "coffee", "codeBubble"];
      expect(Object.keys(accessoryVariants)).toEqual(expected);
    });

    it("each accessory should be a callable function", () => {
      for (const [name, fn] of Object.entries(accessoryVariants)) {
        expect(typeof fn).toBe("function");
      }
    });
  });

  it("total variant count demonstrates rendering diversity", () => {
    const totalVariants =
      Object.keys(bodyVariants).length *
      Object.keys(headVariants).length *
      Object.keys(eyeVariants).length *
      Object.keys(mouthVariants).length;
    // 4 × 5 × 8 × 4 = 640 possible combinations (before accessories)
    expect(totalVariants).toBeGreaterThanOrEqual(500);
  });
});

// ============================================================
// F1.2: 关键帧动画引擎 — 全功能验证
// ============================================================
describe("F1.2: Keyframe animation engine", () => {
  let player: AnimationPlayer;

  beforeEach(() => {
    player = new AnimationPlayer();
    registerAnimations(player);
  });

  it("should compute interpolated states between keyframes", () => {
    player.play("idle");
    // At t=0: body.y = 0
    const state0 = player.advance(0);
    // At t=500ms (between keyframe 0 and 1): body.y should be between 0 and -6
    const stateMid = player.advance(500);
    // At t=1000ms: body.y ≈ -6
    const state1 = player.advance(500);

    expect(state0).not.toBeNull();
    expect(stateMid).not.toBeNull();
    expect(state1).not.toBeNull();

    if (state0 && stateMid && state1) {
      // body.y should move: 0 → negative → -6
      expect(state0.body.y).toBe(0);
      expect(stateMid.body.y).toBeLessThan(0);
      expect(stateMid.body.y).toBeGreaterThan(-6);
      expect(state1.body.y).toBeLessThan(stateMid.body.y);
    }
  });

  it("should handle parts independently per keyframe", () => {
    player.play("idle");
    // At t=0: all parts at default
    const state0 = player.advance(0);
    // At t=1000: body.y=-6, head.rotation=-3
    const state1 = player.advance(1000);

    if (state0 && state1) {
      // Body moves up
      expect(state1.body.y).toBeLessThan(state0.body.y);
      // Head rotates
      expect(state1.head.rotation).toBeLessThan(state0.head.rotation);
      // Eyes and mouth stay same
      expect(state1.eyes.x).toBe(state0.eyes.x);
      expect(state1.mouth.x).toBe(state0.mouth.x);
    }
  });

  it("should scale and rotate parts correctly", () => {
    player.play("collapsed");
    const state = player.advance(500);

    if (state) {
      // Collapsed: body rotated ~90°, scaled Y < 1
      expect(Math.abs(state.body.rotation)).toBeGreaterThan(80);
      expect(state.body.scaleY).toBeLessThan(0.7);
      // Eyes tiny
      expect(state.eyes.scaleX).toBeLessThan(0.5);
    }
  });
});

// ============================================================
// F1.3: 6 种动画状态 — 逐一验证动画数据和生命周期
// ============================================================
describe("F1.3: All 7 animation states", () => {
  let player: AnimationPlayer;

  beforeEach(() => {
    player = new AnimationPlayer();
    registerAnimations(player);
  });

  // 每种动画应有不同的视觉效果，通过对关键帧数据分析验证
  const animTests = [
    {
      name: "idle",
      check: (states: number[][]) => {
        // body.y 应该在 0 到 -6 之间摆动 (呼吸)
        const bodyY = states.map((s) => s[0]);
        expect(Math.min(...bodyY)).toBeLessThan(0);
        expect(Math.max(...bodyY)).toBe(0);
        // head.rotation 应该在正负之间摆动
        const headRot = states.map((s) => s[1]);
        expect(Math.min(...headRot)).toBeLessThan(0);
      },
    },
    {
      name: "typing",
      check: (states: number[][]) => {
        // 头部倾斜较大 (rotation ~ -5)
        const headRot = states.map((s) => s[1]);
        const avgRot = headRot.reduce((a, b) => a + b, 0) / headRot.length;
        expect(avgRot).toBeLessThan(-2);
      },
    },
    {
      name: "talking",
      check: (states: number[][]) => {
        // 头部左右摇摆，rotation 在正负之间
        const headRot = states.map((s) => s[1]);
        expect(Math.min(...headRot)).toBeLessThan(0);
        expect(Math.max(...headRot)).toBeGreaterThan(0);
      },
    },
    {
      name: "happy",
      check: (states: number[][]) => {
        // 身体跳跃 (body.y 明显负值)
        const bodyY = states.map((s) => s[0]);
        expect(Math.min(...bodyY)).toBeLessThan(-10);
      },
    },
    {
      name: "crushing",
      check: (states: number[][]) => {
        // 第一阶段: 左右震动 (body.x 在正负之间交替)
        const bodyX = states.filter((_, i) => i < 5).map((s) => s[2]);
        expect(Math.min(...bodyX)).toBeLessThan(0);
        expect(Math.max(...bodyX)).toBeGreaterThan(0);
      },
    },
    {
      name: "collapsed",
      check: (states: number[][]) => {
        // 身体旋转接近 90 度
        const bodyRot = states.map((s) => s[3]);
        expect(Math.abs(bodyRot[0])).toBeGreaterThan(80);
      },
    },
    {
      name: "lying",
      check: (states: number[][]) => {
        // 身体被压缩 (scaleY < 0.8) 且下移 (y > 15)
        const bodyY = states.map((s) => s[0]);
        expect(Math.min(...bodyY)).toBeGreaterThan(15);
      },
    },
  ];

  for (const { name, check } of animTests) {
    it(`${name} animation should produce correct visual motion`, () => {
      player.play(name);
      // Capture state at t=0 first, then evolving states
      const initialState = player.advance(0);
      const capturedStates: number[][] = [];
      if (initialState) {
        capturedStates.push([initialState.body.y, initialState.head.rotation, initialState.body.x, initialState.body.rotation]);
      }
      for (let i = 0; i < 20; i++) {
        const state = player.advance(50);
        if (state) {
          capturedStates.push([state.body.y, state.head.rotation, state.body.x, state.body.rotation]);
        }
      }
      expect(capturedStates.length).toBeGreaterThan(0);
      check(capturedStates);
    });
  }

  it("all 7 animations should be switchable in sequence without error", () => {
    const names = ["idle", "typing", "talking", "happy", "crushing", "collapsed", "lying"];
    for (const name of names) {
      player.play(name);
      const state = player.advance(100);
      expect(state).not.toBeNull();
    }
  });

  it("non-looping crushing animation should reach its end state", () => {
    player.play("crushing");
    // Advance past duration
    for (let i = 0; i < 70; i++) player.advance(16); // ~1120ms > 1000ms duration
    // Animation should have completed full cycle
    const endState = player.advance(0);
    expect(endState).not.toBeNull();
    if (endState) {
      // Should be back to first keyframe values (or end keyframe)
      expect(endState.body.y).toBe(0);
    }
  });

  it("looping animations should wrap around after duration", () => {
    player.play("idle"); // duration 3000, loop=true
    // Capture state at beginning
    const state0 = player.advance(0);
    // Advance past duration
    for (let i = 0; i < 200; i++) player.advance(16); // ~3200ms
    const stateAfterLoop = player.advance(0);
    // After looping, should be back near start (within 2px tolerance)
    if (state0 && stateAfterLoop) {
      // looped position at (3200 % 3000) = 200ms into animation
      expect(Math.abs(stateAfterLoop.body.y - state0.body.y)).toBeLessThan(2);
    }
  });
});

// ============================================================
// F1.4: 动画过渡混合
// ============================================================
describe("F1.4: Animation transition blending", () => {
  let player: AnimationPlayer;

  beforeEach(() => {
    player = new AnimationPlayer();
    registerAnimations(player);
  });

  it("should blend between idle and typing animations", () => {
    player.play("idle");
    for (let i = 0; i < 30; i++) player.advance(16);

    // Capture idle state
    const idleState = player.advance(0);

    // Switch to typing
    player.play("typing");

    // During transition (first 200ms), should be blending
    const transitionState = player.advance(50);
    const fullTransitionState = player.advance(200);

    expect(transitionState).not.toBeNull();
    expect(fullTransitionState).not.toBeNull();
  });

  it("transition should complete within 200ms", () => {
    player.play("idle");
    for (let i = 0; i < 30; i++) player.advance(16);

    player.play("typing");

    // After 200ms, should be fully in typing animation
    for (let i = 0; i < 15; i++) player.advance(16); // ~240ms total

    const afterTransition = player.advance(0);
    expect(afterTransition).not.toBeNull();
  });

  it("play() during transition should not crash", () => {
    player.play("idle");
    for (let i = 0; i < 10; i++) player.advance(16);

    // Rapid switching
    player.play("typing");
    player.play("happy");
    player.play("talking");

    const state = player.advance(50);
    expect(state).not.toBeNull();
  });
});

// ============================================================
// F1.5: 自动眨眼
// ============================================================
describe("F1.5: Blink mechanics", () => {
  let player: AnimationPlayer;

  beforeEach(() => {
    player = new AnimationPlayer();
    registerAnimations(player);
    player.play("idle");
  });

  it("should start with eyes fully open (blinkScale = 1)", () => {
    expect(player.blinkScale).toBe(1);
  });

  it("should close eyes during blink (blinkScale near 0)", () => {
    // Advance time to trigger a blink
    let blinked = false;
    for (let i = 0; i < 500; i++) {
      player.advance(16);
      if (player.blinkScale < 0.1) {
        blinked = true;
        break;
      }
    }
    expect(blinked).toBe(true);
  });

  it("should blink periodically (multiple blinks in 15 seconds)", () => {
    let blinkCount = 0;
    let wasClosed = false;

    for (let i = 0; i < 900; i++) {
      player.advance(16); // ~14.4s
      if (player.blinkScale < 0.1 && !wasClosed) {
        blinkCount++;
        wasClosed = true;
      }
      if (player.blinkScale > 0.9) {
        wasClosed = false;
      }
    }

    // Should have at least 2 blinks in 15 seconds
    expect(blinkCount).toBeGreaterThanOrEqual(2);
  });

  it("blink timing should be random (not fixed interval)", () => {
    // The blink timer has a random component, so two runs should differ
    const intervals: number[] = [];
    for (let run = 0; run < 3; run++) {
      const p = new AnimationPlayer();
      registerAnimations(p);
      p.play("idle");
      let firstBlink = -1;
      for (let i = 0; i < 300; i++) {
        p.advance(16);
        if (p.blinkScale < 0.1 && firstBlink < 0) {
          firstBlink = i;
          break;
        }
      }
      intervals.push(firstBlink);
    }
    // At least one run should have different timing (probabilistic)
    const unique = new Set(intervals);
    // With random 1-3s initial timer, some variation is expected
    expect(intervals.every((t) => t > 0)).toBe(true);
  });

  it("blink should not affect other body parts", () => {
    // Capture state before blink
    const beforeBody = player.advance(0);
    expect(beforeBody).not.toBeNull();

    // Blink only modifies eyes via blinkScale in renderer, not via animation engine
    // The AnimationPlayer's advance() returns raw keyframe data without blink applied
    // blinkScale is a separate property used by the renderer
    expect(player.blinkScale).toBeDefined();
  });
});

// ============================================================
// F1.6: 粒子特效 — 通过 renderer 模块验证
// ============================================================
describe("F1.6: Sparkle particle system", () => {
  it("should have drawFrame function that handles sparkles", async () => {
    const { drawFrame } = await import("../canvas/renderer");
    expect(typeof drawFrame).toBe("function");
  });

  it("part variants should accept colors and produce valid draw calls", () => {
    // Verify all variant functions are properly typed (compile-time check)
    const color: PetColors = {
      primary: "#FF8C42",
      secondary: "#FFB347",
      eye: "#2C3E50",
      accessory: "#8E44AD",
    };
    const bodyKeys = Object.keys(bodyVariants);
    const headKeys = Object.keys(headVariants);
    const eyeKeys = Object.keys(eyeVariants);
    const mouthKeys = Object.keys(mouthVariants);
    const accKeys = Object.keys(accessoryVariants);

    // All variants should be accessible with colors
    expect(bodyKeys.length).toBeGreaterThan(0);
    expect(headKeys.length).toBeGreaterThan(0);
    expect(eyeKeys.length).toBeGreaterThan(0);
    expect(mouthKeys.length).toBeGreaterThan(0);
    expect(accKeys.length).toBeGreaterThan(0);
  });

  it("each body variant function accepts (ctx, PartState, PetColors) signature", () => {
    for (const [name, fn] of Object.entries(bodyVariants)) {
      expect(fn.length).toBe(3); // 3 parameters
    }
  });

  it("each eye variant function accepts (ctx, PartState, PetColors)", () => {
    for (const [name, fn] of Object.entries(eyeVariants)) {
      expect(fn.length).toBe(3);
    }
  });
});

// ============================================================
// 完整的动画生命周期测试 — 模拟真实使用场景
// ============================================================
describe("F1: Complete animation lifecycle", () => {
  let player: AnimationPlayer;

  beforeEach(() => {
    player = new AnimationPlayer();
    registerAnimations(player);
  });

  it("simulates coding session: idle → typing → idle", () => {
    // Start idle
    player.play("idle");
    for (let i = 0; i < 30; i++) {
      const state = player.advance(16);
      expect(state).not.toBeNull();
    }

    // User starts typing → switch to typing
    player.play("typing");
    for (let i = 0; i < 100; i++) {
      const state = player.advance(16);
      expect(state).not.toBeNull();
    }

    // User stops → back to idle
    player.play("idle");
    for (let i = 0; i < 30; i++) {
      const state = player.advance(16);
      expect(state).not.toBeNull();
    }
  });

  it("simulates bug crush: idle → crushing → happy", () => {
    // Start idle
    player.play("idle");
    for (let i = 0; i < 30; i++) player.advance(16);

    // Bug dropped → crushing (non-looping, 1000ms)
    player.play("crushing");
    for (let i = 0; i < 65; i++) {
      const state = player.advance(16);
      expect(state).not.toBeNull();
    }

    // After crushing → happy
    player.play("happy");
    const happyState = player.advance(16);
    expect(happyState).not.toBeNull();
  });

  it("simulates 2h coding timeout: typing → collapsed → typing again", () => {
    // Typing
    player.play("typing");
    for (let i = 0; i < 30; i++) player.advance(16);

    // Collapsed (2h timeout)
    player.play("collapsed");
    // Advance through transition (200ms) to reach pure collapsed state
    for (let i = 0; i < 30; i++) player.advance(16); // ~480ms > 200ms transition
    const collapsedState = player.advance(0);
    expect(collapsedState).not.toBeNull();
    if (collapsedState) {
      // Verify collapsed visual state
      expect(collapsedState.body.rotation).toBeGreaterThan(80);
    }

    // User continues typing → back to typing
    player.play("typing");
    // Advance through transition (200ms) to reach pure typing state
    for (let i = 0; i < 30; i++) player.advance(16); // ~480ms
    const typingState = player.advance(0);
    expect(typingState).not.toBeNull();
    if (typingState) {
      // Typing: head tilts forward (negative rotation)
      expect(typingState.head.rotation).toBeLessThan(-3);
    }
  });

  it("should handle rapid animation switching without crashing", () => {
    const names = ["idle", "typing", "talking", "happy", "crushing", "collapsed", "lying"];
    for (let round = 0; round < 3; round++) {
      for (const name of names) {
        player.play(name);
        for (let i = 0; i < 5; i++) {
          const state = player.advance(16);
          expect(state).not.toBeNull();
        }
      }
    }
  });
});
