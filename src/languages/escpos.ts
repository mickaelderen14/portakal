import type { LabelElement, ResolvedLabel } from "../types";

/** ESC/POS command byte constants */
const ESC = 0x1b;
const GS = 0x1d;
const LF = 0x0a;

function escposBarcodeType(type: string): number {
  const map: Record<string, number> = {
    upca: 65,
    upce: 66,
    ean13: 67,
    ean8: 68,
    code39: 69,
    itf: 70,
    codabar: 71,
    code93: 72,
    code128: 73,
  };
  return map[type] ?? 73; // default Code 128
}

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

      // Alignment
      buf.write(ESC, 0x61, alignByte(o.align));

      // Bold
      if (o.bold) {
        buf.write(ESC, 0x45, 1);
      }

      // Underline
      if (o.underline) {
        buf.write(ESC, 0x2d, 1);
      }

      // Character size (GS !)
      if (o.size && o.size > 1) {
        const mag = o.size - 1;
        buf.write(GS, 0x21, ((mag & 0x07) << 4) | (mag & 0x07));
      }

      // Reverse
      if (o.reverse) {
        buf.write(GS, 0x42, 1);
      }

      // Text content
      buf.writeText(el.content);
      buf.write(LF);

      // Reset formatting
      if (o.bold) buf.write(ESC, 0x45, 0);
      if (o.underline) buf.write(ESC, 0x2d, 0);
      if (o.size && o.size > 1) buf.write(GS, 0x21, 0);
      if (o.reverse) buf.write(GS, 0x42, 0);
      buf.write(ESC, 0x61, 0); // reset alignment
      break;
    }

    case "barcode": {
      const o = el.options;

      // Alignment
      if (o.x != null) {
        // ESC/POS doesn't have x/y positioning in standard mode
        // Use alignment instead
      }

      // Set barcode height (GS h)
      const height = o.height ?? 80;
      buf.write(GS, 0x68, height & 0xff);

      // Set barcode width (GS w)
      const width = o.narrowWidth ?? 3;
      buf.write(GS, 0x77, width & 0xff);

      // HRI position (GS H)
      const hri =
        o.readable !== false
          ? o.readablePosition === "above"
            ? 1
            : o.readablePosition === "both"
              ? 3
              : 2
          : 0;
      buf.write(GS, 0x48, hri);

      // Print barcode (GS k m n data) — format B
      const m = escposBarcodeType(o.type);
      const data = new TextEncoder().encode(el.data);
      buf.write(GS, 0x6b, m, data.length);
      buf.writeBytes(data);
      break;
    }

    case "qrcode": {
      const o = el.options;
      const data = new TextEncoder().encode(el.data);
      const pL = (data.length + 3) & 0xff;
      const pH = ((data.length + 3) >> 8) & 0xff;

      // Model (GS ( k): set model 2
      buf.write(GS, 0x28, 0x6b, 4, 0, 0x31, 0x41, o.model ?? 2, 0);

      // Module size
      buf.write(GS, 0x28, 0x6b, 3, 0, 0x31, 0x43, o.size ?? 6);

      // Error correction
      const eccMap: Record<string, number> = { L: 48, M: 49, Q: 50, H: 51 };
      buf.write(GS, 0x28, 0x6b, 3, 0, 0x31, 0x45, eccMap[o.ecc ?? "M"]);

      // Store data
      buf.write(GS, 0x28, 0x6b, pL, pH, 0x31, 0x50, 0x30);
      buf.writeBytes(data);

      // Print
      buf.write(GS, 0x28, 0x6b, 3, 0, 0x31, 0x51, 0x30);
      break;
    }

    case "image": {
      const bmp = el.bitmap;
      const xL = bmp.bytesPerRow & 0xff;
      const xH = (bmp.bytesPerRow >> 8) & 0xff;
      const yL = bmp.height & 0xff;
      const yH = (bmp.height >> 8) & 0xff;

      // Set line spacing to 0 (prevents white gaps between raster rows)
      buf.write(ESC, 0x33, 0);

      // GS v 0 (raster bit image)
      buf.write(GS, 0x76, 0x30, 0, xL, xH, yL, yH);
      buf.writeBytes(bmp.data);

      // Restore default line spacing
      buf.write(ESC, 0x32);
      break;
    }

    case "box":
    case "line":
    case "circle":
      // ESC/POS doesn't natively support geometric shapes in standard mode
      // These would need to be rendered as images — skip for now
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

/** Compile a resolved label to ESC/POS byte sequence */
export function compileToESCPOS(label: ResolvedLabel): Uint8Array {
  const buf = new ByteBuffer();

  // Initialize printer
  buf.write(ESC, 0x40); // ESC @

  for (const el of label.elements) {
    compileElement(el, buf);
  }

  return buf.toUint8Array();
}
