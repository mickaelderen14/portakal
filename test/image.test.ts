import { describe, expect, it } from "vitest";
import {
  rgbaToGrayscale,
  ditherThreshold,
  ditherFloydSteinberg,
  ditherAtkinson,
  ditherOrdered,
  packBitmap,
  imageToMonochrome,
} from "../src/image";

describe("rgbaToGrayscale", () => {
  it("converts white pixel to 255", () => {
    const rgba = new Uint8Array([255, 255, 255, 255]);
    const gray = rgbaToGrayscale(rgba, 1, 1);
    expect(gray[0]).toBe(255);
  });

  it("converts black pixel to 0", () => {
    const rgba = new Uint8Array([0, 0, 0, 255]);
    const gray = rgbaToGrayscale(rgba, 1, 1);
    expect(gray[0]).toBe(0);
  });

  it("converts red pixel using BT.601", () => {
    const rgba = new Uint8Array([255, 0, 0, 255]);
    const gray = rgbaToGrayscale(rgba, 1, 1);
    expect(gray[0]).toBe(76); // 0.299 * 255 ≈ 76
  });

  it("composites transparent pixel on white background", () => {
    const rgba = new Uint8Array([0, 0, 0, 0]); // fully transparent
    const gray = rgbaToGrayscale(rgba, 1, 1);
    expect(gray[0]).toBe(255); // white background
  });

  it("composites semi-transparent black on white", () => {
    const rgba = new Uint8Array([0, 0, 0, 128]); // 50% transparent black
    const gray = rgbaToGrayscale(rgba, 1, 1);
    expect(gray[0]).toBeGreaterThan(120);
    expect(gray[0]).toBeLessThan(135);
  });

  it("handles multiple pixels", () => {
    const rgba = new Uint8Array([
      0,
      0,
      0,
      255, // black
      255,
      255,
      255,
      255, // white
      128,
      128,
      128,
      255, // gray
    ]);
    const gray = rgbaToGrayscale(rgba, 3, 1);
    expect(gray[0]).toBe(0);
    expect(gray[1]).toBe(255);
    expect(gray[2]).toBe(128);
  });
});

describe("ditherThreshold", () => {
  it("converts values below threshold to 0", () => {
    const gray = new Uint8Array([0, 50, 127]);
    const result = ditherThreshold(gray, 3, 1, 128);
    expect(result[0]).toBe(0);
    expect(result[1]).toBe(0);
    expect(result[2]).toBe(0);
  });

  it("converts values at/above threshold to 255", () => {
    const gray = new Uint8Array([128, 200, 255]);
    const result = ditherThreshold(gray, 3, 1, 128);
    expect(result[0]).toBe(255);
    expect(result[1]).toBe(255);
    expect(result[2]).toBe(255);
  });

  it("uses custom threshold", () => {
    const gray = new Uint8Array([100]);
    expect(ditherThreshold(gray, 1, 1, 50)[0]).toBe(255);
    expect(ditherThreshold(gray, 1, 1, 150)[0]).toBe(0);
  });
});

describe("ditherFloydSteinberg", () => {
  it("returns only 0 and 255 values", () => {
    const gray = new Uint8Array([100, 150, 200, 50, 180, 30, 220, 90, 160]);
    const result = ditherFloydSteinberg(gray, 3, 3);
    for (let i = 0; i < result.length; i++) {
      expect(result[i] === 0 || result[i] === 255).toBe(true);
    }
  });

  it("all-black input stays black", () => {
    const gray = new Uint8Array([0, 0, 0, 0]);
    const result = ditherFloydSteinberg(gray, 2, 2);
    for (let i = 0; i < result.length; i++) {
      expect(result[i]).toBe(0);
    }
  });

  it("all-white input stays white", () => {
    const gray = new Uint8Array([255, 255, 255, 255]);
    const result = ditherFloydSteinberg(gray, 2, 2);
    for (let i = 0; i < result.length; i++) {
      expect(result[i]).toBe(255);
    }
  });

  it("50% gray produces roughly equal black and white", () => {
    const size = 100;
    const gray = new Uint8Array(size * size).fill(128);
    const result = ditherFloydSteinberg(gray, size, size);
    let blackCount = 0;
    for (let i = 0; i < result.length; i++) {
      if (result[i] === 0) blackCount++;
    }
    const ratio = blackCount / result.length;
    expect(ratio).toBeGreaterThan(0.35);
    expect(ratio).toBeLessThan(0.65);
  });
});

describe("ditherAtkinson", () => {
  it("returns only 0 and 255 values", () => {
    const gray = new Uint8Array([100, 150, 200, 50]);
    const result = ditherAtkinson(gray, 2, 2);
    for (let i = 0; i < result.length; i++) {
      expect(result[i] === 0 || result[i] === 255).toBe(true);
    }
  });

  it("preserves contrast better — dark values stay dark", () => {
    const gray = new Uint8Array(16).fill(30); // very dark
    const result = ditherAtkinson(gray, 4, 4);
    let blackCount = 0;
    for (let i = 0; i < result.length; i++) {
      if (result[i] === 0) blackCount++;
    }
    expect(blackCount).toBeGreaterThan(12); // mostly black
  });
});

