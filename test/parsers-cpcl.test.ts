import { describe, expect, it } from "vitest";
import { parseCPCL } from "../src/parsers/cpcl";

describe("CPCL Parser", () => {
  it("parses session header", () => {
    const r = parseCPCL("! 0 200 200 406 1");
    expect(r.dpi).toBe(200);
    expect(r.heightDots).toBe(406);
  });

  it("parses TEXT with data on next line", () => {
    const r = parseCPCL("! 0 200 200 400 1\nTEXT 4 0 10 20\nHello CPCL");
    expect(r.elements).toHaveLength(1);
    if (r.elements[0].type === "text") {
      expect(r.elements[0].content).toBe("Hello CPCL");
      expect(r.elements[0].options.x).toBe(10);
      expect(r.elements[0].options.y).toBe(20);
    }
  });

  it("parses TEXT90", () => {
    const r = parseCPCL("! 0 200 200 400 1\nTEXT90 2 0 10 20\nRotated");
    expect(r.elements).toHaveLength(1);
    if (r.elements[0].type === "text") {
      expect(r.elements[0].content).toBe("Rotated");
    }
  });

  it("parses BOX", () => {
    const r = parseCPCL("! 0 200 200 400 1\nBOX 5 5 305 205 2");
    expect(r.elements).toHaveLength(1);
    if (r.elements[0].type === "box") {
      expect(r.elements[0].options.x).toBe(5);
      expect(r.elements[0].options.width).toBe(300);
      expect(r.elements[0].options.thickness).toBe(2);
    }
  });

  it("parses LINE", () => {
    const r = parseCPCL("! 0 200 200 400 1\nLINE 10 50 300 50 2");
    expect(r.elements).toHaveLength(1);
    if (r.elements[0].type === "line") {
      expect(r.elements[0].options.x1).toBe(10);
      expect(r.elements[0].options.x2).toBe(300);
      expect(r.elements[0].options.thickness).toBe(2);
    }
  });

  it("parses PAGE-WIDTH", () => {
    const r = parseCPCL("! 0 200 200 400 1\nPAGE-WIDTH 576");
    expect(r.widthDots).toBe(576);
  });

  it("parses full label", () => {
    const r = parseCPCL(`! 0 203 203 240 1
PAGE-WIDTH 320
TEXT 2 0 10 10
ACME Corp
TEXT 2 0 10 35
SKU: 123
BOX 5 5 315 235 2
LINE 5 55 315 55 1
PRINT`);
    expect(r.heightDots).toBe(240);
    expect(r.widthDots).toBe(320);
    expect(r.elements.length).toBeGreaterThanOrEqual(3);
  });
});
