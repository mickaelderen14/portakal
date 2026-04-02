import { describe, expect, it } from "vitest";
import { convert } from "../src/convert";

describe("convert — cross-compilation", () => {
  const tscCode = `SIZE 40 mm,30 mm
GAP 3 mm,0 mm
CLS
TEXT 10,10,"2",0,2,2,"Hello World"
BOX 5,5,315,235,2
PRINT 1`;

  it("TSC → ZPL", () => {
    const result = convert(tscCode, "tsc", "zpl");
    expect(typeof result.output).toBe("string");
    const output = result.output as string;
    expect(output).toContain("^XA");
    expect(output).toContain("^FDHello World^FS");
    expect(output).toContain("^XZ");
  });

  it("TSC → EPL", () => {
    const result = convert(tscCode, "tsc", "epl");
    const output = result.output as string;
    expect(output).toContain("N");
    expect(output).toContain('"Hello World"');
    expect(output).toContain("P1");
  });

  it("TSC → CPCL", () => {
    const result = convert(tscCode, "tsc", "cpcl");
    const output = result.output as string;
    expect(output).toContain("! 0 203 203");
    expect(output).toContain("Hello World");
    expect(output).toContain("PRINT");
  });

  it("TSC → ESC/POS (binary)", () => {
    const result = convert(tscCode, "tsc", "escpos");
    expect(result.output).toBeInstanceOf(Uint8Array);
    const bytes = result.output as Uint8Array;
    expect(bytes[0]).toBe(0x1b); // ESC
    expect(bytes[1]).toBe(0x40); // @
  });

  it("TSC → DPL", () => {
    const result = convert(tscCode, "tsc", "dpl");
    expect(typeof result.output).toBe("string");
    expect(result.output as string).toContain("Hello World");
  });

  it("TSC → Star PRNT (binary)", () => {
    const result = convert(tscCode, "tsc", "starprnt");
    expect(result.output).toBeInstanceOf(Uint8Array);
  });

  it("ZPL → TSC", () => {
    const zplCode = "^XA^PW320^LL240^FO10,10^A0N,30,30^FDHello ZPL^FS^XZ";
    const result = convert(zplCode, "zpl", "tsc");
    const output = result.output as string;
    expect(output).toContain("SIZE");
    expect(output).toContain('"Hello ZPL"');
    expect(output).toContain("PRINT");
  });

  it("preserves elements through conversion", () => {
    const result = convert(tscCode, "tsc", "zpl");
    expect(result.elements.length).toBeGreaterThanOrEqual(1);
    expect(result.widthDots).toBe(320);
    expect(result.heightDots).toBe(240);
  });

  it("EPL → TSC", () => {
    const eplCode = 'N\nq320\nQ240,24\nA10,10,0,2,2,2,N,"Hello EPL"\nP1';
    const result = convert(eplCode, "epl", "tsc");
    expect(result.output as string).toContain('"Hello EPL"');
  });
});
