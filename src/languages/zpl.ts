import type { LabelElement, ResolvedLabel } from "../types";

function zplBarcodeCommand(type: string): string {
  const map: Record<string, string> = {
    code128: "^BC",
    code128a: "^BC",
    code128b: "^BC",
    code128c: "^BC",
    code39: "^B3",
    code93: "^BA",
    ean13: "^BE",
    ean8: "^B8",
    upca: "^BU",
    upce: "^B9",
    itf: "^B2",
    itf14: "^B2",
    codabar: "^BK",
    msi: "^BM",
    plessey: "^BP",
    code11: "^B1",
    postnet: "^BZ",
    planet: "^B5",
    gs1_128: "^BC",
    gs1_databar: "^BR",
  };
  return map[type] ?? "^BC";
}

function zplRotation(r: number): string {
  switch (r) {
    case 90:
      return "R";
    case 180:
      return "I";
    case 270:
      return "B";
    default:
      return "N";
  }
}

function compileElement(el: LabelElement): string {
  switch (el.type) {
    case "text": {
      const o = el.options;
      const x = o.x ?? 0;
      const y = o.y ?? 0;
      const rot = zplRotation(o.rotation ?? 0);
      const font = o.font ?? "0";
      const h = (o.size ?? 1) * 30;
      const w = h;

      let cmd = `^FO${x},${y}`;
      cmd += `^A${font}${rot},${h},${w}`;

      if (o.maxWidth) {
        const justify = o.align === "center" ? "C" : o.align === "right" ? "R" : "L";
        const lines = Math.ceil(h / 30) + 5; // rough estimate
        cmd += `^FB${o.maxWidth},${lines},0,${justify}`;
      }

      if (o.reverse) {
        cmd += "^FR";
      }

      cmd += `^FD${el.content}^FS`;
      return cmd;
    }

    case "barcode": {
      const o = el.options;
      const x = o.x ?? 0;
      const y = o.y ?? 0;
      const rot = zplRotation(o.rotation ?? 0);
      const height = o.height ?? 80;
      const readable = o.readable !== false ? "Y" : "N";
      const barcodeCmd = zplBarcodeCommand(o.type);

      let cmd = `^FO${x},${y}`;
      if (o.narrowWidth) {
        cmd += `^BY${o.narrowWidth}`;
      }
      cmd += `${barcodeCmd}${rot},${height},${readable}`;
      cmd += `^FD${el.data}^FS`;
      return cmd;
    }

    case "qrcode": {
      const o = el.options;
      const x = o.x ?? 0;
      const y = o.y ?? 0;
      const model = o.model ?? 2;
      const size = o.size ?? 5;
      const ecc = o.ecc ?? "M";
      const eccPrefix = ecc === "L" ? "QL" : ecc === "Q" ? "QQ" : ecc === "H" ? "QH" : "QM";

      let cmd = `^FO${x},${y}`;
      cmd += `^BQN,${model},${size}`;
      cmd += `^FD${eccPrefix},${el.data}^FS`;
      return cmd;
    }

    case "image": {
      const o = el.options;
      const x = o.x ?? 0;
      const y = o.y ?? 0;
      const bmp = el.bitmap;
      const totalBytes = bmp.data.length;

      // ASCII hex encoding (simplest, widest compatibility)
      let hex = "";
      for (let i = 0; i < bmp.data.length; i++) {
        hex += bmp.data[i].toString(16).padStart(2, "0").toUpperCase();
      }

      return `^FO${x},${y}^GFA,${totalBytes},${totalBytes},${bmp.bytesPerRow},${hex}^FS`;
    }

    case "box": {
      const o = el.options;
      const t = o.thickness ?? 1;
      const r = o.radius ?? 0;
      return `^FO${o.x},${o.y}^GB${o.width},${o.height},${t},B,${r}^FS`;
    }

    case "line": {
      const o = el.options;
      const t = o.thickness ?? 1;
      if (o.y1 === o.y2) {
        const w = Math.abs(o.x2 - o.x1);
        return `^FO${Math.min(o.x1, o.x2)},${o.y1}^GB${w},${t},${t}^FS`;
      }
      if (o.x1 === o.x2) {
        const h = Math.abs(o.y2 - o.y1);
        return `^FO${o.x1},${Math.min(o.y1, o.y2)}^GB${t},${h},${t}^FS`;
      }
      // ZPL ^GD for diagonal
      const w = Math.abs(o.x2 - o.x1);
      const h = Math.abs(o.y2 - o.y1);
      const dir = o.x2 > o.x1 === o.y2 > o.y1 ? "R" : "L";
      return `^FO${Math.min(o.x1, o.x2)},${Math.min(o.y1, o.y2)}^GD${w},${h},${t},B,${dir}^FS`;
    }

    case "circle": {
      const o = el.options;
      const t = o.thickness ?? 1;
      return `^FO${o.x},${o.y}^GC${o.diameter},${t},B^FS`;
    }

    case "raw":
      return typeof el.content === "string" ? el.content : "";
  }
}

/** Compile a resolved label to ZPL II command string */
export function compileToZPL(label: ResolvedLabel): string {
  const lines: string[] = [];

  lines.push("^XA");
  lines.push(`^PW${label.widthDots}`);
  if (label.heightDots > 0) {
    lines.push(`^LL${label.heightDots}`);
  }
  lines.push(`^PR${label.speed}`);
  lines.push(`~SD${label.density * 2}`); // ZPL darkness 0-30, TSPL 0-15
  lines.push("^CI28"); // UTF-8 mode

  for (const el of label.elements) {
    lines.push(compileElement(el));
  }

  lines.push(`^PQ${label.copies}`);
  lines.push("^XZ");
  return lines.join("\n") + "\n";
}
