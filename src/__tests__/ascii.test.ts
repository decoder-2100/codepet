import { describe, it, expect } from "vitest";
import { getCrushAscii, getRandomRoast, getRandomCompliment, FALLBACK_ROASTS } from "../canvas/ascii";

describe("F4.4: ASCII fallback for Bug Crushing", () => {
  it("should return a formatted ASCII crush report", () => {
    const error = "TypeError: Cannot read property 'foo' of undefined";
    const result = getCrushAscii(error);
    expect(result).toContain("🐛 Bug 粉碎报告");
    expect(result).toContain("TypeError: Cannot read propert");
    expect(result).toContain("已粉碎");
    expect(result).toContain("重启试试");
  });

  it("should truncate very long error messages to 30 chars", () => {
    const longError = "This is a very long error message that should be truncated correctly in the ASCII report";
    const result = getCrushAscii(longError);
    // 30 chars with "..." appended
    expect(result).toContain("This is a very long error mess...");
    expect(result).not.toContain("correctly");
  });

  it("should handle empty error text", () => {
    const result = getCrushAscii("");
    const result2 = getCrushAscii("   ");
    expect(result).toContain("已粉碎");
    expect(result2).toContain("已粉碎");
  });

  it("should handle multiline error text by replacing newlines with spaces", () => {
    const multiline = "Line1 Error\n  at file.ts:10\n  at another.ts:20";
    const result = getCrushAscii(multiline);
    // Newlines are replaced with spaces, then truncated to 30 chars + "..."
    expect(result).toContain("Line1 Error   at file.ts:10   ");
    expect(result).not.toContain("another.ts");
  });
});

describe("F4.6: Fallback roast library", () => {
  it("should have at least 10 roasts in the library", () => {
    expect(FALLBACK_ROASTS.length).toBeGreaterThanOrEqual(10);
  });

  it("should return a random roast", () => {
    const roast = getRandomRoast();
    expect(typeof roast).toBe("string");
    expect(roast.length).toBeGreaterThan(0);
  });

  it("should return different roasts on multiple calls (probabilistic)", () => {
    const results = new Set<string>();
    for (let i = 0; i < 20; i++) {
      results.add(getRandomRoast());
    }
    // With 10+ roasts and 20 calls, we should see at least 3 unique ones
    // (very unlikely to get the same one 20 times)
    expect(results.size).toBeGreaterThanOrEqual(3);
  });

  it("should contain Chinese technical humor", () => {
    const allChinese = FALLBACK_ROASTS.every((r) => /[一-鿿]/.test(r));
    expect(allChinese).toBe(true);
  });
});

describe("F4.7: Compliment library", () => {
  it("should return a non-empty compliment string", () => {
    const c = getRandomCompliment();
    expect(typeof c).toBe("string");
    expect(c.length).toBeGreaterThan(0);
  });

  it("should return different compliments on multiple calls", () => {
    const results = new Set<string>();
    for (let i = 0; i < 20; i++) {
      results.add(getRandomCompliment());
    }
    expect(results.size).toBeGreaterThanOrEqual(3);
  });

  it("should contain Chinese text", () => {
    for (let i = 0; i < 10; i++) {
      const c = getRandomCompliment();
      expect(/[一-鿿]/.test(c)).toBe(true);
    }
  });
});
