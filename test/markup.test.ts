import { describe, expect, it } from "vitest";
import { markup } from "../src/markup";

describe("markup — HTML-like label DSL", () => {
  it("parses basic label with text", () => {
    const tsc = markup(`
      <label width="40mm" height="30mm">
        <text x="10" y="10" size="2">Hello World</text>
      </label>
    `).toTSC();

    expect(tsc).toContain("SIZE 40 mm,30 mm");
    expect(tsc).toContain('"Hello World"');
    expect(tsc).toContain("PRINT");
  });

  it("parses text with bold and underline", () => {
    const tsc = markup(`
      <label width="40mm" height="30mm">
        <text x="10" y="10" bold underline>Styled Text</text>
      </label>
    `).toTSC();

    expect(tsc).toContain('"Styled Text"');
  });

  it("parses self-closing tags", () => {
    const tsc = markup(`
      <label width="40mm" height="30mm">
        <line x1="5" y1="50" x2="315" y2="50" thickness="2" />
        <box x="5" y="5" width="310" height="230" border="2" />
        <circle x="250" y="150" diameter="60" />
      </label>
    `).toTSC();

    expect(tsc).toContain("BAR");
    expect(tsc).toContain("BOX");
    expect(tsc).toContain("CIRCLE");
  });

  it("parses box with radius", () => {
    const tsc = markup(`
      <label width="40mm" height="30mm">
        <box x="10" y="10" width="200" height="100" border="2" radius="5" />
      </label>
    `).toTSC();

    expect(tsc).toContain(",5");
  });

  it("parses ellipse", () => {
    const tsc = markup(`
      <label width="40mm" height="30mm">
        <ellipse x="50" y="50" width="100" height="60" thickness="2" />
      </label>
    `).toTSC();

    expect(tsc).toContain("ELLIPSE");
  });

  it("parses reverse and erase", () => {
    const tsc = markup(`
      <label width="40mm" height="30mm">
        <reverse x="10" y="10" width="200" height="30" />
        <erase x="50" y="50" width="20" height="20" />
      </label>
    `).toTSC();

    expect(tsc).toContain("REVERSE");
    expect(tsc).toContain("ERASE");
  });

  it("compiles to ZPL", () => {
    const zpl = markup(`
      <label width="40mm" height="30mm">
        <text x="50" y="50" size="2">ZPL Label</text>
        <box x="10" y="10" width="300" height="220" border="2" />
      </label>
    `).toZPL();

    expect(zpl).toContain("^XA");
    expect(zpl).toContain("^FDZPL Label^FS");
    expect(zpl).toContain("^GB");
    expect(zpl).toContain("^XZ");
  });

  it("compiles to EPL", () => {
    const epl = markup(`
      <label width="40mm" height="30mm">
        <text x="10" y="10">EPL Label</text>
      </label>
    `).toEPL();

    expect(epl).toContain("N");
    expect(epl).toContain('"EPL Label"');
  });

  it("compiles to ESC/POS", () => {
    const escpos = markup(`
      <label width="80mm">
        <text align="center" size="2" bold>My Store</text>
        <text>Total: $29.48</text>
      </label>
    `).toESCPOS();

    expect(escpos).toBeInstanceOf(Uint8Array);
    expect(escpos.length).toBeGreaterThan(10);
  });

  it("compiles to all 9 languages", () => {
    const m = markup(`
      <label width="40mm" height="30mm">
        <text x="10" y="10">Test</text>
      </label>
    `);

    expect(m.toTSC()).toContain("TEXT");
    expect(m.toZPL()).toContain("^XA");
    expect(m.toEPL()).toContain("N");
    expect(m.toCPCL()).toContain("PRINT");
    expect(m.toDPL()).toContain("E");
    expect(m.toSBPL()).toContain("\x1bA");
    expect(m.toIPL()).toContain("\x02");
    expect(m.toESCPOS()).toBeInstanceOf(Uint8Array);
    expect(m.toStarPRNT()).toBeInstanceOf(Uint8Array);
  });

  it("renders preview", () => {
    const svg = markup(`
      <label width="40mm" height="30mm">
        <text x="10" y="10" size="2">Preview Test</text>
        <box x="5" y="5" width="310" height="230" border="2" />
      </label>
    `).toPreview();

    expect(svg).toContain("<svg");
    expect(svg).toContain("Preview Test");
  });

  it("uses printer profile", () => {
    const resolved = markup(`
      <label printer="tsc-te310" width="40mm" height="30mm">
        <text x="10" y="10">Profile Test</text>
      </label>
    `).resolve();

    expect(resolved.dpi).toBe(300); // TE310 is 300 DPI
  });

  it("parses label config attributes", () => {
    const resolved = markup(`
      <label width="100mm" height="50mm" dpi="300" speed="6" density="12" copies="3">
        <text x="10" y="10">Config Test</text>
      </label>
    `).resolve();

    expect(resolved.dpi).toBe(300);
    expect(resolved.speed).toBe(6);
    expect(resolved.density).toBe(12);
    expect(resolved.copies).toBe(3);
  });

  it("handles multiple text elements", () => {
    const tsc = markup(`
      <label width="40mm" height="30mm">
        <text x="10" y="10" size="2">Title</text>
        <text x="10" y="35">Subtitle</text>
        <text x="10" y="55" size="1">Description</text>
      </label>
    `).toTSC();

    expect(tsc).toContain('"Title"');
    expect(tsc).toContain('"Subtitle"');
    expect(tsc).toContain('"Description"');
  });

  it("handles complex shipping label", () => {
    const tsc = markup(`
      <label width="100mm" height="150mm" dpi="203">
        <text x="10" y="10" size="2" bold>FROM: Warehouse A</text>
        <text x="10" y="40" size="3" bold>TO: John Doe</text>
        <text x="10" y="80">123 Main St, New York, NY 10001</text>
        <line x1="5" y1="110" x2="780" y2="110" thickness="2" />
        <box x="5" y="5" width="780" height="1170" border="3" />
      </label>
    `).toTSC();

    expect(tsc).toContain("SIZE 100 mm,150 mm");
    expect(tsc).toContain('"FROM: Warehouse A"');
    expect(tsc).toContain('"TO: John Doe"');
    expect(tsc).toContain("BOX");
    expect(tsc).toContain("BAR");
  });

  it("throws on missing <label> root", () => {
    expect(() => markup("<text>Hello</text>")).toThrow("must contain a <label>");
  });

  it("handles raw content", () => {
    const tsc = markup(`
      <label width="40mm" height="30mm">
        <raw>SET CUTTER ON</raw>
      </label>
    `).toTSC();

    expect(tsc).toContain("SET CUTTER ON");
  });
});
