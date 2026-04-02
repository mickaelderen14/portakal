import { describe, expect, it } from "vitest";
import { parseTSC } from "../src/parsers/tsc";

describe("parseTSC", () => {
  it("parses SIZE command", () => {
    const result = parseTSC("SIZE 40 mm,30 mm");
    expect(result.widthDots).toBe(320);
    expect(result.heightDots).toBe(240);
  });

  it("parses TEXT command", () => {
    const result = parseTSC('TEXT 10,20,"3",0,2,2,"Hello World"');
    expect(result.elements).toHaveLength(1);
    expect(result.elements[0].type).toBe("text");
    if (result.elements[0].type === "text") {
      expect(result.elements[0].content).toBe("Hello World");
      expect(result.elements[0].options.x).toBe(10);
      expect(result.elements[0].options.y).toBe(20);
      expect(result.elements[0].options.size).toBe(2);
    }
  });

  it("parses BOX command", () => {
    const result = parseTSC("BOX 5,5,305,205,2");
    expect(result.elements).toHaveLength(1);
    if (result.elements[0].type === "box") {
      expect(result.elements[0].options.x).toBe(5);
      expect(result.elements[0].options.y).toBe(5);
      expect(result.elements[0].options.width).toBe(300);
      expect(result.elements[0].options.height).toBe(200);
      expect(result.elements[0].options.thickness).toBe(2);
    }
  });

  it("parses BAR as line", () => {
    const result = parseTSC("BAR 10,50,290,2");
    expect(result.elements).toHaveLength(1);
    expect(result.elements[0].type).toBe("line");
  });

  it("parses CIRCLE", () => {
    const result = parseTSC("CIRCLE 100,100,50,2");
    expect(result.elements).toHaveLength(1);
    if (result.elements[0].type === "circle") {
      expect(result.elements[0].options.diameter).toBe(50);
    }
  });

  it("parses full label", () => {
    const code = `SIZE 40 mm,30 mm
GAP 3 mm,0 mm
SPEED 4
DENSITY 8
DIRECTION 0
CLS
TEXT 10,10,"2",0,2,2,"ACME Corp"
TEXT 10,35,"2",0,1,1,"SKU: PRD-00123"
BOX 5,5,315,235,2
BAR 5,55,310,1
PRINT 1`;
    const result = parseTSC(code);
    expect(result.widthDots).toBe(320);
    expect(result.heightDots).toBe(240);
    expect(result.elements).toHaveLength(4); // 2 texts + 1 box + 1 line
  });

  it("ignores unknown commands", () => {
    const result = parseTSC("CLS\nPRINT 1\nGAP 3 mm,0 mm\nSPEED 4");
    expect(result.elements).toHaveLength(0);
  });
});
