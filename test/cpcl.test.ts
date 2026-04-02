import { describe, expect, it } from "vitest";
import { label } from "../src/builder";

describe("CPCL compiler", () => {
  it("generates session header with DPI and height", () => {
    const output = label({ width: 40, height: 30 }).toCPCL();
    // 40mm at 203 DPI = 320, 30mm = 240
    expect(output).toContain("! 0 203 203 240 1");
  });

  it("generates TONE from density", () => {
    const output = label({ width: 40, height: 30, density: 8 }).toCPCL();
    expect(output).toContain("TONE 107"); // Math.round(8/15*200)
  });

  it("generates SPEED", () => {
    const output = label({ width: 40, height: 30, speed: 6 }).toCPCL();
    expect(output).toContain("SPEED 6");
  });

  it("generates PAGE-WIDTH", () => {
    const output = label({ width: 40, height: 30 }).toCPCL();
    expect(output).toContain("PAGE-WIDTH 320");
  });

  it("ends with PRINT", () => {
    const output = label({ width: 40, height: 30 }).toCPCL();
    expect(output.trimEnd().endsWith("PRINT")).toBe(true);
  });

  it("uses CRLF line endings", () => {
    const output = label({ width: 40, height: 30 }).toCPCL();
    expect(output).toContain("\r\n");
  });

  it("generates TEXT command", () => {
    const output = label({ width: 40, height: 30 })
      .text("Hello", { x: 10, y: 20, font: "4", size: 2 })
      .toCPCL();
    expect(output).toContain("TEXT 4 2 10 20\r\nHello");
  });

  it("generates rotated TEXT command", () => {
    const output = label({ width: 40, height: 30 })
      .text("Rotated", { x: 10, y: 20, rotation: 90 })
      .toCPCL();
    expect(output).toContain("TEXT90 2 0 10 20\r\nRotated");
  });

  it("generates TEXT270", () => {
    const output = label({ width: 40, height: 30 })
      .text("Flip", { x: 10, y: 20, rotation: 270 })
      .toCPCL();
    expect(output).toContain("TEXT270");
  });

  it("generates BOX command", () => {
    const output = label({ width: 40, height: 30 })
      .box({ x: 5, y: 5, width: 300, height: 200, thickness: 2 })
      .toCPCL();
    expect(output).toContain("BOX 5 5 305 205 2");
  });

  it("generates LINE command", () => {
    const output = label({ width: 40, height: 30 })
      .line({ x1: 10, y1: 50, x2: 300, y2: 50, thickness: 2 })
      .toCPCL();
    expect(output).toContain("LINE 10 50 300 50 2");
  });

  it("generates diagonal LINE", () => {
    const output = label({ width: 40, height: 30 })
      .line({ x1: 0, y1: 0, x2: 100, y2: 200, thickness: 1 })
      .toCPCL();
    expect(output).toContain("LINE 0 0 100 200 1");
  });

  it("generates EG (expanded graphics) for images", () => {
    const bitmap = {
      data: new Uint8Array([0xff, 0x00, 0xaa, 0x55]),
      width: 16,
      height: 2,
      bytesPerRow: 2,
    };
    const output = label({ width: 40, height: 30 }).image(bitmap, { x: 10, y: 20 }).toCPCL();
    expect(output).toContain("EG 2 2 10 20 FF00AA55");
  });

  it("handles raw command passthrough", () => {
    const output = label({ width: 40, height: 30 }).raw("CENTER").toCPCL();
    expect(output).toContain("CENTER");
  });

  it("handles multiple copies via header", () => {
    const output = label({ width: 40, height: 30, copies: 3 }).toCPCL();
    expect(output).toContain("! 0 203 203 240 3");
  });

  it("uses default height 400 for receipt mode", () => {
    const output = label({ width: 80 }).toCPCL();
    expect(output).toContain("! 0 203 203 400 1");
  });
});
