import { describe, expect, it } from "vitest";
import { label } from "../src/builder";

describe("Ellipse element", () => {
  it("generates TSC ELLIPSE", () => {
    const output = label({ width: 40, height: 30 })
      .ellipse({ x: 50, y: 50, width: 100, height: 60, thickness: 2 })
      .toTSC();
    expect(output).toContain("ELLIPSE 50,50,100,60,2");
  });

  it("renders in preview as SVG ellipse", () => {
    const svg = label({ width: 40, height: 30 })
      .ellipse({ x: 50, y: 50, width: 100, height: 60, thickness: 2 })
      .toPreview();
    expect(svg).toContain("<ellipse");
    expect(svg).toContain('rx="50"');
    expect(svg).toContain('ry="30"');
  });
});

describe("Reverse element", () => {
  it("generates TSC REVERSE", () => {
    const output = label({ width: 40, height: 30 })
      .reverse({ x: 10, y: 10, width: 200, height: 30 })
      .toTSC();
    expect(output).toContain("REVERSE 10,10,200,30");
  });

  it("renders in preview as black rect", () => {
    const svg = label({ width: 40, height: 30 })
      .reverse({ x: 10, y: 10, width: 200, height: 30 })
      .toPreview();
    expect(svg).toContain('fill="#000"');
    expect(svg).toContain('width="200"');
  });
});

describe("Erase element", () => {
  it("generates TSC ERASE", () => {
    const output = label({ width: 40, height: 30 })
      .erase({ x: 10, y: 10, width: 50, height: 50 })
      .toTSC();
    expect(output).toContain("ERASE 10,10,50,50");
  });

  it("renders in preview as white rect", () => {
    const svg = label({ width: 40, height: 30 })
      .erase({ x: 10, y: 10, width: 50, height: 50 })
      .toPreview();
    expect(svg).toContain('fill="#fff"');
  });
});

describe("All compilers handle new elements without error", () => {
  const b = () =>
    label({ width: 40, height: 30 })
      .ellipse({ x: 50, y: 50, width: 100, height: 60 })
      .reverse({ x: 10, y: 10, width: 200, height: 30 })
      .erase({ x: 10, y: 10, width: 50, height: 50 });

  it("TSC", () => {
    expect(b().toTSC()).toContain("ELLIPSE");
  });
  it("ZPL", () => {
    expect(() => b().toZPL()).not.toThrow();
  });
  it("EPL", () => {
    expect(() => b().toEPL()).not.toThrow();
  });
  it("CPCL", () => {
    expect(() => b().toCPCL()).not.toThrow();
  });
  it("DPL", () => {
    expect(() => b().toDPL()).not.toThrow();
  });
  it("SBPL", () => {
    expect(() => b().toSBPL()).not.toThrow();
  });
  it("IPL", () => {
    expect(() => b().toIPL()).not.toThrow();
  });
  it("ESC/POS", () => {
    expect(() => b().toESCPOS()).not.toThrow();
  });
  it("Star PRNT", () => {
    expect(() => b().toStarPRNT()).not.toThrow();
  });
  it("Preview", () => {
    expect(b().toPreview()).toContain("<ellipse");
  });
});
