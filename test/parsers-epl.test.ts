import { describe, expect, it } from "vitest";
import { parseEPL } from "../src/parsers/epl";

describe("EPL Parser", () => {
  it("parses N (clear)", () => {
    const r = parseEPL("N");
    expect(r.commands[0].cmd).toBe("N");
  });

  it("parses q (width)", () => {
    const r = parseEPL("q832");
    expect(r.widthDots).toBe(832);
  });

  it("parses Q (height,gap)", () => {
    const r = parseEPL("Q240,24");
    expect(r.heightDots).toBe(240);
  });

  it("parses A (text)", () => {
    const r = parseEPL('A10,20,0,3,2,2,N,"Hello EPL"');
    expect(r.elements).toHaveLength(1);
    if (r.elements[0].type === "text") {
      expect(r.elements[0].content).toBe("Hello EPL");
      expect(r.elements[0].options.x).toBe(10);
      expect(r.elements[0].options.y).toBe(20);
    }
  });

  it("parses A with reverse", () => {
    const r = parseEPL('A10,20,0,2,1,1,R,"Reverse"');
    if (r.elements[0].type === "text") {
      expect(r.elements[0].options.reverse).toBe(true);
    }
  });

  it("parses X (box)", () => {
    const r = parseEPL("X5,5,205,105,2");
    expect(r.elements).toHaveLength(1);
    if (r.elements[0].type === "box") {
      expect(r.elements[0].options.x).toBe(5);
      expect(r.elements[0].options.width).toBe(200);
      expect(r.elements[0].options.thickness).toBe(2);
    }
  });

  it("parses LO (line)", () => {
    const r = parseEPL("LO10,50,290,2");
    expect(r.elements).toHaveLength(1);
    expect(r.elements[0].type).toBe("line");
  });

  it("parses full label", () => {
    const r = parseEPL(`N
q320
Q240,24
S4
D8
A10,10,0,2,2,2,N,"ACME Corp"
A10,35,0,2,1,1,N,"SKU: 123"
X5,5,315,235,2
LO5,55,310,1
P1`);
    expect(r.widthDots).toBe(320);
    expect(r.heightDots).toBe(240);
    expect(r.elements.length).toBeGreaterThanOrEqual(3);
  });
});
