import type { DitherAlgorithm, MonochromeBitmap } from "./types";

/** Convert RGBA pixel data to grayscale (BT.601 luminance, alpha composited on white) */
export function rgbaToGrayscale(
  rgba: Uint8Array | Uint8ClampedArray,
  width: number,
  height: number,
): Uint8Array {
  const gray = new Uint8Array(width * height);
  for (let i = 0; i < width * height; i++) {
    const r = rgba[i * 4]!;
    const g = rgba[i * 4 + 1]!;
    const b = rgba[i * 4 + 2]!;
    const a = rgba[i * 4 + 3]!;
    // Composite alpha on white background
    const rr = (r * a + 255 * (255 - a)) / 255;
    const gg = (g * a + 255 * (255 - a)) / 255;
    const bb = (b * a + 255 * (255 - a)) / 255;
    // BT.601 luminance
    gray[i] = Math.round(0.299 * rr + 0.587 * gg + 0.114 * bb);
  }
  return gray;
}

/** Simple threshold: pixels below threshold become black */
export function ditherThreshold(
  gray: Uint8Array,
  width: number,
  height: number,
  threshold = 128,
): Uint8Array {
  const out = new Uint8Array(gray.length);
  for (let i = 0; i < gray.length; i++) {
    out[i] = gray[i]! < threshold ? 0 : 255;
  }
  return out;
}

/** Floyd-Steinberg error diffusion dithering */
export function ditherFloydSteinberg(gray: Uint8Array, width: number, height: number): Uint8Array {
  const err = new Float32Array(gray.length);
  for (let i = 0; i < gray.length; i++) err[i] = gray[i]!;

  for (let y = 0; y < height; y++) {
    const ltr = (y & 1) === 0;
    const xStart = ltr ? 0 : width - 1;
    const xEnd = ltr ? width : -1;
    const xStep = ltr ? 1 : -1;

    for (let x = xStart; x !== xEnd; x += xStep) {
      const idx = y * width + x;
      const oldVal = err[idx]!;
      const newVal = oldVal < 128 ? 0 : 255;
      err[idx] = newVal;
      const e = oldVal - newVal;

      const nx = x + xStep;
      if (nx >= 0 && nx < width) err[y * width + nx] += (e * 7) / 16;
      if (y + 1 < height) {
        if (x - xStep >= 0 && x - xStep < width) err[(y + 1) * width + x - xStep] += (e * 3) / 16;
        err[(y + 1) * width + x] += (e * 5) / 16;
        if (nx >= 0 && nx < width) err[(y + 1) * width + nx] += (e * 1) / 16;
      }
    }
  }

  const out = new Uint8Array(gray.length);
  for (let i = 0; i < gray.length; i++) out[i] = err[i]! < 128 ? 0 : 255;
  return out;
}

/** Atkinson dithering — preserves more contrast (75% error propagation) */
export function ditherAtkinson(gray: Uint8Array, width: number, height: number): Uint8Array {
  const err = new Float32Array(gray.length);
  for (let i = 0; i < gray.length; i++) err[i] = gray[i]!;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      const oldVal = err[idx]!;
      const newVal = oldVal < 128 ? 0 : 255;
      err[idx] = newVal;
      const e = (oldVal - newVal) / 8;

      // 6 neighbors, each gets 1/8 of error (total 6/8 = 75%)
      if (x + 1 < width) err[idx + 1] += e;
      if (x + 2 < width) err[idx + 2] += e;
      if (y + 1 < height) {
        if (x - 1 >= 0) err[(y + 1) * width + x - 1] += e;
        err[(y + 1) * width + x] += e;
        if (x + 1 < width) err[(y + 1) * width + x + 1] += e;
      }
      if (y + 2 < height) {
        err[(y + 2) * width + x] += e;
      }
    }
  }

  const out = new Uint8Array(gray.length);
  for (let i = 0; i < gray.length; i++) out[i] = err[i]! < 128 ? 0 : 255;
  return out;
}

/** 4x4 Bayer ordered dithering matrix */
const BAYER4 = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
];

/** Ordered dithering using 4x4 Bayer matrix */
export function ditherOrdered(gray: Uint8Array, width: number, height: number): Uint8Array {
  const out = new Uint8Array(gray.length);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const threshold = (BAYER4[y % 4]![x % 4]! / 16) * 255;
      out[y * width + x] = gray[y * width + x]! > threshold ? 255 : 0;
    }
  }
  return out;
}

/** Pack 8-bit dithered pixels (0 or 255) into 1-bit MonochromeBitmap */
export function packBitmap(dithered: Uint8Array, width: number, height: number): MonochromeBitmap {
  const bytesPerRow = Math.ceil(width / 8);
  const data = new Uint8Array(bytesPerRow * height);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const isBlack = dithered[y * width + x] === 0;
      if (isBlack) {
        const byteIdx = y * bytesPerRow + Math.floor(x / 8);
        const bitIdx = 7 - (x % 8);
        data[byteIdx]! |= 1 << bitIdx;
      }
    }
  }

  return { data, width, height, bytesPerRow };
}

/** Convert RGBA image to MonochromeBitmap with specified dithering algorithm */
export function imageToMonochrome(
  rgba: Uint8Array | Uint8ClampedArray,
  width: number,
  height: number,
  options: { dither?: DitherAlgorithm; threshold?: number } = {},
): MonochromeBitmap {
  const gray = rgbaToGrayscale(rgba, width, height);
  const algorithm = options.dither ?? "threshold";

  let dithered: Uint8Array;
  switch (algorithm) {
    case "floyd-steinberg":
      dithered = ditherFloydSteinberg(gray, width, height);
      break;
    case "atkinson":
      dithered = ditherAtkinson(gray, width, height);
      break;
    case "ordered":
      dithered = ditherOrdered(gray, width, height);
      break;
    default:
      dithered = ditherThreshold(gray, width, height, options.threshold ?? 128);
      break;
  }

  return packBitmap(dithered, width, height);
}
