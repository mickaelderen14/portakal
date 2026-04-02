import type { LabelElement, ResolvedLabel } from "../types";

const STX = "\x02";

function dplRotation(r: number): number {
  switch (r) {
    case 90:
      return 2;
    case 180:
      return 3;
    case 270:
      return 4;
    default:
      return 1;
  }
}

function compileElement(el: LabelElement): string {
  switch (el.type) {
    case "text": {
      const o = el.options;
      const x = o.x ?? 0;
      const y = o.y ?? 0;
      const rot = dplRotation(o.rotation ?? 0);
      const font = o.font ?? "9";
      const h = String(o.size ?? 1).padStart(4, "0");
      const w = h;
      const col = String(x).padStart(4, "0");
      const row = String(y).padStart(4, "0");
      return `${rot}${col}${row}${h}${w}000${font}${el.content}`;
    }

    case "image": {
      const o = el.options;
      const x = o.x ?? 0;
      const y = o.y ?? 0;
      const bmp = el.bitmap;
      const col = String(x).padStart(4, "0");
      const row = String(y).padStart(4, "0");
      const w = String(bmp.bytesPerRow).padStart(4, "0");
      const h = String(bmp.height).padStart(4, "0");
      return `1${col}${row}${h}${w}0005`;
    }

    case "box": {
      const o = el.options;
      const t = o.thickness ?? 1;
      const col = String(o.x).padStart(4, "0");
      const row = String(o.y).padStart(4, "0");
      const w = String(o.width).padStart(4, "0");
      const h = String(o.height).padStart(4, "0");
      const th = String(t).padStart(4, "0");
      return `1${col}${row}${h}${w}${th}2l`;
    }

    case "line": {
      const o = el.options;
      const t = o.thickness ?? 1;
      if (o.y1 === o.y2) {
        const col = String(Math.min(o.x1, o.x2)).padStart(4, "0");
        const row = String(o.y1).padStart(4, "0");
        const w = String(Math.abs(o.x2 - o.x1)).padStart(4, "0");
        const th = String(t).padStart(4, "0");
        return `1${col}${row}${th}${w}0002l`;
      }
      if (o.x1 === o.x2) {
        const col = String(o.x1).padStart(4, "0");
        const row = String(Math.min(o.y1, o.y2)).padStart(4, "0");
        const h = String(Math.abs(o.y2 - o.y1)).padStart(4, "0");
        const th = String(t).padStart(4, "0");
        return `1${col}${row}${h}${th}0002l`;
      }
      return "";
    }

    case "circle":
      return "";

    case "ellipse":
    case "reverse":
    case "erase":
      return "";
    case "raw":
      return typeof el.content === "string" ? el.content : "";
  }
}

/** Compile a resolved label to DPL (Datamax/Honeywell) command string */
export function compileToDPL(label: ResolvedLabel): string {
  const lines: string[] = [];

  lines.push(`${STX}L`);
  lines.push(`D${String(label.density).padStart(2, "0")}`);
  lines.push(`S${String(label.speed).padStart(2, "0")}`);
  lines.push(`A${String(label.widthDots).padStart(4, "0")}`);

  for (const el of label.elements) {
    const line = compileElement(el);
    if (line) lines.push(line);
  }

  lines.push(`Q${String(label.copies).padStart(4, "0")}`);
  lines.push("E");
  return lines.join("\r\n") + "\r\n";
}
