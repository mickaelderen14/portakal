import type { LabelElement } from "../types";

/**
 * CPCL Parser — converts CPCL commands back to structured data.
 * Based on CPCL Programmer's Manual (Zebra P/N 45541L-001).
 * Session-based: starts with ! header, ends with PRINT.
 */

export interface CPCLParseResult {
  commands: { cmd: string; params: string[] }[];
  widthDots: number;
  heightDots: number;
  dpi: number;
  elements: LabelElement[];
  warnings: string[];
}

export function parseCPCL(code: string): CPCLParseResult {
  const commands: { cmd: string; params: string[] }[] = [];
  const elements: LabelElement[] = [];
  const warnings: string[] = [];
  let widthDots = 576;
  let heightDots = 400;
  let dpi = 203;

  const lines = code.split(/\r?\n/);
  let i = 0;

  while (i < lines.length) {
    const line = lines[i].trim();
    i++;
    if (!line) continue;

    // Session header: ! offset hDPI vDPI height copies
    if (line.startsWith("!") && !line.startsWith("!U")) {
      const parts = line.slice(1).trim().split(/\s+/);
      if (parts.length >= 4) {
        dpi = Number(parts[1]) || 203;
        heightDots = Number(parts[3]) || 400;
      }
      commands.push({ cmd: "!", params: parts });
      continue;
    }

    const upper = line.toUpperCase();
    const parts = line.split(/\s+/);
    const cmd = parts[0].toUpperCase();

    commands.push({ cmd, params: parts.slice(1) });

    // TEXT/TEXT90/TEXT180/TEXT270 font size x y\ndata
    if (cmd.startsWith("TEXT") || cmd === "T" || cmd === "VTEXT") {
      const font = parts[1] ?? "2";
      const size = Number(parts[2] ?? 0);
      const x = Number(parts[3] ?? 0);
      const y = Number(parts[4] ?? 0);
      // Next line is data
      if (i < lines.length) {
        const data = lines[i].trim();
        i++;
        elements.push({
          type: "text",
          content: data,
          options: { x, y, font, size: size || 1 },
        });
      }
      continue;
    }

    if (cmd === "BOX") {
      const x1 = Number(parts[1] ?? 0);
      const y1 = Number(parts[2] ?? 0);
      const x2 = Number(parts[3] ?? 0);
      const y2 = Number(parts[4] ?? 0);
      const t = Number(parts[5] ?? 1);
      elements.push({
        type: "box",
        options: { x: x1, y: y1, width: x2 - x1, height: y2 - y1, thickness: t },
      });
      continue;
    }

    if (cmd === "LINE") {
      const x1 = Number(parts[1] ?? 0);
      const y1 = Number(parts[2] ?? 0);
      const x2 = Number(parts[3] ?? 0);
      const y2 = Number(parts[4] ?? 0);
      const t = Number(parts[5] ?? 1);
      elements.push({
        type: "line",
        options: { x1, y1, x2, y2, thickness: t },
      });
      continue;
    }

    if (cmd === "PAGE-WIDTH") {
      widthDots = Number(parts[1]) || widthDots;
      continue;
    }

    // BARCODE, EG, CG, PRINT, CENTER, LEFT, RIGHT, etc. — recognized but no preview
  }

  return { commands, widthDots, heightDots, dpi, elements, warnings };
}
