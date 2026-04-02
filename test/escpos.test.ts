import { describe, expect, it } from "vitest";
import { label } from "../src/builder";

describe("ESC/POS compiler", () => {
  it("starts with ESC @ (initialize)", () => {
    const output = label({ width: 80 }).toESCPOS();
    expect(output[0]).toBe(0x1b); // ESC
    expect(output[1]).toBe(0x40); // @
  });

  it("returns Uint8Array", () => {
    const output = label({ width: 80 }).toESCPOS();
    expect(output).toBeInstanceOf(Uint8Array);
  });

  it("generates text with line feed", () => {
    const output = label({ width: 80 }).text("Hello").toESCPOS();

    // Should contain "Hello" + LF
    const text = new TextDecoder().decode(output);
    expect(text).toContain("Hello");
  });

  it("generates bold text", () => {
    const output = label({ width: 80 }).text("Bold", { bold: true }).toESCPOS();

    // ESC E 1 (bold on)
    const bytes = Array.from(output);
    const boldOnIdx = bytes.indexOf(0x45, bytes.indexOf(0x1b));
    expect(boldOnIdx).toBeGreaterThan(-1);
  });

  it("generates center alignment", () => {
    const output = label({ width: 80 }).text("Centered", { align: "center" }).toESCPOS();

    // ESC a 1 (center)
    const bytes = Array.from(output);
    expect(bytes).toContain(0x61); // 'a'
  });

  it("generates character size magnification", () => {
    const output = label({ width: 80 }).text("Big", { size: 3 }).toESCPOS();

    // GS ! n where n = ((2 << 4) | 2) = 0x22
    const bytes = Array.from(output);
    const gsIdx = bytes.findIndex((b, i) => b === 0x1d && bytes[i + 1] === 0x21);
    expect(gsIdx).toBeGreaterThan(-1);
    expect(bytes[gsIdx + 2]).toBe(0x22); // (3-1) << 4 | (3-1)
  });

  it("generates Code 128 barcode", () => {
    const output = label({ width: 80 })
      .barcode("123456", { type: "code128", height: 80 })
      .toESCPOS();

    const bytes = Array.from(output);
    // GS h 80 (set barcode height)
    const hIdx = bytes.findIndex((b, i) => b === 0x1d && bytes[i + 1] === 0x68);
    expect(hIdx).toBeGreaterThan(-1);
    expect(bytes[hIdx + 2]).toBe(80);

    // GS k 73 (Code 128)
    const kIdx = bytes.findIndex((b, i) => b === 0x1d && bytes[i + 1] === 0x6b);
    expect(kIdx).toBeGreaterThan(-1);
    expect(bytes[kIdx + 2]).toBe(73); // Code 128 type
  });

  it("generates QR code multi-step commands", () => {
    const output = label({ width: 80 }).qrcode("test", { size: 6, ecc: "M" }).toESCPOS();

    const bytes = Array.from(output);

    // GS ( k — should appear multiple times (model, size, ecc, store, print)
    let count = 0;
    for (let i = 0; i < bytes.length - 1; i++) {
      if (bytes[i] === 0x1d && bytes[i + 1] === 0x28 && bytes[i + 2] === 0x6b) {
        count++;
      }
    }
    expect(count).toBe(5); // model + size + ecc + store + print
  });

  it("generates raster image with GS v 0", () => {
    const bitmap = {
      data: new Uint8Array([0xff, 0x00, 0xff, 0x00]),
      width: 8,
      height: 4,
      bytesPerRow: 1,
    };

    const output = label({ width: 80 }).image(bitmap).toESCPOS();

    const bytes = Array.from(output);

    // Should set line spacing to 0: ESC 3 0
    const ls0Idx = bytes.findIndex(
      (b, i) => b === 0x1b && bytes[i + 1] === 0x33 && bytes[i + 2] === 0,
    );
    expect(ls0Idx).toBeGreaterThan(-1);

    // GS v 0 (raster bit image)
    const gvIdx = bytes.findIndex(
      (b, i) => b === 0x1d && bytes[i + 1] === 0x76 && bytes[i + 2] === 0x30,
    );
    expect(gvIdx).toBeGreaterThan(-1);

    // Restore line spacing: ESC 2
    const ls2Idx = bytes.findIndex((b, i) => b === 0x1b && bytes[i + 1] === 0x32);
    expect(ls2Idx).toBeGreaterThan(gvIdx);
  });

  it("generates raw bytes passthrough", () => {
    const raw = new Uint8Array([0x1b, 0x70, 0x00, 0x32, 0x32]); // Cash drawer kick
    const output = label({ width: 80 }).raw(raw).toESCPOS();

    const bytes = Array.from(output);
    // Should contain the raw bytes somewhere after ESC @
    expect(bytes).toContain(0x70);
  });
});
