import { describe, it, expect } from "vitest";
import { Sound } from "../utils/sound";

describe("F7.8: Sound effects", () => {
  it("should have all sound methods defined", () => {
    expect(Sound.click).toBeDefined();
    expect(Sound.crush).toBeDefined();
    expect(Sound.message).toBeDefined();
    expect(Sound.typing).toBeDefined();
    expect(Sound.notification).toBeDefined();
  });

  it("should be callable without throwing", () => {
    expect(() => Sound.click()).not.toThrow();
    expect(() => Sound.crush()).not.toThrow();
    expect(() => Sound.message()).not.toThrow();
    expect(() => Sound.typing()).not.toThrow();
    expect(() => Sound.notification()).not.toThrow();
  });
});
