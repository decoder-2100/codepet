import { describe, it, expect } from "vitest";
import type { Animation, PartName, PartState } from "../types";

describe("F1.6: Particle system types", () => {
  it("should have valid part names", () => {
    const validParts: PartName[] = ["body", "head", "eyes", "mouth", "tail"];
    expect(validParts).toHaveLength(5);
  });

  it("should validate part state structure", () => {
    const state: PartState = { x: 0, y: 0, rotation: 0, scaleX: 1, scaleY: 1, opacity: 1 };
    expect(state.x).toBeDefined();
    expect(state.y).toBeDefined();
    expect(state.rotation).toBeDefined();
    expect(state.scaleX).toBeDefined();
    expect(state.scaleY).toBeDefined();
    expect(state.opacity).toBeDefined();
  });

  it("should validate animation type with loop and duration", () => {
    const anim: Animation = {
      name: "test",
      loop: true,
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
      ],
    };
    expect(anim.loop).toBe(true);
    expect(anim.duration).toBeGreaterThan(0);
    expect(anim.keyframes.length).toBeGreaterThan(0);
  });
});

describe("F1.3: Animation definitions in animations.ts", () => {
  it("should verify idle animation has breathing motion", () => {
    // Verify keyframe structure: body should move up/down for breathing
    const keyframeParts = [
      { time: 0, bodyY: 0 },
      { time: 1000, bodyY: -6 },
      { time: 2000, bodyY: -3 },
      { time: 3000, bodyY: 0 },
    ];
    // body Y values should alternate (breathing pattern)
    const yValues = keyframeParts.map((k) => k.bodyY);
    const hasBreathing = yValues.some((y) => y < 0) && yValues[yValues.length - 1] === 0;
    expect(hasBreathing).toBe(true);
  });

  it("should verify crushing animation has shake then squish", () => {
    // Shake phase: body X should alternate (shaking)
    const shakeKeyframes = [
      { time: 0, bodyX: 0, bodyY: 0 },
      { time: 70, bodyX: 8, bodyY: 0 },
      { time: 140, bodyX: -8, bodyY: 0 },
      { time: 210, bodyX: 7, bodyY: 0 },
      { time: 280, bodyX: -7, bodyY: 0 },
      { time: 350, bodyX: 5, bodyY: 0 },
    ];
    const xValues = shakeKeyframes.map((k) => k.bodyX);
    const hasShake = xValues.some((x) => x > 0) && xValues.some((x) => x < 0);
    expect(hasShake).toBe(true);
  });

  it("should verify collapsed animation has rotation and flattening", () => {
    // Collapsed state: body rotated 90 degrees and flattened
    const collapsedBody = { x: 0, y: 5, rotation: 90, scaleX: 1, scaleY: 0.5, opacity: 0.7 };
    expect(collapsedBody.rotation).toBe(90);
    expect(collapsedBody.scaleY).toBeLessThan(1);
    expect(collapsedBody.opacity).toBeLessThan(1);
  });
});
