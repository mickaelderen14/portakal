import type { LabelElement, ResolvedLabel } from "../types";

/** Map barcode type to TSPL barcode type code */
function tscBarcodeType(type: string): string {
  const map: Record<string, string> = {
    code128: "128",
    code128a: "128M",
    code128b: "128M",
    code128c: "128M",
    code39: "39",
    code93: "93",
    ean13: "EAN13",
    ean8: "EAN8",
    upca: "UPCA",
    upce: "UPCE",
    itf: "25",
    itf14: "ITF14",
    codabar: "CODA",
    msi: "MSI",
    plessey: "PLESSEY",
    code11: "CODE11",
    postnet: "POST",
    planet: "PLANET",
    gs1_128: "EAN128",
    gs1_databar: "RSS",
  };
  return map[type] ?? "128";
}

function compileElement(el: LabelElement): string {
  switch (el.type) {
    case "text": {
      const o = el.options;
      const x = o.x ?? 0;
      const y = o.y ?? 0;
      const font = o.font ?? "2";
      const rotation = o.rotation ?? 0;
      const xMul = o.xScale ?? o.size ?? 1;
      const yMul = o.yScale ?? o.size ?? 1;
      if (o.maxWidth) {
        const align = o.align === "center" ? 2 : o.align === "right" ? 3 : 1;
        const spacing = o.lineSpacing ?? 0;
        return `BLOCK ${x},${y},${o.maxWidth},${o.maxWidth},"${font}",${rotation},${xMul},${yMul},${spacing},${align},"${el.content}"`;
      }

      return `TEXT ${x},${y},"${font}",${rotation},${xMul},${yMul},"${el.content}"`;
    }

    case "barcode": {
      const o = el.options;
      const x = o.x ?? 0;
      const y = o.y ?? 0;
      const type = tscBarcodeType(o.type);
      const height = o.height ?? 80;
      const readable = o.readable !== false ? 1 : 0;
      const rotation = o.rotation ?? 0;
      const narrow = o.narrowWidth ?? 2;
      const wide = o.wideWidth ?? 4;
      return `BARCODE ${x},${y},"${type}",${height},${readable},${rotation},${narrow},${wide},"${el.data}"`;
    }

    case "qrcode": {
      const o = el.options;
      const x = o.x ?? 0;
      const y = o.y ?? 0;
      const ecc = o.ecc ?? "M";
      const size = o.size ?? 6;
      const rotation = o.rotation ?? 0;
      const model = o.model ?? 2;
      return `QRCODE ${x},${y},${ecc},${size},A,${rotation},M${model},S7,"${el.data}"`;
    }

    case "image": {
      const o = el.options;
      const x = o.x ?? 0;
      const y = o.y ?? 0;
      const bmp = el.bitmap;
      // TSC BITMAP: width in bytes, height in dots, mode 0=overwrite
      // TSC polarity: 0=black (print), 1=white — INVERTED from standard
      const inverted = new Uint8Array(bmp.data.length);
      for (let i = 0; i < bmp.data.length; i++) {
        inverted[i] = ~bmp.data[i] & 0xff;
      }
      // We return a placeholder; actual binary data handling needs special treatment
      return `BITMAP ${x},${y},${bmp.bytesPerRow},${bmp.height},0,`;
    }

    case "box": {
      const o = el.options;
      const x2 = o.x + o.width;
      const y2 = o.y + o.height;
      const t = o.thickness ?? 1;
      if (o.radius) {
        return `BOX ${o.x},${o.y},${x2},${y2},${t},${o.radius}`;
      }
      return `BOX ${o.x},${o.y},${x2},${y2},${t}`;
    }

    case "line": {
      const o = el.options;
      const t = o.thickness ?? 1;
      // TSC doesn't have a LINE command directly — use DIAGONAL or BAR
      if (o.y1 === o.y2) {
        // Horizontal line = BAR
        const w = Math.abs(o.x2 - o.x1);
        return `BAR ${Math.min(o.x1, o.x2)},${o.y1},${w},${t}`;
      }
      if (o.x1 === o.x2) {
        // Vertical line = BAR
        const h = Math.abs(o.y2 - o.y1);
        return `BAR ${o.x1},${Math.min(o.y1, o.y2)},${t},${h}`;
      }
      return `DIAGONAL ${o.x1},${o.y1},${o.x2},${o.y2},${t}`;
    }

    case "circle": {
      const o = el.options;
      const t = o.thickness ?? 1;
      return `CIRCLE ${o.x},${o.y},${o.diameter},${t}`;
    }

    case "raw":
      return typeof el.content === "string" ? el.content : "";
  }
}

/** Compile a resolved label to TSC/TSPL2 command string */
export function compileToTSC(label: ResolvedLabel): string {
  const lines: string[] = [];
  const dpi = label.dpi;
  const wMM = Math.round((label.widthDots / dpi) * 25.4);
  const hMM = label.heightDots > 0 ? Math.round((label.heightDots / dpi) * 25.4) : 0;
  const gMM = Math.round((label.gapDots / dpi) * 25.4);

  lines.push(`SIZE ${wMM} mm,${hMM} mm`);
  lines.push(`GAP ${gMM} mm,0 mm`);
  lines.push(`SPEED ${label.speed}`);
  lines.push(`DENSITY ${label.density}`);
  lines.push(`DIRECTION ${label.direction}`);
  lines.push("CLS");

  for (const el of label.elements) {
    lines.push(compileElement(el));
  }

  lines.push(`PRINT ${label.copies}`);
  return lines.join("\r\n") + "\r\n";
}
