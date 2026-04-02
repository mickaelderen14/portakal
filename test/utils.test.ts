import { describe, expect, it } from "vitest";
import { toDots } from "../src/utils";

describe("toDots", () => {
  it("converts mm to dots at 203 DPI", () => {
    expect(toDots(25.4, "mm", 203)).toBe(203);
    expect(toDots(1, "mm", 203)).toBe(8);
    expect(toDots(40, "mm", 203)).toBe(320);
    expect(toDots(30, "mm", 203)).toBe(240);
    expect(toDots(0, "mm", 203)).toBe(0);
  });

  it("converts mm to dots at 300 DPI", () => {
    expect(toDots(25.4, "mm", 300)).toBe(300);
    expect(toDots(1, "mm", 300)).toBe(12);
    expect(toDots(40, "mm", 300)).toBe(472);
  });

  it("converts inches to dots", () => {
    expect(toDots(1, "inch", 203)).toBe(203);
    expect(toDots(4, "inch", 203)).toBe(812);
    expect(toDots(2, "inch", 300)).toBe(600);
  });

  it("passes dots through unchanged", () => {
    expect(toDots(100, "dot", 203)).toBe(100);
    expect(toDots(576, "dot", 300)).toBe(576);
  });

  it("rounds to nearest integer", () => {
    expect(toDots(10, "mm", 203)).toBe(80);
    expect(toDots(3, "mm", 203)).toBe(24);
  });
});
