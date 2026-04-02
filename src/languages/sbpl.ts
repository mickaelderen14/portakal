import type { LabelElement, ResolvedLabel } from "../types";

const ESC = "\x1b";

function sbplRotation(r: number): string {
  switch (r) {
    case 90:
      return `${ESC}%1`;
    case 180:
      return `${ESC}%2`;
    case 270:
      return `${ESC}%3`;
    default:
      return `${ESC}%0`;
  }
}

function pad4(n: number): string {
  return String(n).padStart(4, "0");
}

function compileElement(el: LabelElement): string[] {
  const cmds: string[] = [];

  switch (el.type) {
    case "text": {
      const o = el.options;
      const x = o.x ?? 0;
      const y = o.y ?? 0;
      cmds.push(`${ESC}H${pad4(x)}`);
      cmds.push(`${ESC}V${pad4(y)}`);
      if (o.rotation) cmds.push(sbplRotation(o.rotation));
      const hMag = String(o.size ?? 1).padStart(2, "0");
      cmds.push(`${ESC}L${hMag}${hMag}`);
      cmds.push(`${ESC}K9B${el.content}`);
      break;
    }

    case "image": {
      const o = el.options;
      const x = o.x ?? 0;
      const y = o.y ?? 0;
      const bmp = el.bitmap;
      cmds.push(`${ESC}H${pad4(x)}`);
      cmds.push(`${ESC}V${pad4(y)}`);
      const size = String(bmp.data.length).padStart(5, "0");
      let hex = "";
      for (let i = 0; i < bmp.data.length; i++) {
        hex += bmp.data[i].toString(16).padStart(2, "0").toUpperCase();
      }
      cmds.push(`${ESC}GM${size},${hex}`);
      break;
    }

    case "box": {
      const o = el.options;
      const t = o.thickness ?? 1;
      cmds.push(`${ESC}H${pad4(o.x)}`);
      cmds.push(`${ESC}V${pad4(o.y)}`);
      cmds.push(`${ESC}FW${String(t).padStart(2, "0")}V${pad4(o.height)}H${pad4(o.width)}`);
      break;
    }

    case "line": {
      const o = el.options;
      const t = o.thickness ?? 1;
      cmds.push(`${ESC}H${pad4(Math.min(o.x1, o.x2))}`);
      cmds.push(`${ESC}V${pad4(Math.min(o.y1, o.y2))}`);
      if (o.y1 === o.y2) {
        cmds.push(`${ESC}FW${String(t).padStart(2, "0")}H${pad4(Math.abs(o.x2 - o.x1))}`);
      } else {
        cmds.push(`${ESC}FW${String(t).padStart(2, "0")}V${pad4(Math.abs(o.y2 - o.y1))}`);
      }
      break;
    }

    case "circle":
      break;

    case "ellipse":
    case "reverse":
    case "erase":
      break;

    case "raw":
      if (typeof el.content === "string") cmds.push(el.content);
      break;
  }

  return cmds;
}

/** Compile a resolved label to SBPL (SATO) command string */
export function compileToSBPL(label: ResolvedLabel): string {
  const lines: string[] = [];

  lines.push(`${ESC}A`);
  lines.push(`${ESC}CS`);

  for (const el of label.elements) {
    lines.push(...compileElement(el));
  }

  if (label.copies > 1) {
    lines.push(`${ESC}Q${label.copies}`);
  }
  lines.push(`${ESC}Z`);
  return lines.join("\r\n") + "\r\n";
}
