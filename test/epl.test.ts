import { describe, expect, it } from "vitest";
import { label } from "../src/builder";

describe("EPL2 compiler", () => {
  it("generates basic label structure", () => {
    const output = label({ width: 40, height: 30 }).toEPL();

    expect(output).toContain("N\n"); // Clear buffer
    expect(output).toContain("q320\n"); // Width in dots
    expect(output).toContain("Q240,"); // Height + gap
    expect(output).toContain("S4\n"); // Speed
    expect(output).toContain("D8\n"); // Density
    expect(output).toContain("P1\n"); // Print 1 copy
  });

  it("generates text command", () => {
    const output = label({ width: 40, height: 30 })
      .text("Hello EPL", { x: 10, y: 20, font: "3", size: 2 })
      .toEPL();

    expect(output).toContain('A10,20,0,3,2,2,N,"Hello EPL"');
  });

  it("generates reverse text", () => {
    const output = label({ width: 40, height: 30 })
      .text("Reverse", { x: 10, y: 20, reverse: true })
      .toEPL();

    expect(output).toContain('A10,20,0,2,1,1,R,"Reverse"');
  });

  it("generates barcode command", () => {
    const output = label({ width: 40, height: 30 })
      .barcode("12345", { type: "code128", x: 10, y: 50, height: 60 })
      .toEPL();

    expect(output).toContain('B10,50,0,0,2,4,60,B,"12345"');
  });

  it("generates Code 39 barcode", () => {
    const output = label({ width: 40, height: 30 })
      .barcode("ABC123", { type: "code39", x: 10, y: 50, height: 80 })
      .toEPL();

    expect(output).toContain("B10,50,0,3,");
  });

  it("generates EAN-13 barcode", () => {
    const output = label({ width: 40, height: 30 })
      .barcode("4006381333931", { type: "ean13", x: 10, y: 50 })
      .toEPL();

    expect(output).toContain(",E30,");
  });

  it("generates QR code via b command", () => {
    const output = label({ width: 40, height: 30 })
      .qrcode("https://example.com", { x: 10, y: 100 })
      .toEPL();

    expect(output).toContain('b10,100,0,Q,2,6,"https://example.com"');
  });

  it("generates box command", () => {
    const output = label({ width: 40, height: 30 })
      .box({ x: 5, y: 5, width: 200, height: 100, thickness: 2 })
      .toEPL();

    expect(output).toContain("X5,5,205,105,2");
  });

  it("generates horizontal line", () => {
    const output = label({ width: 40, height: 30 })
      .line({ x1: 10, y1: 50, x2: 300, y2: 50, thickness: 2 })
      .toEPL();

    expect(output).toContain("LO10,50,290,2");
  });

  it("generates image GW command header", () => {
    const bitmap = {
      data: new Uint8Array([0xff, 0x00]),
      width: 8,
      height: 2,
      bytesPerRow: 1,
    };

    const output = label({ width: 40, height: 30 }).image(bitmap, { x: 10, y: 10 }).toEPL();

    expect(output).toContain("GW10,10,1,2");
  });

  it("handles multiple copies", () => {
    const output = label({ width: 40, height: 30, copies: 10 }).toEPL();
    expect(output).toContain("P10");
  });

  it("handles raw passthrough", () => {
    const output = label({ width: 40, height: 30 }).raw("OD").toEPL();

    expect(output).toContain("OD");
  });
});