describe("ditherOrdered", () => {
  it("returns only 0 and 255 values", () => {
    const gray = new Uint8Array([100, 150, 200, 50]);
    const result = ditherOrdered(gray, 2, 2);
    for (let i = 0; i < result.length; i++) {
      expect(result[i] === 0 || result[i] === 255).toBe(true);
    }
  });

  it("produces deterministic output (no randomness)", () => {
    const gray = new Uint8Array([100, 150, 200, 50, 180, 30, 220, 90, 160]);
    const r1 = ditherOrdered(gray, 3, 3);
    const r2 = ditherOrdered(gray, 3, 3);
    expect(r1).toEqual(r2);
  });
});

describe("packBitmap", () => {
  it("packs 8 pixels into 1 byte", () => {
    // 0=black, 255=white → bit 1=black, 0=white
    const dithered = new Uint8Array([0, 255, 0, 255, 0, 255, 0, 255]);
    const bmp = packBitmap(dithered, 8, 1);
    expect(bmp.bytesPerRow).toBe(1);
    expect(bmp.data[0]).toBe(0b10101010); // MSB first
  });

  it("pads incomplete byte", () => {
    const dithered = new Uint8Array([0, 0, 0]); // 3 pixels
    const bmp = packBitmap(dithered, 3, 1);
    expect(bmp.bytesPerRow).toBe(1);
    expect(bmp.data[0]).toBe(0b11100000); // 3 black + 5 padding zeros
  });

  it("handles multi-row bitmap", () => {
    const dithered = new Uint8Array([
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0, // row 0: all black
      255,
      255,
      255,
      255,
      255,
      255,
      255,
      255, // row 1: all white
    ]);
    const bmp = packBitmap(dithered, 8, 2);
    expect(bmp.data[0]).toBe(0xff); // all black
    expect(bmp.data[1]).toBe(0x00); // all white
  });

  it("sets correct MonochromeBitmap fields", () => {
    const dithered = new Uint8Array(16 * 10); // 16x10
    const bmp = packBitmap(dithered, 16, 10);
    expect(bmp.width).toBe(16);
    expect(bmp.height).toBe(10);
    expect(bmp.bytesPerRow).toBe(2);
    expect(bmp.data.length).toBe(20);
  });
});

describe("imageToMonochrome", () => {
  it("converts RGBA to MonochromeBitmap with default threshold", () => {
    const rgba = new Uint8Array([
      0,
      0,
      0,
      255, // black pixel
      255,
      255,
      255,
      255, // white pixel
    ]);
    const bmp = imageToMonochrome(rgba, 2, 1);
    expect(bmp.width).toBe(2);
    expect(bmp.height).toBe(1);
    expect(bmp.bytesPerRow).toBe(1);
    expect(bmp.data[0]).toBe(0b10000000); // first pixel black
  });

  it("supports floyd-steinberg dithering", () => {
    const rgba = new Uint8Array(8 * 8 * 4).fill(128); // gray image
    // Set alpha to 255
    for (let i = 0; i < 8 * 8; i++) rgba[i * 4 + 3] = 255;
    const bmp = imageToMonochrome(rgba, 8, 8, { dither: "floyd-steinberg" });
    expect(bmp.width).toBe(8);
    expect(bmp.height).toBe(8);
  });

  it("supports atkinson dithering", () => {
    const rgba = new Uint8Array(4 * 4 * 4);
    for (let i = 0; i < 16; i++) {
      rgba[i * 4] = rgba[i * 4 + 1] = rgba[i * 4 + 2] = 100;
      rgba[i * 4 + 3] = 255;
    }
    const bmp = imageToMonochrome(rgba, 4, 4, { dither: "atkinson" });
    expect(bmp.data.length).toBe(4); // 1 byte per row * 4 rows
  });

  it("supports ordered dithering", () => {
    const rgba = new Uint8Array(4 * 4 * 4);
    for (let i = 0; i < 16; i++) {
      rgba[i * 4] = rgba[i * 4 + 1] = rgba[i * 4 + 2] = 150;
      rgba[i * 4 + 3] = 255;
    }
    const bmp = imageToMonochrome(rgba, 4, 4, { dither: "ordered" });
    expect(bmp.data.length).toBe(4);
  });

  it("handles transparent image (composites on white)", () => {
    const rgba = new Uint8Array([0, 0, 0, 0]); // fully transparent
    const bmp = imageToMonochrome(rgba, 1, 1);
    expect(bmp.data[0]).toBe(0); // white (transparent = white bg)
  });
});
