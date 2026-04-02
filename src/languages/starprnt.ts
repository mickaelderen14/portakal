import type { LabelElement, ResolvedLabel } from "../types";

const ESC = 0x1b;
const LF = 0x0a;

function alignByte(align: string | undefined): number {
  switch (align) {
    case "center":
      return 1;
    case "right":
      return 2;
    default:
      return 0;
  }
}

class ByteBuffer {
  private chunks: Uint8Array[] = [];

  write(...bytes: number[]): void {
    this.chunks.push(new Uint8Array(bytes));
  }

  writeBytes(data: Uint8Array): void {
    this.chunks.push(data);
  }

  writeText(text: string): void {
    this.writeBytes(new TextEncoder().encode(text));
  }

  toUint8Array(): Uint8Array {
    let totalLen = 0;
    for (const c of this.chunks) totalLen += c.length;
    const result = new Uint8Array(totalLen);
    let offset = 0;
    for (const c of this.chunks) {
      result.set(c, offset);
      offset += c.length;
    }
    return result;
  }
}

function compileElement(el: LabelElement, buf: ByteBuffer): void {
  switch (el.type) {
    case "text": {
      const o = el.options;

      // Star Line Mode alignment: ESC GS a n
      buf.write(ESC, 0x1d, 0x61, alignByte(o.align));

      // Bold: ESC E (on) / ESC F (off) — Star uses separate commands, no parameter
      if (o.bold) buf.write(ESC, 0x45);

      // Underline: ESC - n
      if (o.underline) buf.write(ESC, 0x2d, 1);

      // Size magnification: ESC i n n
      if (o.size && o.size > 1) {
        const h = o.size;
        const w = o.size;
        buf.write(ESC, 0x69, h & 0xff, w & 0xff);
      }

      buf.writeText(el.content);
      buf.write(LF);

      // Reset
      if (o.bold) buf.write(ESC, 0x46); // Bold off (ESC F)
      if (o.underline) buf.write(ESC, 0x2d, 0);
      if (o.size && o.size > 1) buf.write(ESC, 0x69, 1, 1);
      buf.write(ESC, 0x1d, 0x61, 0); // Reset alignment
      break;
    }

    case "image": {
      const bmp = el.bitmap;

      // Star Raster Mode
      // Enter raster mode: ESC * r A
      buf.write(ESC, 0x2a, 0x72, 0x41);

      // Send each row: b nL nH data
      for (let y = 0; y < bmp.height; y++) {
        const nL = bmp.bytesPerRow & 0xff;
        const nH = (bmp.bytesPerRow >> 8) & 0xff;
        buf.write(0x62, nL, nH);
        const rowStart = y * bmp.bytesPerRow;
        buf.writeBytes(bmp.data.slice(rowStart, rowStart + bmp.bytesPerRow));
      }

      // Exit raster mode: ESC * r B
      buf.write(ESC, 0x2a, 0x72, 0x42);
      break;
    }

    case "box":
    case "line":
    case "circle":
      break;

    case "raw":
      if (typeof el.content === "string") {
        buf.writeText(el.content);
      } else {
        buf.writeBytes(el.content);
      }
      break;
  }
}

/** Compile a resolved label to Star PRNT / Star Line Mode byte sequence */
export function compileToStarPRNT(label: ResolvedLabel): Uint8Array {
  const buf = new ByteBuffer();

  // Initialize: ESC @
  buf.write(ESC, 0x40);

  for (const el of label.elements) {
    compileElement(el, buf);
  }

  // Partial cut: ESC d 1
  buf.write(ESC, 0x64, 1);

  return buf.toUint8Array();
}
