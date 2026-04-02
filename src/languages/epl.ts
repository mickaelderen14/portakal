import type { LabelElement, ResolvedLabel } from "../types";

function eplBarcodeType(type: string): string {
  const map: Record<string, string> = {
    code128: "0",
    code128a: "0A",
    code128b: "0B",
    code128c: "0C",
    code39: "3",
    code93: "9",
    ean13: "E30",
    ean8: "E80",
    upca: "UA0",
    upce: "UE0",
    itf: "1",
    itf14: "1",
    codabar: "K",
    msi: "M",
    postnet: "P",
  };
  return map[type] ?? "0";
}

function eplRotation(r: number): number {
  switch (r) {
    case 90:
      return 1;
    case 180:
      return 2;
    case 270:
      return 3;
    default:
      return 0;
  }
}

function compileElement(el: LabelElement): string {
  switch (el.type) {
    case "text": {
      const o = el.options;
      const x = o.x ?? 0;
      const y = o.y ?? 0;
      const rot = eplRotation(o.rotation ?? 0);
      // EPL fonts: 1-5 (8x12 to 32x48)
      const font = o.font ?? "2";
      const hMul = o.xScale ?? o.size ?? 1;
      const vMul = o.yScale ?? o.size ?? 1;
      const reverse = o.reverse ? "R" : "N";
      return `A${x},${y},${rot},${font},${hMul},${vMul},${reverse},"${el.content}"`;
    }

    case "barcode": {
      const o = el.options;
      const x = o.x ?? 0;
      const y = o.y ?? 0;
      const rot = eplRotation(o.rotation ?? 0);
      const type = eplBarcodeType(o.type);
      const narrow = o.narrowWidth ?? 2;
      const wide = o.wideWidth ?? 4;
      const height = o.height ?? 80;
      const readable = o.readable !== false ? "B" : "N";
      return `B${x},${y},${rot},${type},${narrow},${wide},${height},${readable},"${el.data}"`;
    }

    case "qrcode": {
      // EPL2 QR code via 'b' command (newer firmware)
      const o = el.options;
      const x = o.x ?? 0;
      const y = o.y ?? 0;
      const rot = eplRotation(o.rotation ?? 0);
      const model = o.model ?? 2;
      const size = o.size ?? 6;
      return `b${x},${y},${rot},Q,${model},${size},"${el.data}"`;
    }

    case "image": {
      const o = el.options;
      const x = o.x ?? 0;
      const y = o.y ?? 0;
      const bmp = el.bitmap;
      // EPL GW: polarity INVERTED — 0=black, 1=white
      // We need to invert the bitmap data (done at compile time for the data portion)
      return `GW${x},${y},${bmp.bytesPerRow},${bmp.height}`;
    }

    case "box": {
      const o = el.options;
      const t = o.thickness ?? 1;
      const x2 = o.x + o.width;
      const y2 = o.y + o.height;
      return `X${o.x},${o.y},${x2},${y2},${t}`;
    }

    case "line": {
      const o = el.options;
      const t = o.thickness ?? 1;
      if (o.y1 === o.y2) {
        const w = Math.abs(o.x2 - o.x1);
        return `LO${Math.min(o.x1, o.x2)},${o.y1},${w},${t}`;
      }
      if (o.x1 === o.x2) {
        const h = Math.abs(o.y2 - o.y1);
        return `LO${o.x1},${Math.min(o.y1, o.y2)},${t},${h}`;
      }
      // EPL has no diagonal line — approximate with box
      return `LO${o.x1},${o.y1},${Math.abs(o.x2 - o.x1)},${t}`;
    }

    case "circle":
      // EPL doesn't support circles — skip
      return "";

    case "raw":
      return typeof el.content === "string" ? el.content : "";
  }
}

/** Compile a resolved label to EPL2 command string */
export function compileToEPL(label: ResolvedLabel): string {
  const lines: string[] = [];

  lines.push("N"); // Clear buffer
  lines.push(`q${label.widthDots}`); // Set width
  if (label.heightDots > 0) {
    lines.push(`Q${label.heightDots},${label.gapDots}`);
  }
  lines.push(`S${label.speed}`);
  lines.push(`D${label.density}`);

  for (const el of label.elements) {
    const line = compileElement(el);
    if (line) {
      lines.push(line);
    }
  }

  lines.push(`P${label.copies}`);
  return lines.join("\n") + "\n";
}
