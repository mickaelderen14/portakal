import { describe, expect, it } from "vitest";
import { validate } from "../src/validate";

describe("validate — TSC", () => {
  it("valid TSC label passes", () => {
    const r = validate(
      'SIZE 40 mm,30 mm\nGAP 3 mm,0 mm\nCLS\nTEXT 10,10,"2",0,2,2,"Hello"\nPRINT 1',
      "tsc",
    );
    expect(r.valid).toBe(true);
    expect(r.errors).toBe(0);
  });

  it("warns when SIZE is not first", () => {
    const r = validate('CLS\nSIZE 40 mm,30 mm\nTEXT 10,10,"2",0,1,1,"Hi"\nPRINT 1', "tsc");
    expect(r.issues.some((i) => i.message.includes("SIZE should be the first"))).toBe(true);
  });

  it("errors when CLS missing before elements", () => {
    const r = validate('SIZE 40 mm,30 mm\nTEXT 10,10,"2",0,1,1,"No CLS"\nPRINT 1', "tsc");
    expect(r.errors).toBeGreaterThan(0);
    expect(r.issues.some((i) => i.message.includes("CLS must appear before"))).toBe(true);
  });

  it("warns when PRINT missing", () => {
    const r = validate('SIZE 40 mm,30 mm\nCLS\nTEXT 10,10,"2",0,1,1,"No print"', "tsc");
    expect(r.issues.some((i) => i.message.includes("No PRINT"))).toBe(true);
  });

  it("errors on DENSITY out of range", () => {
    const r = validate("SIZE 40 mm,30 mm\nDENSITY 20\nCLS\nPRINT 1", "tsc");
    expect(r.issues.some((i) => i.message.includes("DENSITY value 20 out of range"))).toBe(true);
  });

  it("warns on unknown commands", () => {
    const r = validate("SIZE 40 mm,30 mm\nCLS\nFOOBAR\nPRINT 1", "tsc");
    expect(r.issues.some((i) => i.message.includes("Unrecognized command"))).toBe(true);
  });

  it("errors on empty input", () => {
    const r = validate("", "tsc");
    expect(r.valid).toBe(false);
    expect(r.errors).toBe(1);
  });
});

describe("validate — ZPL", () => {
  it("valid ZPL passes", () => {
    const r = validate("^XA^FO10,10^A0N,30,30^FDHello^FS^XZ", "zpl");
    expect(r.valid).toBe(true);
  });

  it("errors when ^XA missing", () => {
    const r = validate("^FO10,10^FDHello^FS^XZ", "zpl");
    expect(r.errors).toBeGreaterThan(0);
    expect(r.issues.some((i) => i.message.includes("^XA"))).toBe(true);
  });

  it("errors when ^XZ missing", () => {
    const r = validate("^XA^FO10,10^FDHello^FS", "zpl");
    expect(r.errors).toBeGreaterThan(0);
    expect(r.issues.some((i) => i.message.includes("^XZ"))).toBe(true);
  });

  it("warns on ^FD without ^FO", () => {
    const r = validate("^XA^FDNo origin^FS^XZ", "zpl");
    expect(r.issues.some((i) => i.message.includes("^FD without preceding ^FO"))).toBe(true);
  });

  it("errors on ^PW out of range", () => {
    const r = validate("^XA^PW0^XZ", "zpl");
    expect(r.issues.some((i) => i.message.includes("^PW value"))).toBe(true);
  });
});

describe("validate — other languages", () => {
  it("provides info message for unsupported validation", () => {
    const r = validate("some code", "dpl");
    expect(r.issues.some((i) => i.level === "info")).toBe(true);
  });
});
