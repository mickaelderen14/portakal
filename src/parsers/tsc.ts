import type { LabelElement } from "../types";

/**
 * Parse TSC/TSPL2 commands back into label elements for preview rendering.
 * Not a full parser — handles the most common commands for live editing.
 */
export function parseTSC(code: string): {
  widthDots: number;
  heightDots: number;
  elements: LabelElement[];
} {
  const elements: LabelElement[] = [];
  let widthDots = 320;
  let heightDots = 240;

  for (const rawLine of code.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line) continue;

    // SIZE w mm,h mm
    const sizeMatch = line.match(/^SIZE\s+(\d+)\s*mm\s*,\s*(\d+)\s*mm/i);
    if (sizeMatch) {
      widthDots = Math.round((Number(sizeMatch[1]) / 25.4) * 203);
      heightDots = Math.round((Number(sizeMatch[2]) / 25.4) * 203);
      continue;
    }

    // TEXT x,y,"font",rotation,xmul,ymul,"content"
    const textMatch = line.match(
      /^TEXT\s+(\d+)\s*,\s*(\d+)\s*,\s*"([^"]*)"\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*"([^"]*)"/i,
    );
    if (textMatch) {
      elements.push({
        type: "text",
        content: textMatch[7],
        options: {
          x: Number(textMatch[1]),
          y: Number(textMatch[2]),
          font: textMatch[3],
          rotation: Number(textMatch[4]) as any,
          size: Number(textMatch[5]),
        },
      });
      continue;
    }

    // BOX x1,y1,x2,y2,thickness[,radius]
    const boxMatch = line.match(
      /^BOX\s+(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)(?:\s*,\s*(\d+))?/i,
    );
    if (boxMatch) {
      const x = Number(boxMatch[1]);
      const y = Number(boxMatch[2]);
      elements.push({
        type: "box",
        options: {
          x,
          y,
          width: Number(boxMatch[3]) - x,
          height: Number(boxMatch[4]) - y,
          thickness: Number(boxMatch[5]),
          radius: boxMatch[6] ? Number(boxMatch[6]) : undefined,
        },
      });
      continue;
    }

    // BAR x,y,width,height
    const barMatch = line.match(/^BAR\s+(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i);
    if (barMatch) {
      const x = Number(barMatch[1]);
      const y = Number(barMatch[2]);
      const w = Number(barMatch[3]);
      const h = Number(barMatch[4]);
      elements.push({
        type: "line",
        options: {
          x1: x,
          y1: y,
          x2: x + (w > h ? w : 0),
          y2: y + (h > w ? h : 0),
          thickness: Math.min(w, h),
        },
      });
      continue;
    }

    // CIRCLE x,y,diameter,thickness
    const circleMatch = line.match(/^CIRCLE\s+(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i);
    if (circleMatch) {
      elements.push({
        type: "circle",
        options: {
          x: Number(circleMatch[1]),
          y: Number(circleMatch[2]),
          diameter: Number(circleMatch[3]),
          thickness: Number(circleMatch[4]),
        },
      });
      continue;
    }

    // DIAGONAL x1,y1,x2,y2,thickness
    const diagMatch = line.match(
      /^DIAGONAL\s+(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i,
    );
    if (diagMatch) {
      elements.push({
        type: "line",
        options: {
          x1: Number(diagMatch[1]),
          y1: Number(diagMatch[2]),
          x2: Number(diagMatch[3]),
          y2: Number(diagMatch[4]),
          thickness: Number(diagMatch[5]),
        },
      });
      continue;
    }
  }

  return { widthDots, heightDots, elements };
}
