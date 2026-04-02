import type { LabelElement, ResolvedLabel } from "../types";

function compileElement(el: LabelElement): string {
  switch (el.type) {
    case "text": {
      const o = el.options;
      const x = o.x ?? 0;
      const y = o.y ?? 0;
      const font = o.font ?? "2";
      const size = o.size ?? 0;
      const rotation = o.rotation ?? 0;

      const cmd = rotation === 0 ? "TEXT" : `TEXT${rotation}`;
      return `${cmd} ${font} ${size} ${x} ${y}\r\n${el.content}`;
    }

    case "image": {
      const o = el.options;
      const x = o.x ?? 0;
      const y = o.y ?? 0;
      const bmp = el.bitmap;

      // CPCL EG (Expanded Graphics) — hex-encoded bitmap
      let hex = "";
      for (let i = 0; i < bmp.data.length; i++) {
        hex += bmp.data[i].toString(16).padStart(2, "0").toUpperCase();
      }

      return `EG ${bmp.bytesPerRow} ${bmp.height} ${x} ${y} ${hex}`;
    }

    case "box": {
      const o = el.options;
      const t = o.thickness ?? 1;
      const x2 = o.x + o.width;
      const y2 = o.y + o.height;
      return `BOX ${o.x} ${o.y} ${x2} ${y2} ${t}`;
    }

    case "line": {
      const o = el.options;
      const t = o.thickness ?? 1;
      return `LINE ${o.x1} ${o.y1} ${o.x2} ${o.y2} ${t}`;
    }

    case "circle":
      // CPCL doesn't support circles natively
      return "";

    case "raw":
      return typeof el.content === "string" ? el.content : "";
  }
}

/** Compile a resolved label to CPCL command string */
export function compileToCPCL(label: ResolvedLabel): string {
  const lines: string[] = [];

  // Session header: ! offset hDPI vDPI height copies
  const dpi = label.dpi;
  const height = label.heightDots > 0 ? label.heightDots : 400;
  lines.push(`! 0 ${dpi} ${dpi} ${height} ${label.copies}`);

  // Darkness
  lines.push(`TONE ${Math.round((label.density / 15) * 200)}`);

  // Speed
  lines.push(`SPEED ${label.speed}`);

  // Page width
  lines.push(`PAGE-WIDTH ${label.widthDots}`);

  for (const el of label.elements) {
    const line = compileElement(el);
    if (line) {
      lines.push(line);
    }
  }

  lines.push("PRINT");
  return lines.join("\r\n") + "\r\n";
}
